/**
 * Read-only Shadownet smoke test for TezFinOracle's Pyth/NAC upstream lookup.
 *
 * Covers:
 *   1. Shadownet E2E Pyth/NAC smoke test: getPrice / get_price_with_timestamp /
 *      getValidatedPrice for BTC-USD, XTZ-USD, USDT-USD agree, are fresh (<= maxAge)
 *      and not in the future.
 *   2. Proxy mapping E2E: tzBTC-USD == BTC-USD, USDtz-USD == USDT-USD == USDt-USD,
 *      and WTZ-USD/OXTZ-USD/STXTZ-USD aliases still resolve to XTZ-USD.
 *
 * This is READ-ONLY: it only POSTs to
 * `/chains/main/blocks/head/helpers/scripts/run_script_view`, which simulates the view
 * without needing a signature, funded account, or write access to the node. It does NOT
 * perform admin configuration (see configure_pyth_oracle.js for that) and does NOT
 * require TEZOS_PRIVATE_KEY.
 *
 * Usage:
 *   DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.shadownet.json \
 *   node deploy/deploy_script/verify_shadownet_pyth_oracle.js
 *
 * Prerequisite: configure_pyth_oracle.js (or the equivalent manual admin calls) must have
 * already run against this contract, and the Pyth cache for BTC/XTZ/USDT on Etherlink must
 * be warm (see docs Etap 5 "Testnet Pyth update runner" if the cache is stale).
 */
const fs = require('fs');
const { config, resolveDeployResultPath } = require('./util.js');

const NATIVE_ASSETS = ['BTC-USD', 'XTZ-USD', 'USDT-USD'];
const PROXY_GROUPS = [
    { native: 'BTC-USD', proxies: ['tzBTC-USD'] },
    { native: 'USDT-USD', proxies: ['USDtz-USD', 'USDt-USD'] },
    { native: 'XTZ-USD', proxies: ['WTZ-USD', 'OXTZ-USD', 'STXTZ-USD'] },
];

async function rpcJson(rpc, pathname, options = {}) {
    const response = await fetch(`${rpc.replace(/\/$/, '')}${pathname}`, options);
    if (!response.ok) {
        throw new Error(`RPC ${pathname} returned ${response.status}: ${await response.text()}`);
    }
    return response.json();
}

async function runView(rpc, { contract, view, input, chainId, source }) {
    const body = {
        contract,
        view,
        input,
        chain_id: chainId,
        source,
        payer: source,
        gas: '1040000',
        unparsing_mode: 'Readable',
    };
    const result = await rpcJson(rpc, '/chains/main/blocks/head/helpers/scripts/run_script_view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    return result.data;
}

// getPrice / getValidatedPrice both return `pair(timestamp, nat)`.
function parseTimestampNatPair(node, label) {
    const args = node?.args;
    const timestampStr = args?.[0]?.string;
    const priceStr = args?.[1]?.int;
    if (!timestampStr || priceStr === undefined) {
        throw new Error(`${label}: unexpected view result shape: ${JSON.stringify(node)}`);
    }
    const timestamp = Math.floor(Date.parse(timestampStr) / 1000);
    const price = BigInt(priceStr);
    return { timestamp, price };
}

// get_price_with_timestamp returns `pair(nat, timestamp)` (swapped order).
function parseNatTimestampPair(node, label) {
    const args = node?.args;
    const priceStr = args?.[0]?.int;
    const timestampStr = args?.[1]?.string;
    if (priceStr === undefined || !timestampStr) {
        throw new Error(`${label}: unexpected view result shape: ${JSON.stringify(node)}`);
    }
    const timestamp = Math.floor(Date.parse(timestampStr) / 1000);
    const price = BigInt(priceStr);
    return { timestamp, price };
}

async function fetchAssetPrice(rpc, oracleAddress, chainId, source, headTimestamp, maxAgeSeconds, asset) {
    const getPriceNode = await runView(rpc, {
        contract: oracleAddress, view: 'getPrice', input: { string: asset }, chainId, source,
    });
    const legacyNode = await runView(rpc, {
        contract: oracleAddress, view: 'get_price_with_timestamp', input: { string: asset }, chainId, source,
    });

    const viaGetPrice = parseTimestampNatPair(getPriceNode, `getPrice(${asset})`);
    const viaLegacy = parseNatTimestampPair(legacyNode, `get_price_with_timestamp(${asset})`);

    if (viaGetPrice.price !== viaLegacy.price) {
        throw new Error(
            `${asset}: getPrice price ${viaGetPrice.price} != get_price_with_timestamp price ${viaLegacy.price}`,
        );
    }
    if (viaGetPrice.timestamp !== viaLegacy.timestamp) {
        throw new Error(
            `${asset}: getPrice timestamp ${viaGetPrice.timestamp} != get_price_with_timestamp timestamp ${viaLegacy.timestamp}`,
        );
    }
    if (viaGetPrice.price <= 0n) {
        throw new Error(`${asset}: normalized price must be > 0, got ${viaGetPrice.price}`);
    }
    if (viaGetPrice.timestamp <= 0) {
        throw new Error(`${asset}: publish timestamp must be > 0`);
    }
    if (viaGetPrice.timestamp > headTimestamp) {
        throw new Error(
            `${asset}: publish timestamp ${viaGetPrice.timestamp} is ahead of chain head ${headTimestamp}`,
        );
    }
    const ageSeconds = headTimestamp - viaGetPrice.timestamp;
    if (ageSeconds > maxAgeSeconds) {
        throw new Error(`${asset}: price is stale (${ageSeconds}s old; maximum ${maxAgeSeconds}s)`);
    }

    console.log(
        `[OK]   ${asset.padEnd(10)} price=${viaGetPrice.price.toString().padStart(14)} ` +
        `timestamp=${viaGetPrice.timestamp} age=${ageSeconds}s`,
    );
    return viaGetPrice;
}

async function verifyGetValidatedPrice(rpc, oracleAddress, chainId, source, comptroller, cToken, asset) {
    // TValidatedPriceRequest = {comptroller, cToken, requestedAsset, previousPrice,
    // previousTimestamp}, but SmartPy lays out compiled record fields by ASCII field-name
    // order, not declaration order: pair(pair(cToken, comptroller),
    // pair(previousPrice, pair(previousTimestamp, requestedAsset))). Verified against the
    // live contract's script (view getValidatedPrice) on Shadownet before writing this.
    const input = {
        prim: 'Pair',
        args: [
            { prim: 'Pair', args: [{ string: cToken }, { string: comptroller }] },
            { prim: 'Pair', args: [
                { int: '0' },
                { prim: 'Pair', args: [{ string: '1970-01-01T00:00:00Z' }, { string: asset }] },
            ] },
        ],
    };
    const node = await runView(rpc, { contract: oracleAddress, view: 'getValidatedPrice', input, chainId, source });
    const parsed = parseTimestampNatPair(node, `getValidatedPrice(${asset})`);
    console.log(`[OK]   getValidatedPrice(${asset}) -> price=${parsed.price} timestamp=${parsed.timestamp}`);
    return parsed;
}

async function main() {
    const deployResultPath = resolveDeployResultPath();
    const manifest = JSON.parse(fs.readFileSync(deployResultPath, 'utf8'));
    const oracleAddress = manifest.TezFinOracle;
    if (!oracleAddress) {
        throw new Error(`${deployResultPath} is missing TezFinOracle`);
    }
    const maxAgeSeconds = Number(
        process.env.PYTH_MAX_AGE_SECONDS || manifest.PythMaxAgeSeconds || manifest.TezFinMaxPriceAgeSeconds || 60,
    );
    const rpc = process.env.TEZOS_RPC || config.tezosNode;
    const source = process.env.TEZOS_SOURCE || manifest.OriginatorAddress;
    if (!source) {
        throw new Error('No source/payer address available (set TEZOS_SOURCE or OriginatorAddress in the manifest)');
    }

    const [chainId, header] = await Promise.all([
        rpcJson(rpc, '/chains/main/chain_id'),
        rpcJson(rpc, '/chains/main/blocks/head/header'),
    ]);
    const headTimestamp = Math.floor(Date.parse(header.timestamp) / 1000);
    console.log(`[INFO] Oracle ${oracleAddress} on ${rpc} (chain ${chainId}, head=${headTimestamp})`);

    console.log('\n== Native Pyth feeds ==');
    const nativePrices = {};
    for (const asset of NATIVE_ASSETS) {
        nativePrices[asset] = await fetchAssetPrice(rpc, oracleAddress, chainId, source, headTimestamp, maxAgeSeconds, asset);
    }

    console.log('\n== L2 proxy / alias mapping (must equal their native feed) ==');
    for (const group of PROXY_GROUPS) {
        for (const proxyAsset of group.proxies) {
            const proxyPrice = await fetchAssetPrice(
                rpc, oracleAddress, chainId, source, headTimestamp, maxAgeSeconds, proxyAsset,
            );
            const native = nativePrices[group.native];
            if (proxyPrice.price !== native.price || proxyPrice.timestamp !== native.timestamp) {
                throw new Error(
                    `${proxyAsset} does not match its native feed ${group.native}: ` +
                    `proxy=(${proxyPrice.price}, ${proxyPrice.timestamp}) native=(${native.price}, ${native.timestamp})`,
                );
            }
            console.log(`[OK]   ${proxyAsset} == ${group.native}`);
        }
    }

    console.log('\n== getValidatedPrice (requires configurePriceBounds/configureMaxPriceAge already run) ==');
    const comptroller = process.env.TEST_COMPTROLLER || source;
    const cToken = process.env.TEST_MARKET || source;
    for (const asset of NATIVE_ASSETS) {
        await verifyGetValidatedPrice(rpc, oracleAddress, chainId, source, comptroller, cToken, asset);
    }

    console.log('\nAll Shadownet Pyth/NAC smoke-test checks passed.');
}

main().catch((error) => {
    console.error(`[ERROR] Shadownet Pyth oracle verification failed: ${error.message}`);
    process.exitCode = 1;
});

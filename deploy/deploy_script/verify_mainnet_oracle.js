const fs = require('fs');

const { config, resolveDeployResultPath } = require('./util.js');

const ASSETS = ['XTZUSDT', 'USDTUSDT', 'TZBTCUSDT'];
const DEFAULT_MAX_AGE_SECONDS = 300;

async function rpcJson(rpc, pathname, options = {}) {
    const response = await fetch(`${rpc.replace(/\/$/, '')}${pathname}`, options);
    if (!response.ok) {
        throw new Error(`RPC ${pathname} returned ${response.status}: ${await response.text()}`);
    }
    return response.json();
}

function parsePriceResult(asset, response, headTimestamp, maxAgeSeconds) {
    const args = response?.data?.args;
    const price = Number(args?.[0]?.int);
    const rawTimestamp = Number(args?.[1]?.int);
    if (!Number.isSafeInteger(price) || price <= 0) {
        throw new Error(`${asset} returned an invalid or zero price: ${args?.[0]?.int}`);
    }
    if (!Number.isSafeInteger(rawTimestamp) || rawTimestamp <= 0) {
        throw new Error(`${asset} returned an invalid timestamp: ${args?.[1]?.int}`);
    }

    if (rawTimestamp > 100000000000) {
        throw new Error(`${asset} timestamp must use Unix seconds, not milliseconds: ${rawTimestamp}`);
    }
    const timestamp = rawTimestamp;
    const ageSeconds = headTimestamp - timestamp;
    if (ageSeconds < 0) {
        throw new Error(
            `${asset} timestamp ${rawTimestamp} is ${Math.abs(ageSeconds)} seconds ahead of the mainnet head.`,
        );
    }
    if (ageSeconds > maxAgeSeconds) {
        throw new Error(`${asset} price is stale (${ageSeconds}s old; maximum ${maxAgeSeconds}s).`);
    }
    return { asset, price, timestamp, rawTimestamp, ageSeconds };
}

async function main() {
    const manifest = JSON.parse(fs.readFileSync(resolveDeployResultPath(), 'utf8'));
    const oracle = manifest.PriceOracle;
    if (!oracle) {
        throw new Error('Mainnet manifest is missing PriceOracle.');
    }

    const rpc = process.env.TEZOS_RPC || config.tezosNode;
    const source = config.originator?.pkh;
    const maxAgeSeconds = Number(process.env.ORACLE_MAX_AGE_SECONDS || DEFAULT_MAX_AGE_SECONDS);
    if (!source || !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
        throw new Error('A public originator pkh and a positive integer ORACLE_MAX_AGE_SECONDS are required.');
    }

    const [chainId, header] = await Promise.all([
        rpcJson(rpc, '/chains/main/chain_id'),
        rpcJson(rpc, '/chains/main/blocks/head/header'),
    ]);
    const headTimestamp = Math.floor(Date.parse(header.timestamp) / 1000);
    for (const asset of ASSETS) {
        const response = await rpcJson(rpc, '/chains/main/blocks/head/helpers/scripts/run_script_view', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                contract: oracle,
                view: 'get_price_with_timestamp',
                input: { string: asset },
                chain_id: chainId,
                source,
                payer: source,
                gas: '1040000',
                unparsing_mode: 'Readable',
            }),
        });
        const result = parsePriceResult(asset, response, headTimestamp, maxAgeSeconds);
        console.log(`[INFO] ${asset}: price=${result.price}, timestamp=${result.timestamp}, age=${result.ageSeconds}s`);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`[ERROR] Mainnet oracle verification failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { parsePriceResult };
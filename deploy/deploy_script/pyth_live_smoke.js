const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { setTimeout: sleep } = require('node:timers/promises');
const { Contract, FetchRequest, Interface, JsonRpcProvider, Wallet, isAddress, keccak256 } = require('ethers');
const { validateAddress, ValidationResult } = require('@taquito/utils');
const { TezosToolkit } = require('@taquito/taquito');
const { config, createTezosClient, runDeployment, verifyExistingContract } = require('./util.js');
const { fetchAssetPrice, verifyGetValidatedPrice } = require('./verify_shadownet_pyth_oracle.js');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_CONFIG = path.join(ROOT, 'e2e/pyth_live/shadownet.json');
const ABI = [
    'function getPriceUnsafe(bytes32) view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)',
    'function getPriceNoOlderThan(bytes32,uint256) view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)',
    'function priceFeedExists(bytes32) view returns (bool)',
    'function getUpdateFee(bytes[]) view returns (uint256)',
    'function updatePriceFeeds(bytes[]) payable',
    'event PriceFeedUpdate(bytes32 indexed id, uint64 publishTime, int64 price, uint64 conf)',
];
const PYTH = new Interface(ABI);

function json(value) {
    return JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item, 2);
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
    fs.writeFileSync(file, `${json(value)}\n`);
}

function hashFile(file) {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function integer(value, name, min, max) {
    const number = Number(value);
    if (String(value).trim() === '' || !Number.isSafeInteger(number) || number < min || number > max) {
        throw new Error(`${name} must be an integer in ${min}..${max}`);
    }
    return number;
}

function validateConfig(settings) {
    if (settings.evmChainId !== 127823 || settings.michelsonChainId !== 'NetXtLrzvQDobza') {
        throw new Error('Live smoke is restricted to Etherlink Shadownet (127823 / NetXtLrzvQDobza)');
    }
    for (const key of ['evmRpc', 'michelsonRpc', 'hermesUrl']) {
        const url = new URL(settings[key]);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
            throw new Error(`${key} must be a public HTTPS URL without embedded credentials or query parameters`);
        }
    }
    if (!isAddress(settings.pythCore) || BigInt(settings.pythCore) === 0n) {
        throw new Error('Invalid Pyth Core address');
    }
    if (settings.maxAgeSeconds !== 60) throw new Error('Keep both smoke freshness limits at 60 seconds');
    if (!Array.isArray(settings.feeds) || settings.feeds.length !== 3) {
        throw new Error('Exactly three test feeds are required; do not silently omit an inaccessible feed');
    }
    const assets = new Set();
    const ids = new Set();
    for (const feed of settings.feeds) {
        if (!/^[A-Z][A-Z0-9]*$/.test(feed.asset) || feed.asset === 'XTZ' || assets.has(feed.asset)) {
            throw new Error('Test assets must be distinct; XTZ must not be relabeled with another feed');
        }
        if (!/^0x[0-9a-f]{64}$/i.test(feed.feedId) || ids.has(feed.feedId.toLowerCase())) {
            throw new Error('Test feed IDs must be distinct bytes32 values');
        }
        integer(feed.targetDecimals, 'targetDecimals', 0, 30);
        integer(feed.maxConfidenceBps, 'maxConfidenceBps', 1, 10000);
        assets.add(feed.asset);
        ids.add(feed.feedId.toLowerCase());
    }
    return settings;
}

function prepareManifest(settings, seed, source) {
    validateConfig(settings);
    if (validateAddress(source) !== ValidationResult.VALID || !source.startsWith('tz')) {
        throw new Error('--source must be the public tz address of your Shadownet admin');
    }
    if (validateAddress(seed.PriceOracle) !== ValidationResult.VALID) {
        throw new Error('Seed manifest needs its legacy PriceOracle address for the unchanged compile target');
    }
    return {
        OriginatorAddress: source,
        PriceOracle: seed.PriceOracle,
        chainId: settings.michelsonChainId,
        evmChainId: settings.evmChainId,
        network: settings.michelsonRpc,
        networkProfile: 'shadownet',
        PythCore: settings.pythCore,
        PythMaxAgeSeconds: settings.maxAgeSeconds,
        TezFinMaxPriceAgeSeconds: settings.maxAgeSeconds,
        PythConfidenceLimitsApproved: false,
        SmokeTestOnly: true,
        LiveSmoke: settings,
    };
}

async function httpJson(url, options = {}) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).origin}`);
    return response.json();
}

async function michelson(settings, suffix) {
    return httpJson(`${settings.michelsonRpc.replace(/\/$/, '')}/chains/main/${suffix}`);
}

async function preflight(settings, provider) {
    validateConfig(settings);
    const [chainId, evmChainId, code] = await Promise.all([
        michelson(settings, 'chain_id'),
        provider.send('eth_chainId', []),
        provider.getCode(settings.pythCore),
    ]);
    if (chainId !== settings.michelsonChainId || Number(BigInt(evmChainId)) !== settings.evmChainId) {
        throw new Error('Connected RPC chain IDs do not match Etherlink Shadownet; refusing to continue');
    }
    if (code === '0x') throw new Error('No contract bytecode at the configured Pyth Core address');
    return { chainId, evmChainId: Number(BigInt(evmChainId)), pythCore: settings.pythCore, codeSha256: crypto.createHash('sha256').update(code).digest('hex') };
}

function parseHermes(body, feeds) {
    if (body.binary?.encoding !== 'hex' || !Array.isArray(body.binary.data) || !body.binary.data.length ||
        body.binary.data.some((value) => typeof value !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(value))) {
        throw new Error('Hermes did not return hex-encoded signed update payloads');
    }
    if (!Array.isArray(body.parsed)) throw new Error('Hermes response is missing parsed feeds');
    const quotes = feeds.map((feed) => {
        const matches = body.parsed.filter((item) => `0x${String(item.id).replace(/^0x/, '')}`.toLowerCase() === feed.feedId.toLowerCase());
        if (matches.length !== 1) throw new Error(`Hermes key/response does not cover ${feed.asset}/USD exactly once`);
        const price = matches[0].price;
        if (!price || !/^[1-9][0-9]*$/.test(price.price) || !/^[0-9]+$/.test(price.conf)) {
            throw new Error(`Invalid Hermes price/confidence for ${feed.asset}`);
        }
        return {
            asset: feed.asset, price: BigInt(price.price), conf: BigInt(price.conf),
            expo: integer(price.expo, 'Hermes exponent', -30, 0),
            publishTime: integer(price.publish_time, 'Hermes publish_time', 1, Number.MAX_SAFE_INTEGER),
        };
    });
    return { data: body.binary.data.map((value) => `0x${value}`), quotes };
}

async function fetchUpdate(settings) {
    if (!process.env.PYTH_API_KEY) throw new Error('Set PYTH_API_KEY locally; never send it in chat or commit it');
    const url = new URL(`${settings.hermesUrl.replace(/\/$/, '')}/v2/updates/price/latest`);
    for (const feed of settings.feeds) url.searchParams.append('ids[]', feed.feedId);
    url.searchParams.set('encoding', 'hex');
    url.searchParams.set('parsed', 'true');
    return parseHermes(await httpJson(url, { headers: { Authorization: `Bearer ${process.env.PYTH_API_KEY}` } }), settings.feeds);
}

function normalize(quote, feed, timestamp, maxAge) {
    if (quote.price <= 0n || quote.conf < 0n || quote.expo < -30 || quote.expo > 0) {
        throw new Error(`${feed.asset}: invalid Pyth price tuple`);
    }
    if (!Number.isSafeInteger(quote.publishTime) || quote.publishTime <= 0 ||
        quote.publishTime > timestamp || timestamp - quote.publishTime > maxAge) {
        throw new Error(`${feed.asset}: future/invalid/stale publish_time`);
    }
    if (quote.conf * 10000n > quote.price * BigInt(feed.maxConfidenceBps)) {
        throw new Error(`${feed.asset}: confidence exceeds the test limit`);
    }
    const shift = quote.expo + feed.targetDecimals;
    const price = shift >= 0 ? quote.price * 10n ** BigInt(shift) : quote.price / 10n ** BigInt(-shift);
    if (price <= 0n || price >= 2n ** 256n) throw new Error(`${feed.asset}: normalization produced zero/overflow`);
    return { price, timestamp: quote.publishTime };
}

function priceTuple(tuple) {
    return { price: tuple.price, conf: tuple.conf, expo: Number(tuple.expo), publishTime: Number(tuple.publishTime) };
}

function comparePrice(expected, actual, label) {
    if (expected.price !== actual.price || expected.timestamp !== actual.timestamp) {
        throw new Error(`${label}: direct Pyth and TezFin price/timestamp disagree`);
    }
}

async function cachePrices(core, settings, blockTag) {
    return Promise.all(settings.feeds.map(async (feed) => ({
        asset: feed.asset,
        quote: await core.priceFeedExists(feed.feedId, { blockTag })
            ? priceTuple(await core.getPriceUnsafe(feed.feedId, { blockTag }))
            : null,
    })));
}

function updateEvents(receipt, settings) {
    if (receipt.status !== 1) throw new Error('Pyth update transaction did not succeed');
    const topic = PYTH.getEvent('PriceFeedUpdate').topicHash;
    return receipt.logs
        .filter((log) => log.address.toLowerCase() === settings.pythCore.toLowerCase() && log.topics[0] === topic)
        .map((log) => {
            const event = PYTH.parseLog(log);
            return { feedId: event.args.id, publishTime: Number(event.args.publishTime), price: event.args.price, conf: event.args.conf };
        });
}

function advancingAssets(before, events, settings) {
    return settings.feeds.filter((feed) => {
        const previous = before.find((item) => item.asset === feed.asset);
        if (!previous) throw new Error(`Missing baseline for ${feed.asset}`);
        return events.some((event) => event.feedId.toLowerCase() === feed.feedId.toLowerCase() &&
            event.publishTime > (previous.quote === null ? 0 : previous.quote.publishTime));
    }).map((feed) => feed.asset);
}

async function verifySnapshot(manifest, provider, minimumBlock = 0, minimumTimestamp = 0) {
    const settings = manifest.LiveSmoke;
    let header;
    const deadline = Date.now() + 60000;
    do {
        header = await michelson(settings, 'blocks/head/header');
        if (header.level >= minimumBlock && Date.parse(header.timestamp) / 1000 >= minimumTimestamp) break;
        if (Date.now() >= deadline) throw new Error('Michelson RPC did not catch up with the update within 60 seconds');
        await sleep(2000);
    } while (true);
    const blockTag = `0x${header.level.toString(16)}`;
    const evmBlock = await provider.send('eth_getBlockByNumber', [blockTag, false]);
    const timestamp = Math.floor(Date.parse(header.timestamp) / 1000);
    if (!evmBlock || Number(BigInt(evmBlock.timestamp)) !== timestamp) {
        throw new Error('Michelson and EVM RPCs do not expose the same block height/timestamp');
    }
    const core = new Contract(settings.pythCore, ABI, provider);
    const results = [];
    for (const feed of settings.feeds) {
        const quote = priceTuple(await core.getPriceNoOlderThan(feed.feedId, settings.maxAgeSeconds, { blockTag }));
        const expected = normalize(quote, feed, timestamp, settings.maxAgeSeconds);
        const args = [settings.michelsonRpc, manifest.TezFinOracle, settings.michelsonChainId, manifest.OriginatorAddress];
        const actual = await fetchAssetPrice(...args, timestamp, settings.maxAgeSeconds, `${feed.asset}-USD`, header.hash);
        const validated = await verifyGetValidatedPrice(
            ...args, manifest.OriginatorAddress, manifest.OriginatorAddress, `${feed.asset}-USD`, header.hash,
        );
        comparePrice(expected, actual, `${feed.asset} getPrice/get_price_with_timestamp`);
        comparePrice(expected, validated, `${feed.asset} getValidatedPrice`);
        results.push({ asset: feed.asset, quote, normalized: expected });
    }
    return { michelsonBlock: header.hash, level: header.level, evmBlock: evmBlock.hash, timestamp, results };
}

function compiledFiles(runDir) {
    const directory = path.join(runDir, 'compiled/TezFinOracle');
    return {
        code: path.join(directory, 'step_000_cont_0_contract.json'),
        storage: path.join(directory, 'step_000_cont_0_storage.json'),
    };
}

function assertOnlyOracleTarget(runDir) {
    const targets = fs.readdirSync(path.join(runDir, 'compiled'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    if (targets.length !== 1 || targets[0] !== 'TezFinOracle') {
        throw new Error('The live-smoke compile directory must contain only the TezFinOracle target');
    }
}

async function signingClient(manifest) {
    const settings = manifest.LiveSmoke;
    if (process.env.LIVE_PYTH_WRITE_CONFIRM !== 'shadownet') {
        throw new Error('Writes require LIVE_PYTH_WRITE_CONFIRM=shadownet');
    }
    if (config.networkProfile !== 'shadownet' || config.tezosNode !== settings.michelsonRpc ||
        config.chainId !== settings.michelsonChainId) {
        throw new Error('Set public deploy/deploy_script/config.json to the same Shadownet profile/RPC/chainId first');
    }
    const client = await createTezosClient();
    if (client.publicKeyHash !== manifest.OriginatorAddress) throw new Error('Signing admin does not match the isolated manifest');
    return client;
}

async function configure(manifest, runDir) {
    const { tezos } = await signingClient(manifest);
    if (!manifest.TezFinOracle) throw new Error('Deploy the isolated oracle first');
    const files = compiledFiles(runDir);
    await verifyExistingContract(tezos, manifest.TezFinOracle, readJson(files.code), readJson(files.storage), 'TezFinOracle');
    const oracle = await tezos.contract.at(manifest.TezFinOracle);
    const settings = manifest.LiveSmoke;
    const calls = [
        ['setPythCore', settings.pythCore],
        ['setPythMaxAge', `0x${BigInt(settings.maxAgeSeconds).toString(16).padStart(64, '0')}`],
        ['setFeedIds', settings.feeds.map(({ asset, feedId, targetDecimals, maxConfidenceBps }) => ({ asset, feedId, targetDecimals, maxConfidenceBps }))],
        ['configurePriceBounds', { cToken: manifest.OriginatorAddress, minPrice: 1, maxPrice: 2 ** 50, maxChangeBps: 10000 }],
        ['configureMaxPriceAge', settings.maxAgeSeconds],
    ];
    for (const [label, value] of calls) {
        const operation = await oracle.methodsObject[label](value).send();
        fs.appendFileSync(path.join(runDir, 'configuration.jsonl'), `${jsonLine({ label, hash: operation.hash, status: 'injected' })}\n`);
        console.log(`[INFO] ${label}: ${operation.hash}`);
        await operation.confirmation(1, 45);
        fs.appendFileSync(path.join(runDir, 'configuration.jsonl'), `${jsonLine({ label, hash: operation.hash, status: 'confirmed' })}\n`);
    }
}

async function verifyOracle(manifest, runDir) {
    if (!manifest.TezFinOracle) throw new Error('Deploy/configure the isolated oracle first');
    const files = compiledFiles(runDir);
    const hashes = readJson(path.join(runDir, 'compiled-hashes.json'));
    if (hashFile(files.code) !== hashes.contractSha256 || hashFile(files.storage) !== hashes.storageSha256) {
        throw new Error('Compiled artifacts changed after deployment');
    }
    const tezos = new TezosToolkit(manifest.LiveSmoke.michelsonRpc);
    await verifyExistingContract(tezos, manifest.TezFinOracle, readJson(files.code), readJson(files.storage), 'TezFinOracle');
    const storage = await (await tezos.contract.at(manifest.TezFinOracle)).storage();
    await assertOracleConfiguration(storage, manifest);
}

async function assertOracleConfiguration(storage, manifest) {
    const settings = manifest.LiveSmoke;
    if (storage.pythCore.toLowerCase() !== settings.pythCore.toLowerCase() ||
        BigInt(`0x${storage.pythMaxAgeWord.replace(/^0x/, '')}`) !== BigInt(settings.maxAgeSeconds) ||
        Number((await storage.maxPriceAge.get(manifest.OriginatorAddress))?.toString()) !== settings.maxAgeSeconds) {
        throw new Error('On-chain Pyth Core/freshness configuration does not match the live test');
    }
    for (const feed of settings.feeds) {
        const pinned = await storage.feedIds.get(feed.asset);
        const asset = `${feed.asset}-USD`;
        if (!pinned || `0x${pinned.feedId.replace(/^0x/, '')}`.toLowerCase() !== feed.feedId.toLowerCase() ||
            Number(pinned.targetDecimals.toString()) !== feed.targetDecimals ||
            Number(pinned.maxConfidenceBps.toString()) !== feed.maxConfidenceBps ||
            await storage.overrides.get(asset) !== undefined || await storage.alias.get(asset) !== undefined) {
            throw new Error(`${asset}: on-chain feed/precision/confidence configuration differs, or an override/alias bypasses Pyth`);
        }
    }
}

function jsonLine(value) {
    return JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item);
}

function recordBroadcastIntent(file, intent) {
    const descriptor = fs.openSync(file, 'a', 0o600);
    try {
        fs.writeFileSync(descriptor, `${jsonLine(intent)}\n`);
        fs.fsyncSync(descriptor);
    } finally {
        fs.closeSync(descriptor);
    }
}

function runOptions(options) {
    const duration = integer(options['duration-seconds'] ?? 3600, 'duration-seconds', 1, 3600);
    const interval = integer(options['interval-seconds'] ?? 30, 'interval-seconds', 5, 30);
    const receiptTimeout = integer(options['receipt-timeout-seconds'] ?? 180, 'receipt-timeout-seconds', 10, 300);
    if (!/^[1-9][0-9]*$/.test(options['max-total-cost-wei'] || '')) {
        throw new Error('run requires --max-total-cost-wei with your explicit total gas + Pyth fee budget');
    }
    return { duration, interval, receiptTimeout, budget: BigInt(options['max-total-cost-wei']) };
}

function assertBudget(spent, gasLimit, gasPrice, updateFee, budget) {
    if (spent + gasLimit * gasPrice + updateFee > budget) {
        throw new Error('Next transaction could exceed --max-total-cost-wei; stopped before signing');
    }
}

function finishSummary(summary, settings) {
    if (summary.failedRounds > 0 || summary.pendingTransaction) {
        throw new Error(
            `Smoke window failed: ${summary.failedRounds || 0} failed rounds; ` +
            `pending transaction: ${summary.pendingTransaction || 'none'}`,
        );
    }
    const missing = settings.feeds.filter((feed) => !summary.advancedAssets.includes(feed.asset)).map((feed) => feed.asset);
    if (!summary.transactions || missing.length) {
        throw new Error(`No transaction-proven publish_time advancement for: ${missing.join(', ') || 'all feeds'}`);
    }
    summary.status = 'PASS';
}

async function waitForReceipt(provider, hash, timeoutMs, {
    now = Date.now, delay = sleep, pollIntervalMs = 2000,
} = {}) {
    const deadline = now() + timeoutMs;
    do {
        const receipt = await provider.getTransactionReceipt(hash);
        if (receipt) {
            if (receipt.hash.toLowerCase() !== hash.toLowerCase()) {
                throw new Error(`RPC returned a receipt for a different transaction than ${hash}`);
            }
            return receipt;
        }
        const remaining = deadline - now();
        if (remaining <= 0) break;
        await delay(Math.min(pollIntervalMs, remaining));
    } while (true);
    throw new Error(`Receipt still unavailable after ${timeoutMs / 1000}s for ${hash}; not rebroadcasting`);
}

function evidenceDirectory(runDir, attempt, create = false) {
    if (attempt === undefined) return runDir;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(attempt)) {
        throw new Error('--attempt must be a unique name containing only letters, digits, underscores or hyphens');
    }
    const directory = path.join(runDir, 'attempts', attempt);
    if (create) {
        fs.mkdirSync(path.dirname(directory), { recursive: true });
        fs.mkdirSync(directory);
    }
    return directory;
}

async function reconcileReceipts(runDir, provider) {
    const attemptsDir = path.join(runDir, 'attempts');
    const directories = [runDir];
    if (fs.existsSync(attemptsDir)) {
        for (const entry of fs.readdirSync(attemptsDir, { withFileTypes: true })) {
            if (entry.isDirectory()) directories.push(path.join(attemptsDir, entry.name));
        }
    }
    const pending = new Map();
    const settled = new Set();
    for (const directory of directories) {
        for (const filename of ['updates.jsonl', 'receipt-reconciliation.jsonl']) {
            const file = path.join(directory, filename);
            if (!fs.existsSync(file)) continue;
            const rows = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
            for (const row of rows) {
                if (row.status === 'broadcast-intent' || row.status === 'injected') {
                    if (!/^0x[0-9a-f]{64}$/i.test(row.hash || '')) {
                        throw new Error(`Missing/invalid transaction hash in ${file}; refusing new updates`);
                    }
                    pending.set(row.hash.toLowerCase(), directory);
                }
                if (row.status === 'failed' && row.phase === 'broadcast' && !row.hash) {
                    throw new Error(`Previous broadcast in ${file} has an unknown outcome and no hash; manual reconciliation is required before new updates`);
                }
                if (row.receipt?.hash) settled.add(row.receipt.hash.toLowerCase());
            }
        }
    }
    for (const [hash, directory] of pending) {
        if (settled.has(hash)) continue;
        const receipt = await provider.getTransactionReceipt(hash);
        if (!receipt) {
            throw new Error(`Previous transaction ${hash} is pending/unknown; refusing to send new updates`);
        }
        if (receipt.hash.toLowerCase() !== hash.toLowerCase()) {
            throw new Error(`RPC returned a receipt for a different transaction than ${hash}`);
        }
        fs.appendFileSync(path.join(directory, 'receipt-reconciliation.jsonl'), `${jsonLine({
            checkedAt: new Date().toISOString(), receipt: receipt.toJSON(),
            nacVerification: 'NOT_REPLAYED', originalSummaryUnchanged: true,
        })}\n`);
        console.log(`[INFO] Reconciled ${hash}: receipt status=${receipt.status}; original run remains unchanged`);
    }
}

function inclusionAges(settings, events, timestamp) {
    return settings.feeds.flatMap((feed) => events
        .filter((event) => event.feedId.toLowerCase() === feed.feedId.toLowerCase())
        .map((event) => ({
            asset: feed.asset, publishTime: event.publishTime,
            ageSeconds: timestamp - event.publishTime, maxAgeSeconds: settings.maxAgeSeconds,
        })));
}

async function runUpdates(manifest, runDir, provider, options, overrides = {}) {
    const { duration, interval, receiptTimeout, budget } = runOptions(options);
    const services = {
        now: Date.now, delay: sleep, preflight, cachePrices, fetchUpdate, verifySnapshot,
        waitForReceipt, createCore: (wallet) => new Contract(manifest.LiveSmoke.pythCore, ABI, wallet),
        ...overrides,
    };
    if (process.env.LIVE_PYTH_WRITE_CONFIRM !== 'shadownet' || !process.env.PYTH_EVM_PRIVATE_KEY) {
        throw new Error('run requires LIVE_PYTH_WRITE_CONFIRM=shadownet and a local PYTH_EVM_PRIVATE_KEY');
    }
    if (!manifest.TezFinOracle) throw new Error('Deploy/configure the isolated oracle first');
    const settings = manifest.LiveSmoke;
    const wallet = new Wallet(process.env.PYTH_EVM_PRIVATE_KEY.trim(), provider);
    const core = services.createCore(wallet);
    const file = path.join(runDir, 'updates.jsonl');
    if (fs.existsSync(file)) throw new Error('updates.jsonl already exists; preserve evidence and prepare a new run directory');
    const summary = {
        status: 'RUNNING', startedAt: new Date().toISOString(), sender: wallet.address,
        oracle: manifest.TezFinOracle, durationSeconds: duration, intervalSeconds: interval,
        receiptTimeoutSeconds: receiptTimeout, budgetWei: budget, transactions: 0,
        advancedAssets: [], spentWei: 0n, failedRounds: 0, pendingTransaction: null,
        runnerSha256: hashFile(__filename),
        manifestSha256: crypto.createHash('sha256').update(json(manifest)).digest('hex'),
    };
    const advanced = new Set();
    let pending = null;
    writeJson(path.join(runDir, 'summary.json'), summary);
    const deadline = services.now() + duration * 1000;
    const maximumUpdates = Math.ceil(duration / interval);
    try {
        for (let round = 0; round < maximumUpdates && services.now() < deadline; round += 1) {
            const started = services.now();
            let phase = 'preflight';
            let transactionHash = pending?.hash;
            try {
                await services.preflight(settings, provider);
                if (!pending) {
                    phase = 'prepare-update';
                    const baselineBlock = await provider.send('eth_blockNumber', []);
                    const before = await services.cachePrices(core, settings, baselineBlock);
                    const update = await services.fetchUpdate(settings);
                    for (const feed of settings.feeds) {
                        normalize(update.quotes.find((quote) => quote.asset === feed.asset), feed, Math.floor(services.now() / 1000), settings.maxAgeSeconds);
                    }
                    const updateFee = await core.getUpdateFee(update.data);
                    const estimate = await core.updatePriceFeeds.estimateGas(update.data, { value: updateFee });
                    const gasLimit = (estimate * 120n + 99n) / 100n;
                    const feeData = await provider.getFeeData();
                    const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
                    if (gasPrice === null) throw new Error('RPC returned no gas price');
                    assertBudget(summary.spentWei, gasLimit, gasPrice, updateFee, budget);
                    const fees = feeData.maxFeePerGas === null
                        ? { gasPrice }
                        : { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
                    phase = 'sign';
                    const request = await core.updatePriceFeeds.populateTransaction(update.data, { value: updateFee, gasLimit, ...fees });
                    const populated = await wallet.populateTransaction(request);
                    const signed = await wallet.signTransaction(populated);
                    transactionHash = keccak256(signed);
                    pending = { hash: transactionHash, before, update, updateFee, submittedAt: new Date(services.now()).toISOString() };
                    summary.pendingTransaction = transactionHash;
                    phase = 'broadcast-intent';
                    recordBroadcastIntent(file, {
                        round, status: 'broadcast-intent', hash: transactionHash, sender: wallet.address,
                        nonce: populated.nonce, chainId: populated.chainId,
                        submittedAt: pending.submittedAt, baselineBlock, before, hermes: update.quotes,
                        updateFeeWei: updateFee,
                        payloadSha256: crypto.createHash('sha256').update(jsonLine(update.data)).digest('hex'),
                    });
                    writeJson(path.join(runDir, 'summary.json'), summary);
                    phase = 'broadcast';
                    const transaction = await provider.broadcastTransaction(signed);
                    if (transaction.hash.toLowerCase() !== transactionHash) {
                        throw new Error(`RPC returned an unexpected hash for ${transactionHash}`);
                    }
                    fs.appendFileSync(file, `${jsonLine({ round, status: 'injected', hash: transactionHash })}\n`);
                    console.log(`[INFO] Pyth update ${round + 1}: ${transactionHash}`);
                } else {
                    console.warn(`[WARN] Still confirming ${pending.hash}; no new transaction will be sent`);
                }
                phase = 'receipt';
                const receipt = await services.waitForReceipt(provider, pending.hash, receiptTimeout * 1000);
                fs.appendFileSync(file, `${jsonLine({ round, status: 'receipt', receipt: receipt.toJSON() })}\n`);
                const confirmed = pending;
                pending = null;
                summary.pendingTransaction = null;
                summary.transactions += 1;
                summary.spentWei += receipt.gasUsed * receipt.gasPrice + (receipt.status === 1 ? confirmed.updateFee : 0n);
                const events = updateEvents(receipt, settings);
                phase = 'inclusion';
                const block = await provider.send('eth_getBlockByNumber', [`0x${receipt.blockNumber.toString(16)}`, false]);
                if (!block || block.hash.toLowerCase() !== receipt.blockHash.toLowerCase()) {
                    throw new Error(`Receipt block ${receipt.blockNumber} is missing or changed`);
                }
                const ages = inclusionAges(settings, events, Number(BigInt(block.timestamp)));
                fs.appendFileSync(file, `${jsonLine({ round, status: 'inclusion', hash: receipt.hash, events, ages })}\n`);
                const stale = ages.filter((item) => item.ageSeconds > item.maxAgeSeconds || item.ageSeconds < 0);
                if (stale.length) {
                    throw new Error(`Invalid freshness at inclusion: ${stale.map((item) => `${item.asset} age=${item.ageSeconds}s (limit=${item.maxAgeSeconds}s)`).join(', ')}`);
                }
                phase = 'nac-verification';
                const snapshot = await services.verifySnapshot(manifest, provider, receipt.blockNumber, Math.max(...confirmed.update.quotes.map((quote) => quote.publishTime)));
                for (const asset of advancingAssets(confirmed.before, events, settings)) advanced.add(asset);
                summary.advancedAssets = [...advanced];
                fs.appendFileSync(file, `${jsonLine({ round, status: 'verified', hash: receipt.hash, events, snapshot })}\n`);
            } catch (error) {
                summary.failedRounds += 1;
                summary.lastError = safeMessage(error);
                fs.appendFileSync(file, `${jsonLine({
                    round, status: 'failed', phase, hash: transactionHash,
                    observedAt: new Date(services.now()).toISOString(), error: summary.lastError,
                })}\n`);
                console.error(`[ERROR] Round ${round + 1} (${phase}): ${summary.lastError}`);
                if (phase === 'broadcast-intent') throw error;
                if (phase === 'broadcast') {
                    throw new Error(`Broadcast outcome unknown for ${transactionHash}; saved intent must be reconciled before new updates`, { cause: error });
                }
            }
            writeJson(path.join(runDir, 'summary.json'), summary);
            const remaining = Math.min(interval * 1000 - (services.now() - started), deadline - services.now());
            if (remaining > 0) await services.delay(remaining);
        }
        finishSummary(summary, settings);
    } catch (error) {
        summary.status = 'FAIL';
        summary.error = safeMessage(error);
        throw error;
    } finally {
        summary.finishedAt = new Date().toISOString();
        writeJson(path.join(runDir, 'summary.json'), summary);
    }
}

function parseArgs(argv) {
    const [command, ...args] = argv;
    const options = {};
    const allowed = new Set(['run-dir', 'source', 'config', 'duration-seconds', 'interval-seconds', 'receipt-timeout-seconds', 'max-total-cost-wei', 'attempt']);
    for (let index = 0; index < args.length; index += 2) {
        const key = args[index].replace(/^--/, '');
        if (!args[index].startsWith('--') || !allowed.has(key) || !args[index + 1] || args[index + 1].startsWith('--') || options[key] !== undefined) {
            throw new Error(`Invalid/duplicate option: ${args[index]}`);
        }
        options[key] = args[index + 1];
    }
    if (!['prepare', 'preflight', 'access', 'deploy', 'configure', 'verify', 'run'].includes(command) || !options['run-dir']) {
        throw new Error('Usage: pyth_live_smoke.js prepare|preflight|access|deploy|configure|verify|run --run-dir PATH [options]');
    }
    return { command, options };
}

function safeMessage(error) {
    let message = error.shortMessage || error.message || String(error);
    for (const name of ['PYTH_API_KEY', 'PYTH_EVM_PRIVATE_KEY', 'TEZOS_PRIVATE_KEY', 'TEZOS_MNEMONIC']) {
        const secret = process.env[name];
        if (secret) message = message.split(secret).join('[REDACTED]');
    }
    return message;
}

async function main(argv = process.argv.slice(2)) {
    const { command, options } = parseArgs(argv);
    const runDir = path.resolve(options['run-dir']);
    const manifestFile = path.join(runDir, 'manifest.json');
    if (command === 'prepare') {
        const settings = readJson(path.resolve(options.config || DEFAULT_CONFIG));
        const seed = readJson(path.join(ROOT, 'TezFinBuild/deploy_result/deploy.shadownet.json'));
        const manifest = prepareManifest(settings, seed, options.source);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(manifestFile, `${json(manifest)}\n`, { flag: 'wx' });
        writeJson(path.join(runDir, 'source.json'), {
            commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
            trackedChanges: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: ROOT, encoding: 'utf8' }).trim(),
            oracleSourceSha256: hashFile(path.join(ROOT, 'contracts/TezFinOracle.py')),
            settingsSha256: crypto.createHash('sha256').update(json(settings)).digest('hex'),
        });
        console.log(`[INFO] Prepared isolated test manifest ${manifestFile}; no contract deployed or market activated`);
        return;
    }
    const manifest = readJson(manifestFile);
    if (manifest.SmokeTestOnly !== true || manifest.PythConfidenceLimitsApproved !== false) {
        throw new Error('Use an unapproved, isolated manifest created by prepare; never a production manifest');
    }
    const settings = validateConfig(manifest.LiveSmoke);
    const connection = new FetchRequest(settings.evmRpc);
    connection.timeout = 20000;
    const provider = new JsonRpcProvider(connection);
    try {
        writeJson(path.join(runDir, 'preflight.json'), await preflight(settings, provider));
        if (command === 'preflight') return;
        if (command === 'access') {
            const update = await fetchUpdate(settings);
            writeJson(path.join(runDir, 'hermes-access.json'), { checkedAt: new Date().toISOString(), quotes: update.quotes, payloadCount: update.data.length });
        } else if (command === 'deploy') {
            assertOnlyOracleTarget(runDir);
            await signingClient(manifest);
            if (manifest.TezFinOracle) throw new Error('Manifest already has an oracle; prepare a new directory for fresh origination');
            const files = compiledFiles(runDir);
            const evidence = { contractSha256: hashFile(files.code), storageSha256: hashFile(files.storage) };
            writeJson(path.join(runDir, 'compiled-hashes.json'), evidence);
            await runDeployment(path.join(runDir, 'compiled'), manifestFile);
        } else if (command === 'configure') {
            await configure(manifest, runDir);
        } else if (command === 'verify') {
            await verifyOracle(manifest, runDir);
            writeJson(path.join(runDir, 'verification.json'), await verifySnapshot(manifest, provider));
        } else if (command === 'run') {
            await verifyOracle(manifest, runDir);
            runOptions(options);
            await reconcileReceipts(runDir, provider);
            const outputDir = evidenceDirectory(runDir, options.attempt, options.attempt !== undefined);
            console.log(`[INFO] Attempt evidence: ${outputDir}`);
            await runUpdates(manifest, outputDir, provider, options);
        }
        console.log(`[INFO] ${command} complete; evidence: ${runDir}`);
    } finally {
        provider.destroy();
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(`[ERROR] Live Pyth smoke failed: ${safeMessage(error)}`);
        process.exitCode = 1;
    });
}

module.exports = {
    ABI, validateConfig, prepareManifest, parseHermes, normalize, comparePrice,
    updateEvents, advancingAssets, runOptions, assertBudget, parseArgs, preflight,
    verifySnapshot, finishSummary, assertOracleConfiguration, assertOnlyOracleTarget,
    waitForReceipt, evidenceDirectory, reconcileReceipts, inclusionAges, runUpdates,
};

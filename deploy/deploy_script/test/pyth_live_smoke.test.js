const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Interface } = require('ethers');
const settings = require('../../../e2e/pyth_live/shadownet.json');
const {
    ABI, validateConfig, prepareManifest, parseHermes, normalize, comparePrice,
    updateEvents, advancingAssets, runOptions, assertBudget, preflight, verifySnapshot, finishSummary,
    assertOracleConfiguration, assertOnlyOracleTarget,
    waitForReceipt, evidenceDirectory, reconcileReceipts, inclusionAges, runUpdates,
} = require('../pyth_live_smoke.js');

const pyth = new Interface(ABI);
const source = 'tz1XTWbfhyWK9xmPAa6TyQUSv437JFgZDzgA';
const seed = {
    PriceOracle: 'KT1FVzw3ogGSq4Djde17MJqVKd6DZReo8MNb',
    TezFinOracle: 'KT1StW5tmRTZxJY72CLXiv1FKRFdVa3hsvsX',
    Comptroller: 'must-not-copy-or-activate',
};
const clone = (value) => structuredClone(value);

function hermesBody() {
    return {
        binary: { encoding: 'hex', data: ['aabb00'] },
        parsed: settings.feeds.map((feed) => ({
            id: feed.feedId.slice(2),
            price: { price: '100000000', conf: '1000', expo: -8, publish_time: 1000 },
        })),
    };
}

test('preparation isolates the oracle and keeps ETH separate from XTZ; mainnet and duplicate feeds are rejected', () => {
    const manifest = prepareManifest(settings, seed, source);
    assert.equal(manifest.TezFinOracle, undefined);
    assert.equal(manifest.Comptroller, undefined);
    assert.equal(seed.TezFinOracle, 'KT1StW5tmRTZxJY72CLXiv1FKRFdVa3hsvsX');
    assert.equal(manifest.PythConfidenceLimitsApproved, false);
    assert.equal(manifest.LiveSmoke.feeds.some((feed) => feed.asset === 'ETH'), true);
    assert.equal(manifest.LiveSmoke.feeds.some((feed) => feed.asset === 'XTZ'), false);
    assert.throws(() => validateConfig({ ...settings, evmChainId: 42793 }), /restricted/);
    const duplicate = clone(settings);
    duplicate.feeds[2].feedId = duplicate.feeds[0].feedId;
    assert.throws(() => validateConfig(duplicate), /distinct bytes32/);
    const relabeled = clone(settings);
    relabeled.feeds[2].asset = 'XTZ';
    assert.throws(() => validateConfig(relabeled), /must not be relabeled/);
});

test('Hermes requires signed payloads and all three authorized feeds, not just parsed/cached prices', () => {
    assert.equal(parseHermes(hermesBody(), settings.feeds).data[0], '0xaabb00');
    const missing = hermesBody();
    missing.parsed.pop();
    assert.throws(() => parseHermes(missing, settings.feeds), /ETH\/USD/);
    const duplicate = hermesBody();
    duplicate.parsed.push(duplicate.parsed[0]);
    assert.throws(() => parseHermes(duplicate, settings.feeds), /exactly once/);
    const unsigned = hermesBody();
    delete unsigned.binary;
    assert.throws(() => parseHermes(unsigned, settings.feeds), /signed update/);
    const badHex = hermesBody();
    badHex.binary.data = ['abc'];
    assert.throws(() => parseHermes(badHex, settings.feeds), /signed update/);
    const empty = hermesBody();
    empty.parsed[0].price.price = '';
    assert.throws(() => parseHermes(empty, settings.feeds), /Invalid Hermes/);
});

test('comparison uses exact integer normalization, timestamps, freshness, and per-feed confidence boundaries', () => {
    const feed = settings.feeds.find((item) => item.asset === 'USDT');
    const quote = { price: 123456789n, conf: 123456n, expo: -8, publishTime: 1000 };
    const expected = normalize(quote, feed, 1060, 60);
    assert.equal(expected.price, 1234567n);
    assert.doesNotThrow(() => comparePrice(expected, { price: 1234567n, timestamp: 1000 }, 'USDT'));
    assert.throws(() => comparePrice(expected, { price: 1234568n, timestamp: 1000 }, 'USDT'), /disagree/);
    assert.throws(() => comparePrice(expected, { price: 1234567n, timestamp: 1001 }, 'USDT'), /disagree/);
    assert.throws(() => normalize(quote, feed, 1061, 60), /stale/);
    assert.throws(() => normalize(quote, feed, 999, 60), /future/);
    assert.doesNotThrow(() => normalize({ ...quote, price: 100000n, conf: 100n }, feed, 1000, 60));
    assert.throws(() => normalize({ ...quote, price: 100000n, conf: 101n }, feed, 1000, 60), /confidence/);
});

test('only successful receipts with Pyth-owned advancement events prove an update; cached reads cannot yield PASS', () => {
    const before = settings.feeds.map((feed) => ({ asset: feed.asset, quote: { publishTime: 1000 } }));
    const logs = settings.feeds.map((feed) => ({
        address: settings.pythCore,
        ...pyth.encodeEventLog(pyth.getEvent('PriceFeedUpdate'), [feed.feedId, 1001, 100000000, 1]),
    }));
    const events = updateEvents({ status: 1, logs }, settings);
    assert.deepEqual(advancingAssets(before, events, settings), settings.feeds.map((feed) => feed.asset));
    assert.throws(() => updateEvents({ status: 0, logs }, settings), /did not succeed/);
    assert.deepEqual(updateEvents({ status: 1, logs: logs.map((log) => ({ ...log, address: '0x0000000000000000000000000000000000000001' })) }, settings), []);
    assert.deepEqual(advancingAssets(before, events.map((event) => ({ ...event, publishTime: 1000 })), settings), []);
    assert.throws(() => finishSummary({ transactions: 10, advancedAssets: ['BTC', 'USDT'] }, settings), /ETH/);
    assert.throws(() => finishSummary({ transactions: 0, advancedAssets: [] }, settings), /advancement/);
    const summary = { transactions: 1, advancedAssets: ['BTC', 'USDT', 'ETH'] };
    finishSummary(summary, settings);
    assert.equal(summary.status, 'PASS');
});

test('updater duration and spending are bounded; exact gas-plus-update-fee budget is accepted', () => {
    assert.throws(() => runOptions({ 'duration-seconds': 3601, 'max-total-cost-wei': '100' }), /duration/);
    assert.throws(() => runOptions({ 'interval-seconds': 60, 'max-total-cost-wei': '100' }), /interval/);
    assert.throws(() => runOptions({}), /explicit total/);
    assert.throws(() => runOptions({ 'receipt-timeout-seconds': 301, 'max-total-cost-wei': '100' }), /receipt-timeout/);
    assert.doesNotThrow(() => assertBudget(20n, 10n, 2n, 5n, 45n));
    assert.throws(() => assertBudget(20n, 10n, 2n, 5n, 44n), /before signing/);
});

test('direct receipt polling accepts late inclusion and times out explicitly without any rebroadcast', async () => {
    let time = 0;
    let polls = 0;
    const receipt = { hash: '0x1234', status: 1 };
    const clock = { now: () => time, delay: async (ms) => { time += ms; } };
    const found = await waitForReceipt({
        getTransactionReceipt: async () => ++polls === 3 ? receipt : null,
    }, receipt.hash, 10000, clock);
    assert.equal(found, receipt);
    assert.equal(time, 4000);
    await assert.rejects(waitForReceipt({
        getTransactionReceipt: async () => null,
    }, receipt.hash, 5000, clock), /still unavailable.*0x1234.*not rebroadcasting/);
    assert.equal(time, 9000);
});

test('retry attempts preserve failed evidence and reconcile late receipts; unresolved transactions block new attempts', async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tezfin-live-reconcile-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    t.mock.method(console, 'log', () => {});
    const summary = '{"status":"FAIL","transactions":12}\n';
    const updates = '{"status":"injected","hash":"0x1234"}\n';
    fs.writeFileSync(path.join(directory, 'summary.json'), summary);
    fs.writeFileSync(path.join(directory, 'updates.jsonl'), updates);
    await assert.rejects(reconcileReceipts(directory, {
        getTransactionReceipt: async () => null,
    }), /pending\/unknown/);
    await reconcileReceipts(directory, {
        getTransactionReceipt: async () => ({
            hash: '0x1234', status: 1,
            toJSON: () => ({ hash: '0x1234', status: 1 }),
        }),
    });
    const reconciled = JSON.parse(fs.readFileSync(path.join(directory, 'receipt-reconciliation.jsonl'), 'utf8'));
    assert.equal(reconciled.nacVerification, 'NOT_REPLAYED');
    assert.equal(fs.readFileSync(path.join(directory, 'summary.json'), 'utf8'), summary);
    assert.equal(fs.readFileSync(path.join(directory, 'updates.jsonl'), 'utf8'), updates);
    await reconcileReceipts(directory, {
        getTransactionReceipt: async () => assert.fail('already reconciled receipt must not be fetched again'),
    });
    assert.equal(evidenceDirectory(directory, 'retry-1', true), path.join(directory, 'attempts/retry-1'));
    assert.throws(() => evidenceDirectory(directory, 'retry-1', true), /EEXIST/);
    assert.throws(() => evidenceDirectory(directory, '../escape', true), /--attempt/);
});

test('inclusion diagnostics retain the actual stale age rather than increasing the 60s price limit', () => {
    const ages = inclusionAges(settings, settings.feeds.map((feed) => ({
        feedId: feed.feedId, publishTime: 1795512950,
    })), 1795513012);
    assert.ok(ages.every((entry) => entry.ageSeconds === 62 && entry.maxAgeSeconds === 60));
});

async function exerciseWindow(t, failure) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tezfin-live-window-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const previousKey = process.env.PYTH_EVM_PRIVATE_KEY;
    const previousConfirmation = process.env.LIVE_PYTH_WRITE_CONFIRM;
    process.env.PYTH_EVM_PRIVATE_KEY = `0x${'1'.repeat(64)}`;
    process.env.LIVE_PYTH_WRITE_CONFIRM = 'shadownet';
    t.after(() => {
        if (previousKey === undefined) delete process.env.PYTH_EVM_PRIVATE_KEY;
        else process.env.PYTH_EVM_PRIVATE_KEY = previousKey;
        if (previousConfirmation === undefined) delete process.env.LIVE_PYTH_WRITE_CONFIRM;
        else process.env.LIVE_PYTH_WRITE_CONFIRM = previousConfirmation;
    });
    for (const name of ['log', 'error', 'warn']) t.mock.method(console, name, () => {});
    const initialTime = 1700000000000;
    let time = initialTime;
    let sends = 0;
    let waits = 0;
    let verifications = 0;
    const sent = new Map();
    const hashesWaited = [];
    const send = async () => {
        const hash = `0x${(++sends).toString(16).padStart(64, '0')}`;
        sent.set(hash, Math.floor(time / 1000) - 1);
        return { hash };
    };
    send.estimateGas = async () => 100n;
    const core = { getUpdateFee: async () => 0n, updatePriceFeeds: send };
    const provider = {
        getFeeData: async () => ({ maxFeePerGas: 1n, maxPriorityFeePerGas: 0n }),
        send: async (method) => {
            if (method === 'eth_blockNumber') return '0x7b';
            assert.equal(method, 'eth_getBlockByNumber');
            return { hash: '0xblock', timestamp: `0x${Math.floor(time / 1000).toString(16)}` };
        },
    };
    const overrides = {
        now: () => time,
        delay: async (ms) => { time += ms; },
        createCore: () => core,
        preflight: async () => {},
        cachePrices: async () => settings.feeds.map((feed) => ({ asset: feed.asset, quote: null })),
        fetchUpdate: async () => ({
            data: ['0x1234'],
            quotes: settings.feeds.map((feed) => ({
                asset: feed.asset, price: 100000000n, conf: 1n, expo: -8,
                publishTime: Math.floor(time / 1000) - 1,
            })),
        }),
        waitForReceipt: async (_, hash) => {
            waits += 1;
            hashesWaited.push(hash);
            if (failure === 'pending' && waits === 1) throw new Error('receipt pending');
            if (failure === 'stale' && waits === 1) time += 61000;
            return {
                hash, status: 1, blockNumber: 123, blockHash: '0xblock', gasUsed: 100n, gasPrice: 1n,
                logs: settings.feeds.map((feed) => ({
                    address: settings.pythCore,
                    ...pyth.encodeEventLog(pyth.getEvent('PriceFeedUpdate'), [feed.feedId, sent.get(hash), 100000000, 1]),
                })),
                toJSON: () => ({ hash, status: 1 }),
            };
        },
        verifySnapshot: async () => {
            verifications += 1;
            if (failure === 'nac' && verifications === 1) throw new Error('NAC verification failed');
            return { level: 123 };
        },
    };
    const operation = runUpdates({
        ...prepareManifest(settings, seed, source), TezFinOracle: seed.TezFinOracle,
    }, directory, provider, {
        'duration-seconds': '90', 'interval-seconds': '30', 'max-total-cost-wei': '100000',
    }, overrides);
    if (failure) await assert.rejects(operation, /Smoke window failed: 1 failed rounds/);
    else await operation;
    const summary = JSON.parse(fs.readFileSync(path.join(directory, 'summary.json'), 'utf8'));
    const rows = fs.readFileSync(path.join(directory, 'updates.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(time - initialTime, 90000);
    assert.equal(summary.status, failure ? 'FAIL' : 'PASS');
    assert.equal(summary.failedRounds, failure ? 1 : 0);
    assert.equal(summary.transactions, sends);
    assert.equal(BigInt(summary.spentWei), BigInt(sends) * 100n);
    assert.equal(rows.filter((row) => row.status === 'failed').length, failure ? 1 : 0);
    assert.equal(summary.pendingTransaction, null);
    if (failure === 'stale') {
        assert.match(rows.find((row) => row.status === 'failed').error, /age=62s \(limit=60s\)/);
    }
    return { sends, waits, hashesWaited, verifications };
}

test('a later successful NAC cycle does not erase an earlier failure; the full window is collected', async (t) => {
    const result = await exerciseWindow(t, 'nac');
    assert.equal(result.sends, 3);
    assert.equal(result.verifications, 3);
});

test('pending receipt recovery waits on the same hash and never broadcasts a duplicate update', async (t) => {
    const result = await exerciseWindow(t, 'pending');
    assert.equal(result.sends, 2);
    assert.equal(result.waits, 3);
    assert.equal(result.hashesWaited[0], result.hashesWaited[1]);
});

test('a fully successful observation window can still finish as PASS', async (t) => {
    const result = await exerciseWindow(t);
    assert.equal(result.sends, 3);
    assert.equal(result.verifications, 3);
});

test('a late successful update is recorded as stale; later rounds still run without relaxing freshness', async (t) => {
    const result = await exerciseWindow(t, 'stale');
    assert.equal(result.sends, 2);
    assert.equal(result.verifications, 1);
});

test('deployment refuses additional market targets and on-chain overrides cannot masquerade as real Pyth reads', async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tezfin-live-targets-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.mkdirSync(path.join(directory, 'compiled/TezFinOracle'), { recursive: true });
    assert.doesNotThrow(() => assertOnlyOracleTarget(directory));
    fs.mkdirSync(path.join(directory, 'compiled/Comptroller'));
    assert.throws(() => assertOnlyOracleTarget(directory), /only the TezFinOracle/);
    const manifest = prepareManifest(settings, seed, source);
    const storage = {
        pythCore: settings.pythCore,
        pythMaxAgeWord: BigInt(settings.maxAgeSeconds).toString(16).padStart(64, '0'),
        maxPriceAge: new Map([[source, settings.maxAgeSeconds]]),
        feedIds: new Map(settings.feeds.map((feed) => [feed.asset, { ...feed, feedId: feed.feedId.slice(2) }])),
        overrides: new Map(),
        alias: new Map(),
    };
    await assert.doesNotReject(assertOracleConfiguration(storage, manifest));
    storage.pythCore = '0x2880aB155794e7179c9eE2e38200202908C17B43';
    await assert.rejects(assertOracleConfiguration(storage, manifest), /Pyth Core\/freshness/);
    storage.pythCore = settings.pythCore;
    storage.overrides.set('ETH-USD', {});
    await assert.rejects(assertOracleConfiguration(storage, manifest), /bypasses Pyth/);
});

test('public preflight rejects a mislabeled EVM chain or an empty Pyth address', async (t) => {
    t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => settings.michelsonChainId }));
    await assert.rejects(preflight(settings, {
        send: async () => '0xa729', getCode: async () => '0x1234',
    }), /chain IDs/);
    await assert.rejects(preflight(settings, {
        send: async () => `0x${settings.evmChainId.toString(16)}`, getCode: async () => '0x',
    }), /No contract bytecode/);
});

test('verification pins direct EVM reads and all nine real oracle views to the same block', async (t) => {
    const timestamp = 1700000000;
    const header = { hash: 'BTestPinnedBlock', level: 123, timestamp: new Date(timestamp * 1000).toISOString() };
    const viewCalls = [];
    t.mock.method(console, 'log', () => {});
    t.mock.method(global, 'fetch', async (url, options) => {
        if (url.endsWith('/blocks/head/header')) return { ok: true, json: async () => header };
        assert.ok(url.includes(`/blocks/${header.hash}/helpers/scripts/run_script_view`));
        const body = JSON.parse(options.body);
        viewCalls.push(body);
        const asset = body.view === 'getValidatedPrice' ? body.input.args[1].args[1].args[1].string : body.input.string;
        const feed = settings.feeds.find((item) => `${item.asset}-USD` === asset);
        const price = (10n ** BigInt(feed.targetDecimals)).toString();
        const time = { string: header.timestamp };
        const nat = { int: price };
        return { ok: true, json: async () => ({ data: { prim: 'Pair', args: body.view === 'get_price_with_timestamp' ? [nat, time] : [time, nat] } }) };
    });
    const evmCalls = [];
    const provider = {
        send: async (method, params) => {
            assert.equal(method, 'eth_getBlockByNumber');
            assert.equal(params[0], '0x7b');
            return { hash: '0xEvmPinnedBlock', timestamp: `0x${timestamp.toString(16)}` };
        },
        call: async (transaction) => {
            evmCalls.push(transaction);
            assert.equal(transaction.blockTag, '0x7b');
            return pyth.encodeFunctionResult('getPriceNoOlderThan', [100000000n, 1n, -8, timestamp]);
        },
    };
    const snapshot = await verifySnapshot({ ...prepareManifest(settings, seed, source), TezFinOracle: seed.TezFinOracle }, provider);
    assert.equal(snapshot.level, 123);
    assert.equal(evmCalls.length, 3);
    assert.equal(viewCalls.length, 9);
    assert.ok(viewCalls.every((body) => body.source === source && body.chain_id === settings.michelsonChainId));
});

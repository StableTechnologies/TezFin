// Offline/unit tests for the deployment safety guards added per the PR #455 review
// ("Required Deployment Tests" checklist): chain-id rejection, manifest path
// resolution, on-chain code/storage verification comparison logic, and mainnet
// preflight canonical-address checks. These deliberately avoid any real network
// access (no Tezos RPC calls) so they run fast and deterministically in CI.
//
// Run with: node --test deploy/deploy_script/test/deploy_guards.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
    checkChainIdMatch,
    micheline_equal,
    extractAddresses,
    diffSets,
    resolveDeployResultPath,
    verifyExistingContract,
} = require('../util.js');
const { checkNetworkExpectation, MAINNET_CHAIN_IDS } = require('../assert_network.js');
const { findMissingCanonicalKeys, verifyAgainstAllowlist, REQUIRED_CANONICAL_KEYS, VETTED_MAINNET_ADDRESSES } = require('../mainnet_preflight.js');

test('checkChainIdMatch: accepts matching chain ids', () => {
    assert.doesNotThrow(() => checkChainIdMatch('NetXY2oPPzkxUW1', 'NetXY2oPPzkxUW1', 'test manifest'));
});

test('checkChainIdMatch: accepts when no expected chain id is set (fresh manifest)', () => {
    assert.doesNotThrow(() => checkChainIdMatch(undefined, 'NetXY2oPPzkxUW1', 'test manifest'));
});

test('checkChainIdMatch: rejects mismatched chain ids', () => {
    assert.throws(
        () => checkChainIdMatch('NetXdQprcVkpaWU', 'NetXY2oPPzkxUW1', 'Deploy manifest deploy.mainnet.json'),
        /chain NetXdQprcVkpaWU.*chain NetXY2oPPzkxUW1/s,
    );
});

test('assertNetwork guard: rejects an unknown profile', () => {
    assert.throws(
        () => checkNetworkExpectation('staging', undefined, 'NetXY2oPPzkxUW1', 'https://node.example'),
        /Unknown network profile "staging"/,
    );
});

test('assertNetwork guard: rejects config.json declaring a different profile than requested', () => {
    assert.throws(
        () => checkNetworkExpectation('mainnet', 'previewnet', 'NetXdQprcVkpaWU', 'https://node.example'),
        /declares networkProfile "previewnet"/,
    );
});

test('assertNetwork guard: rejects running the mainnet script against a non-mainnet chain id', () => {
    assert.throws(
        () => checkNetworkExpectation('mainnet', 'mainnet', 'NetXY2oPPzkxUW1', 'https://node.example'),
        /not a known mainnet chain id/,
    );
});

test('assertNetwork guard: rejects running the previewnet script against a known mainnet chain id', () => {
    const [mainnetChainId] = MAINNET_CHAIN_IDS;
    assert.throws(
        () => checkNetworkExpectation('previewnet', 'previewnet', mainnetChainId, 'https://node.example'),
        /Refusing to run the Previewnet deploy script against mainnet/,
    );
});

test('assertNetwork guard: accepts a correctly-matched mainnet chain id', () => {
    const [mainnetChainId] = MAINNET_CHAIN_IDS;
    assert.doesNotThrow(() => checkNetworkExpectation('mainnet', 'mainnet', mainnetChainId, 'https://node.example'));
});

test('micheline_equal: treats differently-ordered object keys as equal', () => {
    const a = { prim: 'Pair', args: [{ int: '1' }, { string: 'tz1abc' }] };
    const b = { args: [{ int: '1' }, { string: 'tz1abc' }], prim: 'Pair' };
    assert.equal(micheline_equal(a, b), true);
});

test('micheline_equal: detects a real difference in embedded values', () => {
    const a = { prim: 'Pair', args: [{ int: '1' }] };
    const b = { prim: 'Pair', args: [{ int: '2' }] };
    assert.equal(micheline_equal(a, b), false);
});

test('verifyExistingContract: accepts matching immutable AdjustedIRM storage', async () => {
    const code = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const storage = {
        prim: 'Pair',
        args: [
            { int: '20090000000' },
            { prim: 'Pair', args: [{ int: '700000000000000000' }, { int: '32610000000' }] },
        ],
    };
    const tezos = {
        rpc: {
            getScript: async () => ({ code }),
            getStorage: async () => storage,
        },
    };

    await assert.doesNotReject(
        verifyExistingContract(tezos, 'KT1AdjustedIRM', code, storage, 'CXTZ_AdjustedIRM'),
    );
});

test('verifyExistingContract: rejects AdjustedIRM with a stale cashOffset', async () => {
    const code = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const expectedStorage = {
        prim: 'Pair',
        args: [
            { int: '20090000000' },
            { prim: 'Pair', args: [{ int: '700000000000000000' }, { int: '32610000000' }] },
        ],
    };
    const staleStorage = {
        prim: 'Pair',
        args: [
            { int: '40000000000' },
            { prim: 'Pair', args: [{ int: '700000000000000000' }, { int: '32610000000' }] },
        ],
    };
    const tezos = {
        rpc: {
            getScript: async () => ({ code }),
            getStorage: async () => staleStorage,
        },
    };

    await assert.rejects(
        verifyExistingContract(
            tezos,
            'KT1AdjustedIRM',
            code,
            expectedStorage,
            'CXTZ_AdjustedIRM',
        ),
        /immutable on-chain storage does not match.*cashOffset/s,
    );
});

test('extractAddresses: pulls tz1/KT1 strings out of nested Micheline JSON', () => {
    const tz1 = 'tz1VLnrVYrMtLHRUfLV594uvzSthZ5w7wXqE';
    const kt1 = 'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC';
    const storage = {
        prim: 'Pair',
        args: [
            { string: tz1 },
            { prim: 'Pair', args: [{ string: kt1 }, { int: '42' }] },
        ],
    };
    const addresses = extractAddresses(storage);
    assert.ok(addresses.has(tz1));
    assert.ok(addresses.has(kt1));
    assert.equal(addresses.size, 2);
});

test('diffSets: reports both missing and unexpected addresses', () => {
    const expected = new Set(['tz1Admin', 'KT1Oracle']);
    const actual = new Set(['tz1Admin', 'KT1DifferentOracle']);
    const { missing, unexpected } = diffSets(expected, actual);
    assert.deepEqual(missing, ['KT1Oracle']);
    assert.deepEqual(unexpected, ['KT1DifferentOracle']);
});

test('diffSets: reports no differences when address sets match exactly', () => {
    const expected = new Set(['tz1Admin', 'KT1Oracle']);
    const actual = new Set(['tz1Admin', 'KT1Oracle']);
    const { missing, unexpected } = diffSets(expected, actual);
    assert.deepEqual(missing, []);
    assert.deepEqual(unexpected, []);
});

test('resolveDeployResultPath: DEPLOY_MANIFEST env var always wins', () => {
    const previous = process.env.DEPLOY_MANIFEST;
    process.env.DEPLOY_MANIFEST = '/tmp/custom-manifest.json';
    try {
        assert.equal(resolveDeployResultPath(), path.resolve('/tmp/custom-manifest.json'));
    } finally {
        if (previous === undefined) {
            delete process.env.DEPLOY_MANIFEST;
        } else {
            process.env.DEPLOY_MANIFEST = previous;
        }
    }
});

test('mainnetPreflight: findMissingCanonicalKeys flags every missing required key', () => {
    const missing = findMissingCanonicalKeys({ PriceOracle: 'KT1Oracle' });
    assert.deepEqual(missing, REQUIRED_CANONICAL_KEYS.filter((key) => key !== 'PriceOracle'));
});

test('mainnetPreflight: findMissingCanonicalKeys reports nothing when all keys present', () => {
    const fullManifest = Object.fromEntries(REQUIRED_CANONICAL_KEYS.map((key) => [key, `KT1${key}`]));
    assert.deepEqual(findMissingCanonicalKeys(fullManifest), []);
});

test('mainnetPreflight: verifyAgainstAllowlist warns but does not throw when no allowlist entry is configured', () => {
    assert.doesNotThrow(() => verifyAgainstAllowlist('PriceOracle', 'KT1SomeAddress'));
});

test('mainnetPreflight: verifyAgainstAllowlist rejects an address that does not match a configured vetted entry', () => {
    VETTED_MAINNET_ADDRESSES.PriceOracle = 'KT1VettedOracleAddressXXXXXXXXXXXXX';
    try {
        assert.throws(
            () => verifyAgainstAllowlist('PriceOracle', 'KT1DifferentOracleAddressXXXXXXXXX'),
            /vetted mainnet address is KT1VettedOracleAddressXXXXXXXXXXXXX/,
        );
        assert.doesNotThrow(() => verifyAgainstAllowlist('PriceOracle', 'KT1VettedOracleAddressXXXXXXXXXXXXX'));
    } finally {
        delete VETTED_MAINNET_ADDRESSES.PriceOracle;
    }
});

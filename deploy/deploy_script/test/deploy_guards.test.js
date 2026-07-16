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
    extractAddressBindings,
    diffAddressBindings,
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

test('extractAddressBindings: records tz1/KT1 strings at their Micheline paths', () => {
    const tz1 = 'tz1VLnrVYrMtLHRUfLV594uvzSthZ5w7wXqE';
    const kt1 = 'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC';
    const storage = {
        prim: 'Pair',
        args: [
            { string: tz1 },
            { prim: 'Pair', args: [{ string: kt1 }, { int: '42' }] },
        ],
    };
    const addresses = extractAddressBindings(storage);
    assert.equal(addresses.get('$.args[0].string'), tz1);
    assert.equal(addresses.get('$.args[1].args[0].string'), kt1);
    assert.equal(addresses.size, 2);
});

test('diffAddressBindings: reports addresses assigned to different roles', () => {
    const expected = new Map([['$.admin', 'tz1Admin'], ['$.oracle', 'KT1Oracle']]);
    const actual = new Map([['$.admin', 'KT1Oracle'], ['$.oracle', 'tz1Admin']]);
    assert.deepEqual(diffAddressBindings(expected, actual), [
        { path: '$.admin', expected: 'tz1Admin', actual: 'KT1Oracle' },
        { path: '$.oracle', expected: 'KT1Oracle', actual: 'tz1Admin' },
    ]);
});

test('verifyExistingContract: rejects addresses swapped between immutable roles', async () => {
    const expectedCode = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const administrator = 'tz1VLnrVYrMtLHRUfLV594uvzSthZ5w7wXqE';
    const comptroller = 'KT1WvzYHCNBvDSdwafTHv7nJ1dWmZ8GCYuuC';
    const expectedStorage = {
        prim: 'Pair',
        args: [{ string: administrator }, { string: comptroller }],
    };
    const tezos = {
        rpc: {
            getScript: async () => ({ code: expectedCode }),
            getStorage: async () => ({
                prim: 'Pair',
                args: [{ string: comptroller }, { string: administrator }],
            }),
        },
    };

    await assert.rejects(
        verifyExistingContract(tezos, 'KT1ExistingMarketAddress', expectedCode, expectedStorage, 'CUSDt'),
        /different role-aware address bindings/,
    );
});

test('verifyExistingContract: rejects an IRM with mismatched immutable rate parameters', async () => {
    const expectedCode = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const expectedStorage = {
        prim: 'Pair',
        args: [{ int: '100' }, { prim: 'Pair', args: [{ int: '200' }, { int: '300' }] }],
    };
    const tezos = {
        rpc: {
            getScript: async () => ({ code: expectedCode }),
            getStorage: async () => ({
                prim: 'Pair',
                args: [{ int: '100' }, { prim: 'Pair', args: [{ int: '201' }, { int: '300' }] }],
            }),
        },
    };

    await assert.rejects(
        verifyExistingContract(tezos, 'KT1ExistingIrmAddress', expectedCode, expectedStorage, 'CFA2_IRM'),
        /immutable IRM parameters do not match/,
    );
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

test('mainnetPreflight: verifyAgainstAllowlist rejects a missing required allowlist entry', () => {
    assert.throws(
        () => verifyAgainstAllowlist('PriceOracle', 'KT1SomeAddress'),
        /No vetted mainnet address is configured for required key "PriceOracle"/,
    );
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

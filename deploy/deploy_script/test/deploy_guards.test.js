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
const fs = require('node:fs');
const os = require('node:os');

const {
    checkChainIdMatch,
    micheline_equal,
    michelineScriptEqual,
    decodeTezosAddressBytes,
    extractAddressBindings,
    diffAddressBindings,
    resolveDeployResultPath,
    verifyExistingContract,
    enforceDeploymentPreflight,
    runDeployment,
} = require('../util.js');
const { checkNetworkExpectation, MAINNET_CHAIN_IDS } = require('../assert_network.js');
const { findMissingCanonicalKeys, verifyAgainstAllowlist, REQUIRED_CANONICAL_KEYS, VETTED_MAINNET_ADDRESSES } = require('../mainnet_preflight.js');
const { parsePriceResult } = require('../verify_mainnet_oracle.js');
const { isActuallyMainnet, resolveApprovedConfidenceLimits } = require('../configure_pyth_oracle.js');
const { createFreshTargetManifestCopy, deployCompiledTarget, resolveCompiledContractsPath } = require('../deploy_compiled_target.js');

test('fresh target deployment removes only the copied TezFinOracle entry and originates it', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tezfin-fresh-oracle-'));
    const sourceManifestPath = path.join(directory, 'checked-in-manifest.json');
    const freshManifestPath = path.join(directory, 'fresh', 'manifest.json');
    const compiledPath = path.join(directory, 'compiled', 'TezFinOracle');
    const sourceManifest = {
        TezFinOracle: 'KT1ExistingOracle',
        Comptroller: 'KT1UnrelatedContract',
        chainId: 'NetXtLrzvQDobza',
    };
    fs.writeFileSync(sourceManifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`);
    fs.mkdirSync(compiledPath, { recursive: true });
    fs.writeFileSync(path.join(compiledPath, 'contract.json'), JSON.stringify([{ prim: 'parameter', args: [{ prim: 'unit' }] }]));
    fs.writeFileSync(path.join(compiledPath, 'storage.json'), JSON.stringify({ prim: 'Unit' }));

    let originationCount = 0;
    const freshPath = await deployCompiledTarget(path.dirname(compiledPath), {
        freshTarget: 'TezFinOracle',
        manifestOutput: freshManifestPath,
        sourceManifest: sourceManifestPath,
        runDeploymentFn: (compiledDirectory, manifestPath) => runDeployment(compiledDirectory, manifestPath, {
            createTezosClient: async () => ({ tezos: {}, publicKeyHash: 'tz1TestOriginator', chainId: 'NetXtLrzvQDobza' }),
            enforceDeploymentPreflight: async () => {},
            verifyExistingContract: async () => assert.fail('fresh target must not enter existing-contract verification'),
            deployMichelsonContract: async () => {
                originationCount += 1;
                return 'KT1FreshOracle';
            },
        }),
    });

    assert.equal(originationCount, 1);
    assert.deepEqual(JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8')), sourceManifest);
    assert.equal(JSON.parse(fs.readFileSync(freshPath, 'utf8')).TezFinOracle, 'KT1FreshOracle');
    assert.equal(JSON.parse(fs.readFileSync(freshPath, 'utf8')).Comptroller, 'KT1UnrelatedContract');
});

test('fresh target manifest refuses to overwrite its source file', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tezfin-manifest-copy-'));
    const sourcePath = path.join(directory, 'manifest.json');
    const original = { TezFinOracle: 'KT1ExistingOracle', Comptroller: 'KT1Comptroller' };
    fs.writeFileSync(sourcePath, `${JSON.stringify(original)}\n`);

    assert.throws(
        () => createFreshTargetManifestCopy(sourcePath, sourcePath, 'TezFinOracle'),
        /must not overwrite the source manifest/,
    );
    assert.deepEqual(JSON.parse(fs.readFileSync(sourcePath, 'utf8')), original);
});

const CUSDT_COMPILED_ADDRESSES = [
    { string: 'KT1Wq7uJeiXXociunW4LqQZzdNvM7QYbtVEN' },
    { string: 'KT1N8XU2pe51z22aMbRQya9YhPmCytyX2Met' },
    { string: 'KT1WWKLMc2aAanNxvYR3GcLpArTnYG6sbzzp' },
    { string: 'KT1QT1P8rHnoirQquBV1cmTaWivgGXFxhYax' },
];
const CUSDT_RPC_ADDRESSES = [
    { bytes: '01f409912cd853b330c9fbe60315b2e7301ef9194b00' },
    { bytes: '01949b2d456ed3104815e3c281a570c77e063b8eba00' },
    { bytes: '01f07b34ea1003b885b8155095a2573a7f6395a66500' },
    { bytes: '01ae0a37ee2338f34330c1d46c35ceea4aa7c1fcc100' },
];

function createCUSDtStorage([administrator, comptroller, underlying, irm]) {
    return {
        prim: 'Pair',
        args: [{
            prim: 'Pair',
            args: [{
                prim: 'Pair',
                args: [
                    {
                        prim: 'Pair',
                        args: [
                            { prim: 'Pair', args: [{ int: '0' }, { prim: 'Pair', args: [[], administrator] }] },
                            { int: '1000000000000000000' },
                        ],
                    },
                    {
                        prim: 'Pair',
                        args: [
                            { prim: 'Pair', args: [{ int: '1075' }, { prim: 'Pair', args: [comptroller, { int: '0' }] }] },
                            { prim: 'Pair', args: [underlying, { int: '1000000000000000000' }] },
                        ],
                    },
                ],
            }, {
                prim: 'Pair',
                args: [{ prim: 'Pair', args: [irm, []] }, { int: '0' }],
            }],
        }, { int: '0' }],
    };
}

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

test('isActuallyMainnet: true for a mainnet-labeled profile, regardless of chain id', () => {
    assert.equal(isActuallyMainnet('mainnet', 'NetXY2oPPzkxUW1'), true);
});

test('isActuallyMainnet: true for a mislabeled profile connected to an actual mainnet chain id', () => {
    const [mainnetChainId] = MAINNET_CHAIN_IDS;
    assert.equal(isActuallyMainnet('shadownet', mainnetChainId), true);
});

test('isActuallyMainnet: false when neither the profile nor the connected chain id is mainnet', () => {
    assert.equal(isActuallyMainnet('shadownet', 'NetXtLrzvQDobza'), false);
});

test('resolveApprovedConfidenceLimits: returns limits when approved, regardless of mainnet', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, XTZ_USD: 50, USDT_USD: 10 },
        PythConfidenceLimitsApproved: true,
    };
    assert.deepEqual(
        resolveApprovedConfidenceLimits(manifest, 'test manifest', true),
        manifest.PythConfidenceLimitsBps,
    );
});

test('resolveApprovedConfidenceLimits: rejects unapproved limits on mainnet with no override', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, XTZ_USD: 50, USDT_USD: 10 },
        PythConfidenceLimitsApproved: false,
    };
    const previous = process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    delete process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    try {
        assert.throws(
            () => resolveApprovedConfidenceLimits(manifest, 'test manifest', true),
            /there is no override for mainnet/,
        );
    } finally {
        if (previous !== undefined) process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = previous;
    }
});

test('resolveApprovedConfidenceLimits: rejects a mislabeled profile that is actually mainnet, even with the bypass env set', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, XTZ_USD: 50, USDT_USD: 10 },
        PythConfidenceLimitsApproved: false,
    };
    const previous = process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = '1';
    try {
        // isMainnet=true here simulates isActuallyMainnet() having detected the real chain id
        // as mainnet even though config.json's networkProfile was mislabeled as non-mainnet.
        assert.throws(
            () => resolveApprovedConfidenceLimits(manifest, 'test manifest', true),
            /there is no override for mainnet/,
        );
    } finally {
        if (previous !== undefined) process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = previous;
        else delete process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    }
});

test('resolveApprovedConfidenceLimits: allows the explicit non-mainnet bypass', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, XTZ_USD: 50, USDT_USD: 10 },
        PythConfidenceLimitsApproved: false,
    };
    const previous = process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = '1';
    try {
        assert.deepEqual(
            resolveApprovedConfidenceLimits(manifest, 'test manifest', false),
            manifest.PythConfidenceLimitsBps,
        );
    } finally {
        if (previous !== undefined) process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = previous;
        else delete process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    }
});

test('resolveApprovedConfidenceLimits: rejects off-mainnet without approval or bypass', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, XTZ_USD: 50, USDT_USD: 10 },
        PythConfidenceLimitsApproved: false,
    };
    const previous = process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    delete process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS;
    try {
        assert.throws(
            () => resolveApprovedConfidenceLimits(manifest, 'test manifest', false),
            /Set PythConfidenceLimitsApproved: true/,
        );
    } finally {
        if (previous !== undefined) process.env.ALLOW_UNAPPROVED_CONFIDENCE_LIMITS = previous;
    }
});

test('resolveApprovedConfidenceLimits: rejects a manifest missing a required feed', () => {
    const manifest = {
        PythConfidenceLimitsBps: { BTC_USD: 25, USDT_USD: 10 },
        PythConfidenceLimitsApproved: true,
    };
    assert.throws(
        () => resolveApprovedConfidenceLimits(manifest, 'test manifest', false),
        /is missing: XTZ_USD/,
    );
});

test('resolveCompiledContractsPath: rejects a missing argument', () => {
    assert.throws(
        () => resolveCompiledContractsPath(['node', 'deploy_compiled_target.js']),
        /Usage: node deploy_compiled_target.js/,
    );
});

test('resolveCompiledContractsPath: rejects a nonexistent directory', () => {
    assert.throws(
        () => resolveCompiledContractsPath(['node', 'deploy_compiled_target.js', '/tmp/definitely-not-here-12345']),
        /does not exist or is not a directory/,
    );
});

test('resolveCompiledContractsPath: rejects a path that is a file, not a directory', () => {
    assert.throws(
        () => resolveCompiledContractsPath(['node', 'deploy_compiled_target.js', __filename]),
        /does not exist or is not a directory/,
    );
});

test('resolveCompiledContractsPath: accepts an existing directory', () => {
    assert.equal(resolveCompiledContractsPath(['node', 'deploy_compiled_target.js', __dirname]), __dirname);
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

test('michelineScriptEqual: ignores top-level Michelson section order only', () => {
    const parameter = { prim: 'parameter', args: [{ prim: 'unit' }] };
    const storage = { prim: 'storage', args: [{ prim: 'unit' }] };
    const code = { prim: 'code', args: [[{ prim: 'CAR' }, { prim: 'NIL', args: [{ prim: 'operation' }] }]] };
    const view = { prim: 'view', args: [{ string: 'get' }, { prim: 'unit' }, { prim: 'unit' }, []] };

    assert.equal(michelineScriptEqual([storage, parameter, code, view], [view, parameter, storage, code]), true);
    assert.equal(
        michelineScriptEqual(
            [storage, parameter, code, view],
            [view, parameter, storage, { ...code, args: [[{ prim: 'NIL', args: [{ prim: 'operation' }] }, { prim: 'CAR' }]] }],
        ),
        false,
    );
});

test('decodeTezosAddressBytes: decodes optimized tz1/tz2/tz3/tz4 and KT1 encodings', () => {
    const vectors = [
        ['00001111111111111111111111111111111111111111', 'tz1MCGdC9qYbSjtWEbup9i17WkohvzwCm2HV'],
        ['00011111111111111111111111111111111111111111', 'tz29sUbQkQxxNVXNWmxepLyN4L4iStKf9x8Y'],
        ['00021111111111111111111111111111111111111111', 'tz3MtHYjeH6Vm7yfw32upJRjsgxEDiVdgA85'],
        ['00031111111111111111111111111111111111111111', 'tz4AZVWxErWrgscYDD5kUwPzRGDEjbwhTeLz'],
        ['01222222222222222222222222222222222222222200', 'KT1BhFRuvKL9E8ggxycsHDf8qS42HLvCrXYr'],
    ];

    for (const [encoded, address] of vectors) {
        assert.equal(decodeTezosAddressBytes(encoded), address);
    }
});

test('decodeTezosAddressBytes: ignores malformed and unsupported encodings', () => {
    assert.equal(decodeTezosAddressBytes('0004' + '11'.repeat(20)), undefined);
    assert.equal(decodeTezosAddressBytes('01' + '22'.repeat(20) + '01'), undefined);
    assert.equal(decodeTezosAddressBytes('00'), undefined);
    assert.equal(decodeTezosAddressBytes('not-hex'), undefined);
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
    assert.equal(addresses.get('$.args[0]'), tz1);
    assert.equal(addresses.get('$.args[1].args[0]'), kt1);
    assert.equal(addresses.size, 2);
});

test('extractAddressBindings: normalizes string and bytes addresses to identical paths', () => {
    const stringStorage = {
        prim: 'Pair',
        args: [
            { string: 'tz1MCGdC9qYbSjtWEbup9i17WkohvzwCm2HV' },
            { string: 'KT1BhFRuvKL9E8ggxycsHDf8qS42HLvCrXYr' },
        ],
    };
    const bytesStorage = {
        prim: 'Pair',
        args: [
            { bytes: '00001111111111111111111111111111111111111111' },
            { bytes: '01222222222222222222222222222222222222222200' },
        ],
    };

    assert.deepEqual(extractAddressBindings(bytesStorage), extractAddressBindings(stringStorage));
});

test('extractAddressBindings: matches compiled CUSDt strings to Previewnet RPC bytes', () => {
    const compiledStorage = createCUSDtStorage(CUSDT_COMPILED_ADDRESSES);
    const rpcStorage = createCUSDtStorage(CUSDT_RPC_ADDRESSES);

    assert.deepEqual(extractAddressBindings(rpcStorage), extractAddressBindings(compiledStorage));
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

test('verifyExistingContract: accepts matching CUSDt string/bytes wiring', async () => {
    const expectedCode = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const tezos = {
        rpc: {
            getScript: async () => ({ code: expectedCode }),
            getStorage: async () => createCUSDtStorage(CUSDT_RPC_ADDRESSES),
        },
    };

    await assert.doesNotReject(
        verifyExistingContract(
            tezos,
            'KT1Cugpw5mGTQydYt2dCw2CUxsPsnGSdt7R9',
            expectedCode,
            createCUSDtStorage(CUSDT_COMPILED_ADDRESSES),
            'CUSDt',
        ),
    );
});

test('verifyExistingContract: rejects every administrator/comptroller/underlying/IRM swap', async () => {
    const expectedCode = [{ prim: 'parameter', args: [{ prim: 'unit' }] }];
    const roles = ['administrator', 'comptroller', 'underlying', 'IRM'];

    for (let left = 0; left < roles.length; left++) {
        for (let right = left + 1; right < roles.length; right++) {
            const swapped = [...CUSDT_RPC_ADDRESSES];
            [swapped[left], swapped[right]] = [swapped[right], swapped[left]];
            const tezos = {
                rpc: {
                    getScript: async () => ({ code: expectedCode }),
                    getStorage: async () => createCUSDtStorage(swapped),
                },
            };

            await assert.rejects(
                verifyExistingContract(
                    tezos,
                    'KT1Cugpw5mGTQydYt2dCw2CUxsPsnGSdt7R9',
                    expectedCode,
                    createCUSDtStorage(CUSDT_COMPILED_ADDRESSES),
                    'CUSDt',
                ),
                /different role-aware address bindings/,
            );
        }
    }
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

test('raw deployment path: mainnet requires preflight', async () => {
    let receivedPath;
    let oracleManifestPath;
    await enforceDeploymentPreflight('/tmp/deploy.mainnet.json', 'mainnet', 'NetXdQprcVkpaWU', async (manifestPath) => {
        receivedPath = manifestPath;
    }, async (manifestPath) => {
        oracleManifestPath = manifestPath;
    });
    assert.equal(receivedPath, '/tmp/deploy.mainnet.json');
    assert.equal(oracleManifestPath, '/tmp/deploy.mainnet.json');
});

test('raw deployment path: mainnet preflight failure blocks deployment', async () => {
    await assert.rejects(
        enforceDeploymentPreflight('/tmp/deploy.mainnet.json', 'previewnet', 'NetXdQprcVkpaWU', async () => {
            throw new Error('MAINNET_DEPLOY_CONFIRM is required');
        }, async () => {}),
        /MAINNET_DEPLOY_CONFIRM is required/,
    );
});

test('raw deployment path: oracle verification failure blocks deployment', async () => {
    await assert.rejects(
        enforceDeploymentPreflight(
            '/tmp/deploy.mainnet.json',
            'mainnet',
            'NetXdQprcVkpaWU',
            async () => {},
            async () => {
                throw new Error('XTZUSDT price is stale');
            },
        ),
        /XTZUSDT price is stale/,
    );
});

test('raw deployment path: previewnet does not run mainnet preflights', async () => {
    await enforceDeploymentPreflight(
        '/tmp/deploy.previewnet.json',
        'previewnet',
        'NetXnHfVqm9iesp',
        async () => {
            throw new Error('mainnet preflight should not run');
        },
        async () => {
            throw new Error('mainnet oracle verification should not run');
        },
    );
});

test('mainnetPreflight: findMissingCanonicalKeys reports nothing when all keys present', () => {
    const fullManifest = Object.fromEntries(REQUIRED_CANONICAL_KEYS.map((key) => [key, `KT1${key}`]));
    assert.deepEqual(findMissingCanonicalKeys(fullManifest), []);
});

test('mainnetPreflight: verifyAgainstAllowlist rejects a missing required allowlist entry', () => {
    const vettedOracle = VETTED_MAINNET_ADDRESSES.PriceOracle;
    delete VETTED_MAINNET_ADDRESSES.PriceOracle;
    try {
        assert.throws(
            () => verifyAgainstAllowlist('PriceOracle', 'KT1SomeAddress'),
            /No vetted mainnet address is configured for required key "PriceOracle"/,
        );
    } finally {
        VETTED_MAINNET_ADDRESSES.PriceOracle = vettedOracle;
    }
});

test('mainnetPreflight: verifyAgainstAllowlist rejects an address that does not match a configured vetted entry', () => {
    const vettedOracle = VETTED_MAINNET_ADDRESSES.PriceOracle;
    VETTED_MAINNET_ADDRESSES.PriceOracle = 'KT1VettedOracleAddressXXXXXXXXXXXXX';
    try {
        assert.throws(
            () => verifyAgainstAllowlist('PriceOracle', 'KT1DifferentOracleAddressXXXXXXXXX'),
            /vetted mainnet address is KT1VettedOracleAddressXXXXXXXXXXXXX/,
        );
        assert.doesNotThrow(() => verifyAgainstAllowlist('PriceOracle', 'KT1VettedOracleAddressXXXXXXXXXXXXX'));
    } finally {
        VETTED_MAINNET_ADDRESSES.PriceOracle = vettedOracle;
    }
});

test('mainnet oracle guard: accepts a current nonzero price', () => {
    const response = { data: { args: [{ int: '226300' }, { int: '1784510000' }] } };
    assert.deepEqual(parsePriceResult('XTZUSDT', response, 1784510030, 300), {
        asset: 'XTZUSDT', price: 226300, timestamp: 1784510000, rawTimestamp: 1784510000, ageSeconds: 30,
    });
});

test('mainnet oracle guard: rejects milliseconds, future timestamps, stale prices, and zero prices', () => {
    assert.throws(
        () => parsePriceResult('XTZUSDT', { data: { args: [{ int: '226300' }, { int: '1784510000000' }] } }, 1784510030, 300),
        /Unix seconds, not milliseconds/,
    );
    assert.throws(
        () => parsePriceResult('XTZUSDT', { data: { args: [{ int: '226300' }, { int: '1784510031' }] } }, 1784510030, 300),
        /ahead of the mainnet head/,
    );
    assert.throws(
        () => parsePriceResult('TZBTCUSDT', { data: { args: [{ int: '0' }, { int: '1784510000' }] } }, 1784510030, 300),
        /invalid or zero price/,
    );
    assert.throws(
        () => parsePriceResult('TZBTCUSDT', { data: { args: [{ int: '1' }, { int: '1784400000' }] } }, 1784510030, 300),
        /price is stale/,
    );
});

const { config, createTezosClient, resolveDeployResultPath } = require('./util.js');

const fs = require('fs');

function readDeployResult(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// Addresses that a mainnet deployment must never originate itself: they are external,
// canonical assets/services this protocol integrates with, not contracts this repo
// controls. They must be supplied explicitly in the mainnet manifest ahead of time.
//
// Only list keys that a currently-wired compile target actually consumes. USDtz is
// intentionally NOT required here: no compile target in deploy_mainnet.sh/
// deploy_previewnet.sh originates a CUSDtz market (CompileCUSDtz.py is not part of
// either pipeline), so requiring it here would block deployments that never need it.
// Add it back only once a CUSDtz market is actually added to the mainnet pipeline.
const REQUIRED_CANONICAL_KEYS = ['PriceOracle', 'USDt', 'tzBTC'];

// Vetted production addresses for canonical external assets/services. These must be
// filled in with the exact, reviewed mainnet addresses before a real mainnet
// deployment; a manifest value that doesn't match exactly is rejected rather than
// silently accepted just because *some* contract exists at that address. Deliberately
// left null/empty until vetted mainnet addresses are confirmed for this deployment;
// mainnet preflight fails closed while any required entry is absent.
const VETTED_MAINNET_ADDRESSES = {
    // Blocked after the 2026-07-15 Kolibri incident. KT1B74... proxies the
    // affected KT1Exb... feed; add an address only after independent review.
    PriceOracle: null,
    USDt: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o',
    tzBTC: 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn',
};

async function verifyAddressExists(tezos, key, address) {
    try {
        await tezos.rpc.getScript(address);
    } catch (error) {
        throw new Error(
            `Manifest key "${key}" (${address}) could not be found on the connected chain (${error.message}).`,
        );
    }
}

function verifyAgainstAllowlist(key, address) {
    const expected = VETTED_MAINNET_ADDRESSES[key];
    if (!expected) {
        throw new Error(
            `No vetted mainnet address is configured for required key "${key}" in ` +
            `VETTED_MAINNET_ADDRESSES. Refusing to proceed until the exact reviewed production ` +
            `address is added to mainnet_preflight.js.`,
        );
    }
    if (address !== expected) {
        throw new Error(
            `Manifest key "${key}" is ${address}, but the vetted mainnet address is ${expected}. ` +
            `Refusing to proceed with a mismatched canonical address.`,
        );
    }
}

// Pure check (no network access) split out from mainnetPreflight so the "missing
// required canonical key" rejection path can be unit-tested directly.
function findMissingCanonicalKeys(deployResult) {
    return REQUIRED_CANONICAL_KEYS.filter((key) => !deployResult[key]);
}

async function mainnetPreflight(deployResultPath) {
    const { tezos, chainId } = await createTezosClient();
    const deployResult = readDeployResult(deployResultPath);

    const missing = findMissingCanonicalKeys(deployResult);
    if (missing.length > 0) {
        throw new Error(
            `Mainnet manifest ${deployResultPath} is missing required canonical addresses: ` +
            `[${missing.join(', ')}]. A mainnet deployment must never originate test tokens or a mock ` +
            `oracle (see CompileTestData.py, which this script refuses to run); populate these keys ` +
            `with the vetted production addresses before continuing. See README.md "PriceOracle ` +
            `Configuration".`,
        );
    }

    console.log('[INFO] Verifying required canonical addresses exist on-chain and match the allowlist...');
    for (const key of REQUIRED_CANONICAL_KEYS) {
        verifyAgainstAllowlist(key, deployResult[key]);
        await verifyAddressExists(tezos, key, deployResult[key]);
        console.log(`[INFO]   ${key}: ${deployResult[key]} OK`);
    }

    console.log('');
    console.log('==================== MAINNET DEPLOYMENT PLAN ====================');
    console.log(`Network:        ${config.tezosNode}`);
    console.log(`Chain ID:       ${chainId}`);
    console.log(`Manifest:       ${deployResultPath}`);
    console.log('Canonical inputs (not originated by this deployment):');
    for (const key of REQUIRED_CANONICAL_KEYS) {
        console.log(`  - ${key}: ${deployResult[key]}`);
    }
    console.log('Contracts already recorded in the manifest (will be verified, not re-originated):');
    const alreadyDeployedKeys = Object.keys(deployResult).filter(
        (key) => !REQUIRED_CANONICAL_KEYS.includes(key) && !['chainId', 'network', 'OriginatorAddress'].includes(key),
    );
    if (alreadyDeployedKeys.length === 0) {
        console.log('  (none — this will be a full fresh deployment)');
    } else {
        for (const key of alreadyDeployedKeys) {
            console.log(`  - ${key}: ${deployResult[key]}`);
        }
    }
    console.log('===================================================================');
    console.log('');

    if (process.env.MAINNET_DEPLOY_CONFIRM !== 'yes') {
        throw new Error(
            'Refusing to proceed without explicit confirmation. Review the plan above carefully, ' +
            'then re-run with MAINNET_DEPLOY_CONFIRM=yes to continue.',
        );
    }

    console.log('[INFO] MAINNET_DEPLOY_CONFIRM=yes acknowledged; proceeding.');
}

if (require.main === module) {
    mainnetPreflight(resolveDeployResultPath()).catch((error) => {
        console.error(`[ERROR] Mainnet preflight failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    mainnetPreflight,
    findMissingCanonicalKeys,
    verifyAgainstAllowlist,
    REQUIRED_CANONICAL_KEYS,
    VETTED_MAINNET_ADDRESSES,
};

const { config, createTezosClient } = require('./util.js');

// Known mainnet chain ids. Extend if/when the protocol targets additional networks.
const MAINNET_CHAIN_IDS = new Set(['NetXdQprcVkpaWU']);

// Pure decision logic (no network access), extracted so it can be unit-tested
// directly with fabricated chain ids instead of only against a live RPC connection.
// Returns nothing on success; throws with a descriptive message on rejection.
function checkNetworkExpectation(expectedProfile, declaredProfile, chainId, tezosNode) {
    if (expectedProfile !== 'previewnet' && expectedProfile !== 'mainnet') {
        throw new Error(`Unknown network profile "${expectedProfile}"; expected "previewnet" or "mainnet".`);
    }

    if (declaredProfile && declaredProfile !== expectedProfile) {
        throw new Error(
            `This script is for "${expectedProfile}", but deploy_script/config.json declares ` +
            `networkProfile "${declaredProfile}". Refusing to continue; point config.json at the ` +
            `correct profile before running this script.`,
        );
    }

    const isMainnetChain = MAINNET_CHAIN_IDS.has(chainId);
    if (expectedProfile === 'mainnet' && !isMainnetChain) {
        throw new Error(
            `Expected a mainnet chain id, but the connected RPC (${tezosNode}) reports chain ` +
            `${chainId}, which is not a known mainnet chain id. Refusing to run the mainnet deploy ` +
            `script against what looks like a non-mainnet network.`,
        );
    }
    if (expectedProfile === 'previewnet' && isMainnetChain) {
        throw new Error(
            `The connected RPC (${tezosNode}) reports chain ${chainId}, which is a known ` +
            `mainnet chain id. Refusing to run the Previewnet deploy script against mainnet.`,
        );
    }
}

async function assertNetwork(expectedProfile) {
    const { chainId } = await createTezosClient();
    checkNetworkExpectation(expectedProfile, config.networkProfile, chainId, config.tezosNode);
    console.log(`[INFO] Network check passed: profile=${expectedProfile}, chainId=${chainId}, node=${config.tezosNode}`);
}

if (require.main === module) {
    const expectedProfile = process.argv[2];
    assertNetwork(expectedProfile).catch((error) => {
        console.error(`[ERROR] Network guard failed: ${error.message}`);
        process.exitCode = 1;
    });
}

module.exports = { assertNetwork, checkNetworkExpectation, MAINNET_CHAIN_IDS };

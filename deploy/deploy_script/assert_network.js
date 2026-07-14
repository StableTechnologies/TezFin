const { config, createTezosClient } = require('./util.js');

// Known mainnet chain ids. Extend if/when the protocol targets additional networks.
const MAINNET_CHAIN_IDS = new Set(['NetXdQprcVkpaWU']);

// Guards against running the wrong deploy script against the wrong network. Each
// deploy script declares which profile it expects ("previewnet" or "mainnet") as its
// first CLI argument; this checks both the declared config.json `networkProfile` and
// the actual connected RPC chain id agree with that expectation before anything is
// compiled or deployed.
async function assertNetwork(expectedProfile) {
    if (expectedProfile !== 'previewnet' && expectedProfile !== 'mainnet') {
        throw new Error(`Unknown network profile "${expectedProfile}"; expected "previewnet" or "mainnet".`);
    }

    const declaredProfile = config.networkProfile;
    if (declaredProfile && declaredProfile !== expectedProfile) {
        throw new Error(
            `This script is for "${expectedProfile}", but deploy_script/config.json declares ` +
            `networkProfile "${declaredProfile}". Refusing to continue; point config.json at the ` +
            `correct profile before running this script.`,
        );
    }

    const { chainId } = await createTezosClient();
    const isMainnetChain = MAINNET_CHAIN_IDS.has(chainId);
    if (expectedProfile === 'mainnet' && !isMainnetChain) {
        throw new Error(
            `Expected a mainnet chain id, but the connected RPC (${config.tezosNode}) reports chain ` +
            `${chainId}, which is not a known mainnet chain id. Refusing to run the mainnet deploy ` +
            `script against what looks like a non-mainnet network.`,
        );
    }
    if (expectedProfile === 'previewnet' && isMainnetChain) {
        throw new Error(
            `The connected RPC (${config.tezosNode}) reports chain ${chainId}, which is a known ` +
            `mainnet chain id. Refusing to run the Previewnet deploy script against mainnet.`,
        );
    }

    console.log(`[INFO] Network check passed: profile=${expectedProfile}, chainId=${chainId}, node=${config.tezosNode}`);
}

const expectedProfile = process.argv[2];
assertNetwork(expectedProfile).catch((error) => {
    console.error(`[ERROR] Network guard failed: ${error.message}`);
    process.exitCode = 1;
});

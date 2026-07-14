const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const { InMemorySigner } = require('@taquito/signer');
const { TezosToolkit } = require('@taquito/taquito');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Single source of truth for the manifest path so prepare/deploy/verify-oracle/preflight
// can never silently disagree about which file they're reading/writing. Resolution order:
//   1. DEPLOY_MANIFEST env var, if set (explicit override always wins).
//   2. A profile-specific default derived from config.json's networkProfile, so a
//      mainnet config.json never defaults to the Previewnet manifest file (or vice versa).
function resolveDeployResultPath() {
    if (process.env.DEPLOY_MANIFEST) {
        return path.resolve(process.env.DEPLOY_MANIFEST);
    }
    const fileName = config.networkProfile === 'mainnet' ? 'deploy.mainnet.json' : 'deploy.json';
    return path.join(__dirname, '../../TezFinBuild/deploy_result', fileName);
}

function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required. Add it to your shell environment; do not commit private keys.`);
    }
    return value;
}

async function initAccount() {
    if (process.env.TEZOS_PRIVATE_KEY) {
        return InMemorySigner.fromSecretKey(process.env.TEZOS_PRIVATE_KEY.trim());
    }

    const mnemonic = process.env.TEZOS_MNEMONIC;
    if (!mnemonic) {
        getRequiredEnv('TEZOS_PRIVATE_KEY');
    }

    const fundraiserEmail = process.env.TEZOS_FUNDS_EMAIL;
    const fundraiserPassword = process.env.TEZOS_FUNDS_PASSWORD;
    if (fundraiserEmail || fundraiserPassword) {
        if (!fundraiserEmail || !fundraiserPassword) {
            throw new Error('Set both TEZOS_FUNDS_EMAIL and TEZOS_FUNDS_PASSWORD for a fundraiser account.');
        }
        return InMemorySigner.fromFundraiser(fundraiserEmail, fundraiserPassword, mnemonic);
    }

    return InMemorySigner.fromMnemonic({
        mnemonic,
        password: process.env.TEZOS_MNEMONIC_PASSWORD || '',
        derivationPath: process.env.TEZOS_DERIVATION_PATH || "44'/1729'/0'/0'",
    });
}

function parseMichelsonFile(filePath, kind) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new Error(`Could not parse ${kind} JSON at ${filePath}: ${error.message}`);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientRpcError(error) {
    const message = String(error && error.message ? error.message : error);
    return /504|502|503|408|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|Gateway Time-out|Bad Gateway|Service Unavailable/i.test(
        message,
    );
}

async function rpcGetJson(pathname) {
    const base = config.tezosNode.replace(/\/$/, '');
    const response = await fetch(`${base}${pathname}`);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Http error response: (${response.status}) ${body}`);
    }
    return response.json();
}

async function findOriginationAddress(opHash, {
    maxAttempts = Number(process.env.TEZOS_CONFIRMATION_ATTEMPTS || 90),
    pollIntervalMs = Number(process.env.TEZOS_CONFIRMATION_POLL_MS || 3000),
    lookbackBlocks = Number(process.env.TEZOS_CONFIRMATION_LOOKBACK || 40),
} = {}) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const header = await rpcGetJson('/chains/main/blocks/head/header');
            for (let delta = 0; delta < lookbackBlocks; delta++) {
                const level = header.level - delta;
                if (level < 1) {
                    break;
                }
                const block = await rpcGetJson(`/chains/main/blocks/${level}`);
                for (const passOps of block.operations || []) {
                    for (const op of passOps) {
                        if (op.hash !== opHash) {
                            continue;
                        }
                        for (const content of op.contents || []) {
                            const result = content.metadata && content.metadata.operation_result;
                            if (!result) {
                                continue;
                            }
                            if (result.status === 'applied' && result.originated_contracts?.length) {
                                return result.originated_contracts[0];
                            }
                            if (result.status && result.status !== 'applied') {
                                throw new Error(
                                    `Operation ${opHash} finished with status ${result.status}`,
                                );
                            }
                        }
                    }
                }
            }
            console.log(
                `[INFO] Waiting for ${opHash} to appear in a block (attempt ${attempt}/${maxAttempts})`,
            );
        } catch (error) {
            if (!isTransientRpcError(error)) {
                throw error;
            }
            console.log(
                `[WARN] Transient RPC error confirming ${opHash} (attempt ${attempt}/${maxAttempts}): ${error.message}`,
            );
        }
        await sleep(pollIntervalMs);
    }
    throw new Error(`Timed out waiting for confirmation of ${opHash}`);
}

async function deployMichelsonContract(tezos, contract, initialStorage, name) {
    const feeSafetyMultiplier = Number(
        process.env.TEZOS_FEE_SAFETY_MULTIPLIER || config.feeSafetyMultiplier || 1.2,
    );
    if (!Number.isFinite(feeSafetyMultiplier) || feeSafetyMultiplier < 1) {
        throw new Error('TEZOS_FEE_SAFETY_MULTIPLIER must be a number greater than or equal to 1.');
    }

    const params = {
        balance: '0',
        code: contract,
        init: initialStorage,
    };
    const estimate = await tezos.estimate.originate(params);
    const fee = Math.ceil(estimate.suggestedFeeMutez * feeSafetyMultiplier);
    console.log(
        `[INFO] ${name} fee estimate: ${estimate.suggestedFeeMutez} mutez; using ${fee} mutez`,
    );
    const operation = await tezos.contract.originate({
        ...params,
        fee,
        gasLimit: estimate.gasLimit,
        storageLimit: estimate.storageLimit,
    });
    console.log(`[INFO] Injected ${name}: ${operation.hash}`);

    let address;
    try {
        // Keep Taquito's waiter short; Previewnet RPC often 504s on long polls.
        await operation.confirmation(1, 45);
        address = (await operation.contract()).address;
    } catch (error) {
        console.log(
            `[WARN] Taquito confirmation failed for ${name} (${error.message}); falling back to RPC block scan`,
        );
        address = await findOriginationAddress(operation.hash);
    }

    console.log(`[INFO] Originated ${name}: ${address}`);
    return address;
}

async function createTezosClient() {
    const tezos = new TezosToolkit(config.tezosNode);
    const signer = await initAccount();
    tezos.setProvider({ signer });

    const chainId = await tezos.rpc.getChainId();
    checkChainIdMatch(config.chainId, chainId, 'config.json chainId');
    const publicKeyHash = await signer.publicKeyHash();
    if (config.originator?.pkh && config.originator.pkh !== publicKeyHash) {
        throw new Error(`Configured originator ${config.originator.pkh} does not match signing key ${publicKeyHash}`);
    }
    return { tezos, publicKeyHash, chainId };
}

async function checkConnection() {
    const { tezos, publicKeyHash, chainId } = await createTezosClient();
    const balance = await tezos.tz.getBalance(publicKeyHash);
    console.log(`[INFO] Connected to ${config.tezosNode} (${chainId})`);
    console.log(`[INFO] Signer ${publicKeyHash} has ${balance.toString()} mutez available`);
}

async function syncDeploymentOriginator(deployResultPath) {
    const { publicKeyHash, chainId } = await createTezosClient();
    const deployResult = readDeployResult(deployResultPath);
    if (deployResult.chainId) {
        try {
            checkChainIdMatch(deployResult.chainId, chainId, `Deploy manifest ${deployResultPath}`);
        } catch (error) {
            throw new Error(
                `${error.message} Refusing to reuse this manifest; start a fresh manifest (e.g. delete ` +
                `or rename the file) before preparing a deployment for this network.`,
            );
        }
    }
    deployResult.OriginatorAddress = publicKeyHash;
    deployResult.chainId = chainId;
    deployResult.network = config.tezosNode;
    writeDeployResult(deployResultPath, JSON.stringify(deployResult, null, '  '));
    console.log(`[INFO] Set OriginatorAddress to ${publicKeyHash} in ${deployResultPath}`);
}

function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
        return fs.statSync(path + '/' + file).isDirectory();
    });
}

function getMichelsonCode(directory) {
    return findFirstFile(path.join(directory, "*contract.json"), 'contract')
}

function getMichelsonStorage(directory) {
    return findFirstFile(path.join(directory, "*storage.json"), 'storage')
}

function findFirstFile(pattern, kind) {
    const files = glob.sync(pattern);
    if (files.length !== 1) {
        throw new Error(`Expected one ${kind} file matching ${pattern}, found ${files.length}`);
    }
    return parseMichelsonFile(files[0], kind);
}

function readDeployResult(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
        return {}
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
}

function writeDeployResult(jsonPath, data) {
    fs.writeFileSync(jsonPath, data + os.EOL)
}

async function fetchOnChainScript(tezos, address) {
    return tezos.rpc.getScript(address);
}

async function fetchOnChainStorage(tezos, address) {
    return tezos.rpc.getStorage(address);
}

// Micheline JSON from the RPC and from SmartPy's compiled output can differ in key
// order (and, occasionally, annotation order) without being semantically different.
// Canonicalize both sides the same way before comparing so that a legitimate resume
// isn't falsely rejected due to formatting differences alone.
function canonicalizeMicheline(node) {
    if (Array.isArray(node)) {
        return node.map(canonicalizeMicheline);
    }
    if (node && typeof node === 'object') {
        const sortedKeys = Object.keys(node).sort();
        const result = {};
        for (const key of sortedKeys) {
            const value = node[key];
            result[key] = key === 'annots' && Array.isArray(value)
                ? [...value].sort()
                : canonicalizeMicheline(value);
        }
        return result;
    }
    return node;
}

function micheline_equal(a, b) {
    return JSON.stringify(canonicalizeMicheline(a)) === JSON.stringify(canonicalizeMicheline(b));
}

const TEZOS_ADDRESS_PATTERN = /^(tz1|tz2|tz3|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/;

// Best-effort "critical storage" check: SmartPy always embeds administrator, oracle,
// underlying-token, and IRM addresses as plain address strings inside storage. Two
// contracts can share identical code but be wired to different administrators/markets
// (e.g. copy-pasted CFA12 templates); comparing the *set* of addresses embedded in
// storage catches that case without needing a hand-written schema per contract type.
// It will NOT catch differences in purely numeric parameters (e.g. a different IRM
// kink/multiplier) with otherwise-identical wiring; a full per-contract schema check
// would be needed to close that gap.
function extractAddresses(node, out = new Set()) {
    if (Array.isArray(node)) {
        for (const item of node) {
            extractAddresses(item, out);
        }
        return out;
    }
    if (node && typeof node === 'object') {
        if (typeof node.string === 'string' && TEZOS_ADDRESS_PATTERN.test(node.string)) {
            out.add(node.string);
        }
        if (typeof node.bytes === 'string') {
            // addresses are sometimes packed as bytes; skip decoding for now, this is
            // a best-effort check, not a full schema-aware comparison.
        }
        for (const value of Object.values(node)) {
            extractAddresses(value, out);
        }
    }
    return out;
}

function diffSets(expected, actual) {
    const missing = [...expected].filter((item) => !actual.has(item));
    const unexpected = [...actual].filter((item) => !expected.has(item));
    return { missing, unexpected };
}

// Pure guard used by createTezosClient/syncDeploymentOriginator/runDeployment to
// reject a manifest or config that was produced for a different chain than the one
// currently connected. Extracted as a standalone function (no network access) so it
// can be unit-tested directly instead of only indirectly via a live RPC connection.
function checkChainIdMatch(expectedChainId, actualChainId, context) {
    if (expectedChainId && expectedChainId !== actualChainId) {
        throw new Error(
            `${context} was created for/configured with chain ${expectedChainId}, but the connected ` +
            `RPC reports chain ${actualChainId}. Refusing to proceed.`,
        );
    }
}

// Verify that a manifest entry still points at a live, matching contract before we
// trust it enough to skip re-deploying. This prevents silently reusing a stale or
// unrelated address just because a key happens to exist in the manifest (e.g. a
// manifest copied from another network, or an address that was never confirmed).
async function verifyExistingContract(tezos, address, expectedCode, expectedStorage, directoryName) {
    let script;
    try {
        script = await fetchOnChainScript(tezos, address);
    } catch (error) {
        throw new Error(
            `Manifest entry "${directoryName}" points to ${address}, but no contract could be found ` +
            `there on the connected chain (${error.message}). Refusing to skip deployment; remove the ` +
            `stale entry from the manifest or fix the address before re-running.`,
        );
    }

    if (!micheline_equal(script.code, expectedCode)) {
        throw new Error(
            `Manifest entry "${directoryName}" (${address}) does not match the compiled contract code ` +
            `on the connected chain. Refusing to skip deployment; the on-chain contract may belong to a ` +
            `different network/version than the one currently compiled.`,
        );
    }

    const onChainStorage = await fetchOnChainStorage(tezos, address);
    const expectedAddresses = extractAddresses(expectedStorage);
    const actualAddresses = extractAddresses(onChainStorage);
    const { missing, unexpected } = diffSets(expectedAddresses, actualAddresses);
    if (missing.length > 0 || unexpected.length > 0) {
        throw new Error(
            `Manifest entry "${directoryName}" (${address}) has matching code but its on-chain storage ` +
            `references different addresses (admin/oracle/underlying/IRM/etc.) than the compiled initial ` +
            `storage. Expected-but-missing: [${missing.join(', ')}]; unexpected: [${unexpected.join(', ')}]. ` +
            `Refusing to skip deployment; this looks like the same contract template wired to a different ` +
            `configuration. Note: this check only compares embedded addresses, not numeric parameters.`,
        );
    }
    console.log(`[INFO] Verified ${directoryName} at ${address} matches compiled code and critical storage addresses on-chain`);
}

async function runDeployment(compiledContractsPath, deployResultPath) {
    const { tezos, publicKeyHash, chainId } = await createTezosClient();
    console.log(`[INFO] Deploying from ${publicKeyHash} to ${config.tezosNode} (${chainId})`);

    const directories = getDirectories(compiledContractsPath).sort();
    if (directories.length === 0) {
        throw new Error(`No compiled contract directories found in ${compiledContractsPath}`);
    }
    const jsonDeployResult = readDeployResult(deployResultPath);

    // Bind the manifest to the chain it was created for. A manifest produced against one
    // network (e.g. a stale Previewnet run) must never be silently reused to skip
    // origination against a different chain (e.g. mainnet).
    if (jsonDeployResult.chainId) {
        try {
            checkChainIdMatch(jsonDeployResult.chainId, chainId, `Deploy manifest ${deployResultPath}`);
        } catch (error) {
            throw new Error(`${error.message} Refusing to reuse this manifest; start a fresh manifest for this network instead.`);
        }
    }
    jsonDeployResult.chainId = chainId;
    jsonDeployResult.network = config.tezosNode;
    writeDeployResult(deployResultPath, JSON.stringify(jsonDeployResult, null, '  '));

    const knownKeys = new Set([...directories, 'chainId', 'network', 'OriginatorAddress']);
    const staleKeys = Object.keys(jsonDeployResult).filter((key) => !knownKeys.has(key));
    if (staleKeys.length > 0) {
        console.log(
            `[WARN] Manifest ${deployResultPath} contains keys not produced by this compile batch: ` +
            `[${staleKeys.join(', ')}]. These are not verified against the current compiled output and ` +
            `may be stale (e.g. from an older/partial compile run); double-check them manually or start ` +
            `from an empty manifest.`,
        );
    }

    for (const directoryName of directories) {
        const directoryPath = path.join(compiledContractsPath, directoryName);
        const code = getMichelsonCode(directoryPath);
        const storage = getMichelsonStorage(directoryPath);

        const existingAddress = jsonDeployResult[directoryName];
        if (existingAddress) {
            await verifyExistingContract(tezos, existingAddress, code, storage, directoryName);
            console.log(`[INFO] Skipping ${directoryName}; already deployed and verified at ${existingAddress}`);
            continue;
        }

        console.log(`[INFO] Deploying ${directoryName}`);
        const contractAddress = await deployMichelsonContract(tezos, code, storage, directoryName);

        jsonDeployResult[directoryName] = contractAddress;
        writeDeployResult(deployResultPath, JSON.stringify(jsonDeployResult, null, '  '));
        console.log(`[INFO] ${directoryName} deployed successfully`);
    }
}

async function run() {
    return runDeployment(
        path.join(__dirname, '../../TezFinBuild/compiled_contracts'),
        resolveDeployResultPath(),
    );
}

const runE2E = async () => {
	return runDeployment(
		path.join(__dirname, '../../e2e/compiled_contracts'),
		path.join(__dirname, '../../e2e/deploy_result/deploy.json'),
	);
};

// Verify that the PriceOracle address recorded in the manifest actually exists on the
// connected chain before TezFinOracle (and therefore Comptroller) is compiled against
// it. This closes the gap where a wrong/unrelated address could be silently baked into
// TezFinOracle's storage just because a key happens to be present in the manifest.
async function verifyOracleAddress(deployResultPath) {
    const { tezos, chainId } = await createTezosClient();
    const deployResult = readDeployResult(deployResultPath);
    const address = deployResult.PriceOracle;
    if (!address) {
        throw new Error(
            `No "PriceOracle" address found in ${deployResultPath}. For Previewnet, run ` +
            `CompileTestData.py to deploy the mock oracle first. For mainnet, add the vetted ` +
            `production oracle address to the manifest before compiling TezFinOracle.`,
        );
    }
    try {
        await tezos.rpc.getScript(address);
    } catch (error) {
        throw new Error(
            `PriceOracle address ${address} from ${deployResultPath} could not be found on chain ` +
            `${chainId} (${error.message}). Refusing to compile TezFinOracle against a nonexistent ` +
            `oracle; fix the manifest before continuing.`,
        );
    }
    console.log(`[INFO] Verified PriceOracle ${address} exists on chain ${chainId}`);
}

module.exports = {
    checkConnection,
    runE2E,
    run,
    syncDeploymentOriginator,
    verifyOracleAddress,
    config,
    createTezosClient,
    resolveDeployResultPath,
    // Exported for unit testing (pure/offline functions, no network access):
    checkChainIdMatch,
    canonicalizeMicheline,
    micheline_equal,
    extractAddresses,
    diffSets,
    verifyExistingContract,
}

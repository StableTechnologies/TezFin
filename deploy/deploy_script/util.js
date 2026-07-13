const fs = require('fs');
const os = require('os');
const path = require('path');
const glob = require('glob');
const { InMemorySigner } = require('@taquito/signer');
const { TezosToolkit } = require('@taquito/taquito');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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
    if (config.chainId && config.chainId !== chainId) {
        throw new Error(`Configured chain ID ${config.chainId} does not match RPC chain ID ${chainId}`);
    }
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
    const { publicKeyHash } = await createTezosClient();
    const deployResult = readDeployResult(deployResultPath);
    deployResult.OriginatorAddress = publicKeyHash;
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

async function runDeployment(compiledContractsPath, deployResultPath) {
    const { tezos, publicKeyHash, chainId } = await createTezosClient();
    console.log(`[INFO] Deploying from ${publicKeyHash} to ${config.tezosNode} (${chainId})`);

    const directories = getDirectories(compiledContractsPath).sort();
    if (directories.length === 0) {
        throw new Error(`No compiled contract directories found in ${compiledContractsPath}`);
    }
    const jsonDeployResult = readDeployResult(deployResultPath);
    for (const directoryName of directories) {
        if (jsonDeployResult[directoryName]) {
            console.log(
                `[INFO] Skipping ${directoryName}; already in deploy.json: ${jsonDeployResult[directoryName]}`,
            );
            continue;
        }
        console.log(`[INFO] Deploying ${directoryName}`);
        const directoryPath = path.join(compiledContractsPath, directoryName);
        const code = getMichelsonCode(directoryPath);
        const storage = getMichelsonStorage(directoryPath);

        const contractAddress = await deployMichelsonContract(tezos, code, storage, directoryName);

        jsonDeployResult[directoryName] = contractAddress;
        writeDeployResult(deployResultPath, JSON.stringify(jsonDeployResult, null, '  '));
        console.log(`[INFO] ${directoryName} deployed successfully`);
    }
}

async function run() {
    return runDeployment(
        path.join(__dirname, '../../TezFinBuild/compiled_contracts'),
        path.join(__dirname, '../../TezFinBuild/deploy_result/deploy.json'),
    );
}

const runE2E = async () => {
	return runDeployment(
		path.join(__dirname, '../../e2e/compiled_contracts'),
		path.join(__dirname, '../../e2e/deploy_result/deploy.json'),
	);
};
module.exports = { checkConnection, runE2E, run, syncDeploymentOriginator }

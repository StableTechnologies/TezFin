const fs = require('fs');
const path = require('path');

const { TezosToolkit } = require('@taquito/taquito');

const config = require('./config.json');

class PublicKeySigner {
    constructor(publicKeyHash, publicKey) {
        this.publicKeyHashValue = publicKeyHash;
        this.publicKeyValue = publicKey;
    }

    async publicKeyHash() {
        return this.publicKeyHashValue;
    }

    async publicKey() {
        return this.publicKeyValue;
    }

    async secretKey() {
        throw new Error('Read-only estimator has no secret key.');
    }

    async sign() {
        throw new Error('Read-only estimator cannot sign or inject operations.');
    }
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
    const [contractPath, storagePath] = process.argv.slice(2);
    if (!contractPath || !storagePath) {
        throw new Error('Usage: node estimate_origination.js CONTRACT.json STORAGE.json');
    }

    const rpc = process.env.TEZOS_RPC || config.tezosNode;
    const publicKeyHash = process.env.TEZOS_PUBLIC_KEY_HASH || config.originator?.pkh;
    const publicKey = process.env.TEZOS_PUBLIC_KEY;
    if (!rpc || !publicKeyHash || !publicKey) {
        throw new Error('TEZOS_RPC, TEZOS_PUBLIC_KEY_HASH, and TEZOS_PUBLIC_KEY are required.');
    }

    const tezos = new TezosToolkit(rpc);
    tezos.setProvider({ signer: new PublicKeySigner(publicKeyHash, publicKey) });

    const chainId = await tezos.rpc.getChainId();
    if (config.chainId && chainId !== config.chainId && !process.env.TEZOS_RPC) {
        throw new Error(`Configured chain id ${config.chainId} does not match RPC chain id ${chainId}.`);
    }

    const estimate = await tezos.estimate.originate({
        balance: '0',
        code: readJson(path.resolve(contractPath)),
        init: readJson(path.resolve(storagePath)),
    });
    console.log(JSON.stringify({
        rpc,
        chainId,
        source: publicKeyHash,
        suggestedFeeMutez: estimate.suggestedFeeMutez,
        gasLimit: estimate.gasLimit,
        storageLimit: estimate.storageLimit,
        operationSize: estimate.opSize,
    }, null, 2));
}

main().catch((error) => {
    console.error(`[ERROR] Origination estimate failed: ${error.message}`);
    process.exitCode = 1;
});
// Measures the size of the *complete* origination operation for a compiled contract,
// offline. This exists because SmartPy's `*_sizes.csv` only reports the packed
// Micheline size of the contract code and the initial storage value. The protocol's
// `max_operation_data_length` (32768) applies to the whole signed manager operation, so
// code+storage systematically under-reports the number that actually has to fit.
//
// The value printed here is the same quantity Taquito reports as `estimate.opSize`:
// the forged operation bytes plus the signature that gets appended at injection
// (see @taquito/taquito rpc-estimate-provider.js, which computes
// `opbytes.length / 2 + payloadLength[Ed25519Signature]`). Forging locally with
// @taquito/local-forging means this needs no RPC, no funded account, and no secret key,
// so it can run in CI on every commit instead of only at deploy time.
//
// Envelope fields (fee/counter/gas_limit/storage_limit) are zarith-encoded, so their
// byte length depends on their magnitude. We deliberately forge with values at or above
// anything a real origination would use, which makes the reported size an upper bound:
// if this passes, the real origination is no larger.
const fs = require('fs');
const path = require('path');

const { LocalForger } = require('@taquito/local-forging');
const { PrefixV2, b58Encode, payloadLength } = require('@taquito/utils');

const DEFAULT_MAX_TOTAL_BYTES = 32768;

// Ed25519 (tz1) signature payload length, read from Taquito rather than hardcoded so this
// stays in step with the same table its estimator uses.
const SIGNATURE_BYTES = payloadLength[PrefixV2.Ed25519Signature];

// Deliberately pessimistic envelope values. Each is >= what a real origination needs,
// so the zarith encodings are at least as long as the ones that get injected:
//   fee           - far above any observed origination fee
//   counter       - 9 digits, beyond current mainnet counters
//   gas_limit     - the per-operation hard gas cap
//   storage_limit - well above a 32KB contract's storage cost
// balance is '0' to match deployMichelsonContract() in util.js, which originates with
// no initial balance.
const WORST_CASE_ENVELOPE = {
    fee: '1000000',
    counter: '999999999',
    gas_limit: '1040000',
    storage_limit: '999999',
    balance: '0',
};

// Any well-formed values work for forging; only their encoded length matters, and both of
// these are fixed-width. The branch is a block hash (32 bytes) and the source is an
// implicit account (21 bytes), regardless of which block or account is used.
const PLACEHOLDER_BRANCH = b58Encode(new Uint8Array(32).fill(0x11), PrefixV2.BlockHash);
const PLACEHOLDER_SOURCE = 'tz1XTWbfhyWK9xmPAa6TyQUSv437JFgZDzgA';

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveArtifactPaths(contractDir) {
    const entries = fs.readdirSync(contractDir);
    const contractFile = entries.find((name) => /_contract\.json$/.test(name));
    const storageFile = entries.find((name) => /_storage\.json$/.test(name));
    if (!contractFile || !storageFile) {
        throw new Error(
            `${contractDir} does not look like a SmartPy output directory: expected a ` +
            `*_contract.json and a *_storage.json (found: ${entries.join(', ') || 'nothing'}).`,
        );
    }
    return {
        contractPath: path.join(contractDir, contractFile),
        storagePath: path.join(contractDir, storageFile),
    };
}

async function measureOriginationSize({ contractPath, storagePath }) {
    const forger = new LocalForger();
    const opBytes = await forger.forge({
        branch: PLACEHOLDER_BRANCH,
        contents: [{
            kind: 'origination',
            source: PLACEHOLDER_SOURCE,
            ...WORST_CASE_ENVELOPE,
            script: {
                code: readJson(contractPath),
                storage: readJson(storagePath),
            },
        }],
    });

    const forgedBytes = opBytes.length / 2;
    return {
        forgedBytes,
        signatureBytes: SIGNATURE_BYTES,
        opSize: forgedBytes + SIGNATURE_BYTES,
    };
}

function parseArgs(argv) {
    const args = { contractDir: null, maxTotalBytes: DEFAULT_MAX_TOTAL_BYTES, json: false };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--json') {
            args.json = true;
        } else if (arg === '--max') {
            args.maxTotalBytes = Number(argv[i + 1]);
            i += 1;
        } else if (!args.contractDir) {
            args.contractDir = arg;
        } else {
            throw new Error(`Unexpected argument "${arg}".`);
        }
    }
    if (!args.contractDir) {
        throw new Error(
            'Usage: node measure_origination_size.js <compiled-contract-dir> [--max BYTES] [--json]\n' +
            'e.g.   node measure_origination_size.js ../../TezFinBuild/compiled_contracts/Comptroller',
        );
    }
    if (!Number.isFinite(args.maxTotalBytes) || args.maxTotalBytes <= 0) {
        throw new Error('--max must be a positive number of bytes.');
    }
    return args;
}

async function main() {
    const { contractDir, maxTotalBytes, json } = parseArgs(process.argv.slice(2));
    const measurement = await measureOriginationSize(resolveArtifactPaths(contractDir));
    const margin = maxTotalBytes - measurement.opSize;
    const withinLimit = measurement.opSize <= maxTotalBytes;

    if (json) {
        console.log(JSON.stringify({
            contractDir, ...measurement, maxTotalBytes, margin, withinLimit,
        }, null, 2));
    } else {
        console.log(`[INFO] ${path.basename(contractDir)}: forged=${measurement.forgedBytes}B + `
            + `signature=${measurement.signatureBytes}B = opSize ${measurement.opSize}B `
            + `(limit ${maxTotalBytes}B, margin ${margin}B)`);
    }

    if (!withinLimit) {
        console.error(
            `[FAIL] ${path.basename(contractDir)} origination operation is ${measurement.opSize}B, `
            + `which exceeds the ${maxTotalBytes}B limit by ${-margin}B. This operation cannot be `
            + 'injected; the contract must be made smaller.',
        );
        process.exitCode = 1;
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}

module.exports = {
    measureOriginationSize,
    resolveArtifactPaths,
    DEFAULT_MAX_TOTAL_BYTES,
    SIGNATURE_BYTES,
};

// Offline tests for measure_origination_size.js, which is what the CI size gate
// (deploy/compile_targets/tests/test_operation_size.py) uses to decide whether a contract
// can actually be originated. These pin the two properties that make the measurement
// trustworthy: it accounts for the whole operation rather than just code+storage, and it
// tracks contract size monotonically. No network access.
//
// Run with: node --test deploy/deploy_script/test/origination_size.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
    measureOriginationSize,
    resolveArtifactPaths,
    SIGNATURE_BYTES,
} = require('../measure_origination_size.js');

// A minimal but real contract: `parameter nat; storage nat; code { CDR; NIL operation; PAIR }`.
function buildContract(extraStorageEntries) {
    return [
        { prim: 'parameter', args: [{ prim: 'nat' }] },
        { prim: 'storage', args: [{ prim: 'nat' }] },
        {
            prim: 'code',
            args: [[{ prim: 'CDR' }, { prim: 'NIL', args: [{ prim: 'operation' }] }, { prim: 'PAIR' }]],
        },
        ...extraStorageEntries,
    ];
}

function writeArtifacts(dir, contract, storage) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'step_000_cont_0_contract.json'), JSON.stringify(contract));
    fs.writeFileSync(path.join(dir, 'step_000_cont_0_storage.json'), JSON.stringify(storage));
    return dir;
}

// Awaits run() before cleaning up, so an async body cannot have the directory deleted out
// from under it at its first suspension point.
async function withTempDir(run) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'origination_size_test_'));
    try {
        return await run(dir);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

test('reported opSize is the forged operation plus the signature', async () => {
    await withTempDir(async (dir) => {
        const artifacts = writeArtifacts(dir, buildContract([]), { int: '0' });
        const measured = await measureOriginationSize(resolveArtifactPaths(artifacts));

        assert.equal(measured.signatureBytes, SIGNATURE_BYTES);
        assert.equal(measured.opSize, measured.forgedBytes + SIGNATURE_BYTES);
    });
});

test('opSize accounts for the operation envelope, not just the script', async () => {
    // This is the whole point of the check: gating on code+storage alone under-reports what
    // has to fit under the protocol's 32768-byte limit. A tiny contract's script is a
    // handful of bytes, yet the operation carrying it must also encode the branch (32B),
    // source (21B), the four zarith limits, and the signature (64B).
    await withTempDir(async (dir) => {
        const artifacts = writeArtifacts(dir, buildContract([]), { int: '0' });
        const measured = await measureOriginationSize(resolveArtifactPaths(artifacts));

        const branchAndSourceBytes = 32 + 21;
        assert.ok(
            measured.forgedBytes > branchAndSourceBytes,
            `forged operation (${measured.forgedBytes}B) must exceed branch+source framing alone`,
        );
        assert.ok(measured.opSize > measured.forgedBytes, 'opSize must add the signature');
    });
});

test('a larger contract measures larger', async () => {
    await withTempDir(async (dir) => {
        const small = writeArtifacts(path.join(dir, 'small'), buildContract([]), { int: '0' });
        // Views are part of the contract script, so adding one must increase the measurement.
        const big = writeArtifacts(
            path.join(dir, 'big'),
            buildContract([{
                prim: 'view',
                args: [
                    { string: 'someView' },
                    { prim: 'unit' },
                    { prim: 'nat' },
                    [{ prim: 'CDR' }],
                ],
            }]),
            { int: '0' },
        );

        const smallMeasured = await measureOriginationSize(resolveArtifactPaths(small));
        const bigMeasured = await measureOriginationSize(resolveArtifactPaths(big));
        assert.ok(
            bigMeasured.opSize > smallMeasured.opSize,
            `expected the contract with an extra view to measure larger, got ${bigMeasured.opSize} <= ${smallMeasured.opSize}`,
        );
    });
});

test('resolveArtifactPaths rejects a directory without SmartPy output', async () => {
    await withTempDir((dir) => {
        assert.throws(() => resolveArtifactPaths(dir), /does not look like a SmartPy output directory/);
    });
});

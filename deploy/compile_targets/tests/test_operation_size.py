"""Guards against a contract growing past the origination operation size limit before it
reaches mainnet. This was called out specifically in the PR #455 review re: Comptroller's
`lazify=True` removal - that change alone is benign (SmartPy just emits a
differently-shaped, non-lazified Michelson representation), but the review recommended
verifying the actual origination operation size stays comfortably under protocol limits
before a real mainnet deployment.

The number that has to fit under `max_operation_data_length` (32768) is the size of the
whole signed manager operation, NOT just the contract code and initial storage. SmartPy's
`*_sizes.csv` only reports the latter, so gating on code+storage under-reports the real
figure by ~140 bytes of operation framing plus a 64-byte signature. For the Comptroller
that difference was the whole apparent safety margin, so this check measures the forged
operation instead, via deploy_script/measure_origination_size.js. That produces the same
quantity Taquito reports as `estimate.originate().opSize`, but it forges locally, so it
needs no RPC, no funded account and no secret key and can run on every commit. The
code+storage figures are still printed for continuity with previous CI output.

Unlike a naive version of this check, this test does NOT read whatever happens to be
checked in under compiled_contracts/ (which can be stale relative to the current PR's
source changes). Instead it invokes the real SmartPy CLI to compile the relevant
targets fresh, into a temporary output directory, against a throwaway manifest of
placeholder addresses (borrowed from e2e/deploy_result/deploy.json, which already
contains a full set of syntactically-valid KT1/tz1 addresses for exactly this
purpose). This means a source change that meaningfully grows a contract (e.g.
disabling code sharing/lazification) is caught in the same PR that introduces it,
without needing a network connection.

Requires deploy/deploy_script/node_modules (`npm ci` in that directory) for the Taquito
forger; CI installs it before this step.

Run with:
    python3 deploy/compile_targets/tests/test_operation_size.py [/path/to/SmartPy.sh]
(defaults to ~/smartpy-cli/SmartPy.sh if no argument/env var is given)
"""
import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PLACEHOLDER_MANIFEST = os.path.join(REPO_ROOT, 'e2e', 'deploy_result', 'deploy.json')
DEPLOY_SCRIPT_DIR = os.path.join(REPO_ROOT, 'deploy', 'deploy_script')
MEASURE_SCRIPT = os.path.join(DEPLOY_SCRIPT_DIR, 'measure_origination_size.js')

DEFAULT_MAX_TOTAL_BYTES = 32768

# Taquito prepends a reveal to the same operation group when the deployer account has not
# yet revealed its public key, and that reveal shares the 32768-byte budget. A contract
# that only fits without the reveal cannot be originated as the deployer's first
# operation, so a margin thinner than this is reported as a warning. Value from Taquito's
# own REVEAL_LENGTH (324 hex chars, i.e. 162 bytes).
REVEAL_BYTES = 162

# Compile target file -> (compiled contract directory name, extra SmartPy CLI flags).
# The extra flags MUST match exactly what deploy_previewnet.sh/deploy_mainnet.sh pass
# for the same target (--erase-comments --erase-var-annots --initial-cast for
# Comptroller), otherwise this test measures a different (larger/smaller) artifact
# than what's actually deployed, which can produce a false pass or false fail against
# the safety threshold. See deploy/shell_scripts/deploy_*.sh for the source of truth.
COMPILE_TARGETS = {
    'CompileGovernance.py': ('Governance', []),
    'CompileTezFinOracle.py': ('TezFinOracle', []),
    'CompileComptroller.py': ('Comptroller', ['--erase-comments', '--erase-var-annots', '--initial-cast']),
}


def find_smartpy_cli():
    if len(sys.argv) > 1:
        return sys.argv[1]
    envPath = os.environ.get('SMARTPY_CLI')
    if envPath:
        return envPath
    return os.path.expanduser('~/smartpy-cli/SmartPy.sh')


def read_sizes_csv(csvPath):
    sizes = {}
    with open(csvPath, newline='') as f:
        for row in csv.reader(f):
            if len(row) != 2:
                continue
            key, value = row
            try:
                sizes[key.strip()] = int(value.strip())
            except ValueError:
                continue
    return sizes


def find_sizes_csv(contractDir):
    for name in sorted(os.listdir(contractDir)):
        if name.endswith('_sizes.csv'):
            return os.path.join(contractDir, name)
    return None


def measure_origination_operation(contractDir):
    """Returns the forged origination operation size for a compiled contract directory,
    as {'forgedBytes': int, 'signatureBytes': int, 'opSize': int}. Raises RuntimeError if
    the measurement could not be taken, so a broken forger fails the check instead of
    silently falling back to the narrower code+storage number."""
    result = subprocess.run(
        ['node', MEASURE_SCRIPT, contractDir, '--json', '--max', str(DEFAULT_MAX_TOTAL_BYTES)],
        cwd=DEPLOY_SCRIPT_DIR,
        capture_output=True,
        text=True,
    )
    # The script exits non-zero when the contract is over the limit, and that is a
    # measurement we still want to report, so only treat unparseable output as an error.
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(
            f'could not measure the origination operation via {MEASURE_SCRIPT} '
            f'(exit {result.returncode}). Ensure `npm ci` has run in deploy/deploy_script so '
            f'@taquito/local-forging is available.\nstdout:\n{result.stdout.strip()[-1000:]}\n'
            f'stderr:\n{result.stderr.strip()[-1000:]}'
        )


def main():
    maxTotalBytes = int(os.environ.get('MAX_CONTRACT_OPERATION_BYTES', DEFAULT_MAX_TOTAL_BYTES))
    smartpy = find_smartpy_cli()

    if not os.path.exists(smartpy):
        print(
            f'[ERROR] SmartPy CLI not found at "{smartpy}". Install it (see README "Run Contract '
            f'Unit Tests") or pass its path as an argument / SMARTPY_CLI env var. Refusing to skip '
            f'this check silently.'
        )
        sys.exit(1)

    if not os.path.exists(PLACEHOLDER_MANIFEST):
        print(f'[ERROR] Placeholder manifest not found at {PLACEHOLDER_MANIFEST}.')
        sys.exit(1)

    tmpDir = tempfile.mkdtemp(prefix='tezfin_size_check_')
    try:
        failures = []
        checkedAny = False
        for fileName, (contractName, extraFlags) in COMPILE_TARGETS.items():
            targetPath = os.path.join(REPO_ROOT, 'deploy', 'compile_targets', fileName)
            result = subprocess.run(
                [smartpy, 'compile', targetPath, tmpDir, '--purge', '--protocol', 'kathmandu', *extraFlags],
                cwd=REPO_ROOT,
                env={**os.environ, 'DEPLOY_MANIFEST': PLACEHOLDER_MANIFEST},
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                failures.append(
                    f'{contractName}: SmartPy compile of {fileName} failed (exit {result.returncode}). '
                    f'stderr:\n{result.stderr.strip()[-2000:]}'
                )
                continue

            contractDir = os.path.join(tmpDir, contractName)
            if not os.path.isdir(contractDir):
                failures.append(f'{contractName}: compile succeeded but expected output dir {contractDir} is missing')
                continue

            csvPath = find_sizes_csv(contractDir)
            if not csvPath:
                failures.append(f'{contractName}: no *_sizes.csv found under {contractDir}')
                continue

            sizes = read_sizes_csv(csvPath)
            contractBytes = sizes.get('contract')
            storageBytes = sizes.get('storage')
            if contractBytes is None or storageBytes is None:
                failures.append(f'{contractName}: {csvPath} is missing "contract" and/or "storage" rows')
                continue

            try:
                measured = measure_origination_operation(contractDir)
            except RuntimeError as error:
                failures.append(f'{contractName}: {error}')
                continue

            checkedAny = True
            codeAndStorage = contractBytes + storageBytes
            opSize = measured['opSize']
            margin = maxTotalBytes - opSize
            status = 'OK' if opSize <= maxTotalBytes else 'TOO LARGE'
            print(
                f'[INFO] {contractName}: code={contractBytes}B, storage={storageBytes}B '
                f'(code+storage={codeAndStorage}B); forged origination operation='
                f'{measured["forgedBytes"]}B + signature={measured["signatureBytes"]}B = '
                f'{opSize}B, margin={margin}B ({status})'
            )
            if opSize > maxTotalBytes:
                failures.append(
                    f'{contractName}: the origination operation is {opSize}B, which exceeds the '
                    f'{maxTotalBytes}B protocol limit by {-margin}B, so it cannot be injected at all. '
                    f'Note this is the size of the whole operation, not just code+storage '
                    f'({codeAndStorage}B). Make the contract smaller; raising '
                    f'MAX_CONTRACT_OPERATION_BYTES cannot make an over-limit operation injectable.'
                )
            elif margin < REVEAL_BYTES:
                print(
                    f'[WARN] {contractName}: only {margin}B of margin remains, which is less than the '
                    f'~{REVEAL_BYTES}B a reveal operation adds. This contract can only be originated '
                    f'from an account whose public key is already revealed, because Taquito batches the '
                    f'reveal into the same operation group and the 32768B limit applies to the group. '
                    f'Reduce the contract size before deploying from a fresh key.'
                )

        if not checkedAny:
            print(
                '[ERROR] No contracts were actually checked (every compile attempt failed or produced no '
                'output). Treating this as a failure rather than silently passing.'
            )
            failures.append('No contracts were successfully compiled/measured.')

        if failures:
            print('Operation size check FAILED:')
            for failure in failures:
                print(f'  - {failure}')
            sys.exit(1)

        print(
            f'Operation size check passed (forged origination operation must stay within '
            f'{maxTotalBytes}B per contract).'
        )
    finally:
        shutil.rmtree(tmpDir, ignore_errors=True)


if __name__ == '__main__':
    main()

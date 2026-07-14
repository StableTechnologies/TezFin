"""Guards against a contract's compiled code+storage growing past safe origination
size thresholds before it reaches mainnet. This was called out specifically in the
PR #455 review re: Comptroller's `lazify=True` removal - that change alone is benign
(SmartPy just emits a differently-shaped, non-lazified Michelson representation), but
the review recommended verifying the actual origination operation size stays
comfortably under protocol limits before a real mainnet deployment.

Unlike a naive version of this check, this test does NOT read whatever happens to be
checked in under compiled_contracts/ (which can be stale relative to the current PR's
source changes). Instead it invokes the real SmartPy CLI to compile the relevant
targets fresh, into a temporary output directory, against a throwaway manifest of
placeholder addresses (borrowed from e2e/deploy_result/deploy.json, which already
contains a full set of syntactically-valid KT1/tz1 addresses for exactly this
purpose). This means a source change that meaningfully grows a contract (e.g.
disabling code sharing/lazification) is caught in the same PR that introduces it,
without needing a network connection.

This does NOT call any RPC or attempt a live fee/gas estimate. That happens inside
`deployMichelsonContract()` in deploy_script/util.js (`tezos.estimate.originate`),
which does need real network access and is the authoritative check before mainnet.

Run with:
    python3 deploy/compile_targets/tests/test_operation_size.py [/path/to/SmartPy.sh]
(defaults to ~/smartpy-cli/SmartPy.sh if no argument/env var is given)
"""
import csv
import os
import shutil
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PLACEHOLDER_MANIFEST = os.path.join(REPO_ROOT, 'e2e', 'deploy_result', 'deploy.json')

DEFAULT_MAX_TOTAL_BYTES = 32000

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

            checkedAny = True
            total = contractBytes + storageBytes
            status = 'OK' if total <= maxTotalBytes else 'TOO LARGE'
            print(f'[INFO] {contractName}: code={contractBytes}B, storage={storageBytes}B, total={total}B ({status})')
            if total > maxTotalBytes:
                failures.append(
                    f'{contractName}: total origination size {total}B exceeds the safety threshold of '
                    f'{maxTotalBytes}B (code={contractBytes}B, storage={storageBytes}B). Investigate whether a '
                    f'recent change (e.g. disabling lazification) meaningfully increased contract size before '
                    f'deploying to mainnet; consider raising MAX_CONTRACT_OPERATION_BYTES only after confirming '
                    f'the actual origination still succeeds comfortably within protocol limits (see README '
                    f'"Mainnet Deployment" and deployMichelsonContract()\'s fee estimate in deploy_script/util.js).'
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

        print(f'Operation size check passed (threshold: {maxTotalBytes}B per contract).')
    finally:
        shutil.rmtree(tmpDir, ignore_errors=True)


if __name__ == '__main__':
    main()

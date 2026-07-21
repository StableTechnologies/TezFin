"""Compile production-critical contracts twice and compare canonical artifacts."""

import hashlib
import json
import os
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
BASE_PLACEHOLDER_MANIFEST = os.path.join(REPO_ROOT, 'e2e', 'deploy_result', 'deploy.json')
COMPILE_TARGETS = {
    'CompileGovernance.py': (['Governance'], []),
    'CompileTezFinOracle.py': (['TezFinOracle'], []),
    'CompileComptroller.py': (
        ['Comptroller'],
        ['--erase-comments', '--erase-var-annots', '--initial-cast'],
    ),
    'CompileIRMs.py': (['CFA12_IRM', 'CFA2_IRM', 'CXTZ_IRM'], []),
    'CompileCtzBTC_IRM.py': (['CtzBTC_IRM'], []),
    'CompileCUSDt.py': (
        ['CUSDt'],
        ['--erase-comments', '--erase-var-annots', '--initial-cast'],
    ),
    'CompileCXTZ.py': (
        ['CXTZ'],
        ['--erase-comments', '--erase-var-annots', '--initial-cast'],
    ),
    'CompileTzBTC.py': (
        ['CtzBTC'],
        ['--erase-comments', '--erase-var-annots', '--initial-cast'],
    ),
}
PLACEHOLDER_ADDRESS = 'KT1ENe4jbDE1QVG1euryp23GsAeWuEwJutQX'


def find_smartpy_cli():
    if len(sys.argv) > 1:
        return os.path.abspath(os.path.expanduser(sys.argv[1]))
    return os.path.abspath(os.path.expanduser(os.environ.get('SMARTPY_CLI', '~/smartpy-cli/SmartPy.sh')))


def find_single_file(directory, suffix):
    matches = sorted(name for name in os.listdir(directory) if name.endswith(suffix))
    if len(matches) != 1:
        raise RuntimeError(f'Expected one *{suffix} under {directory}, found {len(matches)}')
    return os.path.join(directory, matches[0])


def canonical_json_hash(file_path):
    with open(file_path, encoding='utf-8') as source:
        value = json.load(source)
    encoded = json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True).encode()
    return hashlib.sha256(encoded).hexdigest()


def compile_once(smartpy, output_dir, manifest_path):
    hashes = {}
    for file_name, (contract_names, extra_flags) in COMPILE_TARGETS.items():
        target_path = os.path.join(REPO_ROOT, 'deploy', 'compile_targets', file_name)
        result = subprocess.run(
            [smartpy, 'compile', target_path, output_dir, '--purge',
             '--protocol', 'kathmandu', *extra_flags],
            cwd=REPO_ROOT,
            env={**os.environ, 'DEPLOY_MANIFEST': manifest_path},
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f'{file_name} compilation failed with exit {result.returncode}:\n'
                f'{result.stderr.strip()[-4000:]}'
            )

        for contract_name in contract_names:
            contract_dir = os.path.join(output_dir, contract_name)
            hashes[contract_name] = {
                'contractSha256': canonical_json_hash(
                    find_single_file(contract_dir, '_contract.json')
                ),
                'storageSha256': canonical_json_hash(
                    find_single_file(contract_dir, '_storage.json')
                ),
            }
    return hashes


def write_placeholder_manifest(path):
    with open(BASE_PLACEHOLDER_MANIFEST, encoding='utf-8') as source:
        manifest = json.load(source)
    for key in ('USDt', 'tzBTC', 'CtzBTC_IRM'):
        manifest.setdefault(key, PLACEHOLDER_ADDRESS)
    with open(path, 'w', encoding='utf-8') as destination:
        json.dump(manifest, destination, sort_keys=True)


def main():
    smartpy = find_smartpy_cli()
    if not os.path.isfile(smartpy):
        raise RuntimeError(f'SmartPy CLI not found at {smartpy}')
    if not os.path.isfile(BASE_PLACEHOLDER_MANIFEST):
        raise RuntimeError(f'Placeholder manifest not found at {BASE_PLACEHOLDER_MANIFEST}')

    with tempfile.TemporaryDirectory(prefix='tezfin_repro_a_') as first_dir, \
            tempfile.TemporaryDirectory(prefix='tezfin_repro_b_') as second_dir, \
            tempfile.NamedTemporaryFile(mode='w', suffix='.json') as manifest_file:
        write_placeholder_manifest(manifest_file.name)
        first_hashes = compile_once(smartpy, first_dir, manifest_file.name)
        second_hashes = compile_once(smartpy, second_dir, manifest_file.name)

    if first_hashes != second_hashes:
        print('[ERROR] SmartPy builds are not reproducible:', file=sys.stderr)
        print(json.dumps({'first': first_hashes, 'second': second_hashes}, indent=2),
              file=sys.stderr)
        return 1

    output = {
        'smartpyVersion': '0.16.0',
        'protocol': 'kathmandu',
        'contracts': first_hashes,
    }
    output_path = os.environ.get('COMPILED_HASHES_OUTPUT')
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as destination:
            json.dump(output, destination, indent=2, sort_keys=True)
            destination.write('\n')

    print(json.dumps(output, indent=2, sort_keys=True))
    print('[INFO] Two clean SmartPy builds produced identical canonical hashes.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'[ERROR] {error}', file=sys.stderr)
        sys.exit(1)

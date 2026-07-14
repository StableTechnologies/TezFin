"""Cheap, static (no SmartPy, no network) sanity checks for the deployment pipeline
wiring itself, as opposed to the compiled contracts. These catch a class of bug where
a shell script or config references a file/attribute that doesn't actually exist, or
where the JS and Python sides of manifest-path resolution silently disagree - the kind
of mistake that's easy to introduce when editing deploy_previewnet.sh/deploy_mainnet.sh
or Config.py/util.js without re-running an actual deployment.

Covers:
  1. Every `Compile*.py` target invoked from deploy_previewnet.sh/deploy_mainnet.sh
     actually exists on disk (catches a typo'd/renamed/deleted compile target being
     left dangling in a shell script).
  2. CompileCtzBTC_IRM.py reads its parameters from CFG.CtzBTC_IRM (its own,
     asset-specific IRM config block), not another market's IRM config block by
     mistake - mirrors the same class of bug test_irm_wiring.py catches for the
     ꜰToken market compile targets themselves.
  3. Config.py's `_defaultDeployResultPath` and deploy_script/util.js's
     `resolveDeployResultPath()` resolve to the same default manifest file for a given
     `networkProfile` ("previewnet" vs "mainnet"), so the two languages can't silently
     read/write different manifests for the same run (this parity is already asserted
     in comments in both files; this test actually executes both and compares).

Run with: python3 deploy/compile_targets/tests/test_deploy_pipeline_wiring.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
COMPILE_TARGETS_DIR = os.path.join(REPO_ROOT, 'deploy', 'compile_targets')
SHELL_SCRIPTS_DIR = os.path.join(REPO_ROOT, 'deploy', 'shell_scripts')
UTIL_JS_PATH = os.path.join(REPO_ROOT, 'deploy', 'deploy_script', 'util.js')

SHELL_SCRIPTS_TO_CHECK = ['deploy_previewnet.sh', 'deploy_mainnet.sh']

COMPILE_TARGET_REFERENCE_PATTERN = re.compile(
    r'compile_and_deploy\s+\./deploy/compile_targets/(\S+\.py)'
)


def check_shell_script_compile_targets():
    """Every Compile*.py referenced from a deploy shell script must exist on disk."""
    failures = []
    for scriptName in SHELL_SCRIPTS_TO_CHECK:
        scriptPath = os.path.join(SHELL_SCRIPTS_DIR, scriptName)
        if not os.path.exists(scriptPath):
            failures.append(f'{scriptName}: shell script not found at {scriptPath}')
            continue

        with open(scriptPath) as f:
            source = f.read()

        referencedFiles = COMPILE_TARGET_REFERENCE_PATTERN.findall(source)
        if not referencedFiles:
            failures.append(f'{scriptName}: no "compile_and_deploy ./deploy/compile_targets/*.py" calls found at all')
            continue

        for fileName in referencedFiles:
            targetPath = os.path.join(COMPILE_TARGETS_DIR, fileName)
            if not os.path.exists(targetPath):
                failures.append(
                    f'{scriptName}: references {fileName}, but no such file exists at '
                    f'{targetPath} (typo, renamed, or deleted compile target left dangling in the script).'
                )
    return failures


def check_ctzbtc_irm_config_source():
    """CompileCtzBTC_IRM.py must read its parameters from CFG.CtzBTC_IRM, not another
    market's IRM config block (e.g. CFG.CFA12_IRM) by mistake."""
    filePath = os.path.join(COMPILE_TARGETS_DIR, 'CompileCtzBTC_IRM.py')
    if not os.path.exists(filePath):
        return [f'CompileCtzBTC_IRM.py not found at {filePath}']

    with open(filePath) as f:
        source = f.read()

    referencedConfigKeys = set(re.findall(r'CFG\.(\w*_IRM)\.', source))
    if referencedConfigKeys != {'CtzBTC_IRM'}:
        return [
            f'CompileCtzBTC_IRM.py: expected it to read parameters only from CFG.CtzBTC_IRM, '
            f'but found references to {sorted(referencedConfigKeys) or "no IRM config at all"} instead.'
        ]
    return []


def resolve_python_default_manifest_path(networkProfile):
    """Runs Config.py's actual _defaultDeployResultPath logic (not a re-implementation
    of it), by exec'ing its source with JsonDeserializer.Deserialize monkeypatched (via
    a runner script written to a temp file, to avoid any nested-quoting issues with
    -c) so the deploy_script/config.json read returns a fake object with just the
    networkProfile under test, without touching the real (copilot-ignored) config.json
    on disk."""
    configPyPath = os.path.join(COMPILE_TARGETS_DIR, 'Config.py')
    runnerSource = (
        "import sys, json\n"
        "from types import SimpleNamespace\n"
        f"sys.path.insert(0, {COMPILE_TARGETS_DIR!r})\n"
        f"with open({configPyPath!r}) as f:\n"
        "    configPySource = f.read()\n"
        "patched = configPySource.replace(\n"
        "    'deployScriptConfig = JsonDeserializer.Deserialize(PATH_DEPLOY_SCRIPT_CONFIG)',\n"
        f"    'deployScriptConfig = SimpleNamespace(networkProfile=' + repr({networkProfile!r}) + ')',\n"
        ")\n"
        # Only exec up to (and including) the _defaultDeployResultPath assignment: the
        # lines after it try to actually open the resolved manifest file, which may not
        # exist locally (e.g. deploy.mainnet.json before a real mainnet run has ever
        # happened). We only care about the resolved *path*, not reading the manifest.
        "marker = 'deployResult = JsonDeserializer.Deserialize('\n"
        "cutoff = patched.index(marker)\n"
        "truncated = patched[:cutoff]\n"
        "namespace = {'__name__': 'Config'}\n"
        "exec(compile(truncated, 'Config.py', 'exec'), namespace)\n"
        "print(namespace['_defaultDeployResultPath'])\n"
    )
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as runnerFile:
        runnerFile.write(runnerSource)
        runnerPath = runnerFile.name
    try:
        result = subprocess.run([sys.executable, runnerPath], cwd=REPO_ROOT, capture_output=True, text=True)
    finally:
        os.unlink(runnerPath)
    if result.returncode != 0:
        raise RuntimeError(f'Failed to evaluate Config.py default path for networkProfile={networkProfile!r}: {result.stderr}')
    return result.stdout.strip()


def resolve_js_default_manifest_path(networkProfile):
    """Runs deploy_script/util.js's actual resolveDeployResultPath() (not a
    re-implementation of it), with a temporary config.json declaring the given
    networkProfile swapped in via a *copy* of the deploy_script directory contents
    (util.js is copied, not symlinked, so Node's `path.join(__dirname, ...)` resolves
    relative to the temp copy's own config.json, not the real one). node_modules is
    symlinked (read-only, no config.json inside it) purely to avoid copying it."""
    realDeployScriptDir = os.path.dirname(UTIL_JS_PATH)
    with tempfile.TemporaryDirectory() as tmpDir:
        tmpDeployScriptDir = os.path.join(tmpDir, 'deploy_script')
        os.makedirs(tmpDeployScriptDir)
        with open(UTIL_JS_PATH) as src, \
                open(os.path.join(tmpDeployScriptDir, 'util.js'), 'w') as dst:
            dst.write(src.read())
        os.symlink(
            os.path.join(realDeployScriptDir, 'node_modules'),
            os.path.join(tmpDeployScriptDir, 'node_modules'),
        )
        with open(os.path.join(tmpDeployScriptDir, 'config.json'), 'w') as f:
            json.dump({'networkProfile': networkProfile, 'tezosNode': 'https://example.invalid'}, f)

        script = (
            f"const {{ resolveDeployResultPath }} = require({json.dumps(os.path.join(tmpDeployScriptDir, 'util.js'))});"
            "console.log(resolveDeployResultPath());"
        )
        result = subprocess.run(['node', '-e', script], cwd=tmpDir, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f'Failed to evaluate util.js default path for networkProfile={networkProfile!r}: {result.stderr}')
        return result.stdout.strip()


def check_manifest_path_resolution_parity():
    """Config.py (Python) and util.js (JS) must resolve to the same default manifest
    file for a given networkProfile, otherwise compile targets and deploy scripts can
    silently read/write different files for what's meant to be the same run."""
    failures = []
    for networkProfile in ['previewnet', 'mainnet', None]:
        try:
            pyPath = resolve_python_default_manifest_path(networkProfile)
            jsPath = resolve_js_default_manifest_path(networkProfile)
        except RuntimeError as error:
            failures.append(str(error))
            continue

        pyFileName = os.path.basename(pyPath)
        jsFileName = os.path.basename(jsPath)
        if pyFileName != jsFileName:
            failures.append(
                f'networkProfile={networkProfile!r}: Config.py resolves to "{pyFileName}", but util.js '
                f'resolves to "{jsFileName}". These must match or the JS and Python sides of the deploy '
                f'pipeline can silently disagree about which manifest file to use.'
            )
    return failures


def main():
    failures = []
    failures += check_shell_script_compile_targets()
    failures += check_ctzbtc_irm_config_source()
    failures += check_manifest_path_resolution_parity()

    if failures:
        print('Deploy pipeline wiring check FAILED:')
        for failure in failures:
            print(f'  - {failure}')
        sys.exit(1)

    print('Deploy pipeline wiring check passed:')
    print('  - All Compile*.py targets referenced from deploy_previewnet.sh/deploy_mainnet.sh exist.')
    print('  - CompileCtzBTC_IRM.py reads parameters only from CFG.CtzBTC_IRM.')
    print('  - Config.py and util.js agree on the default manifest path for previewnet/mainnet/unset profiles.')


if __name__ == '__main__':
    main()

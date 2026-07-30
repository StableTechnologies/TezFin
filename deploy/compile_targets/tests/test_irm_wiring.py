"""Static check that each ꜰToken market's compile target is wired to its own,
asset-specific interest-rate-model config key from Config.json, instead of reusing
another market's IRM config by mistake (as tzBTC previously reused CUSDtz's CFA12_IRM
via CompileIRMs.py, even though a dedicated CtzBTC_IRM config/compile target existed).

This test inspects only the deploy_result.<Market>_IRM attribute lookups performed by
each CompileXxx.py compile target (by reading the source), and confirms that they
match this expected mapping instead of trying to execute the SmartPy compile targets
directly (which requires a populated deploy manifest and the SmartPy runtime).

Run with: python3 deploy/compile_targets/tests/test_irm_wiring.py
"""
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
COMPILE_TARGETS_DIR = os.path.join(REPO_ROOT, 'deploy', 'compile_targets')

# Expected mapping: compile target file -> (market name, expected IRM manifest key).
# Add new markets here as they are added to the deploy pipeline.
EXPECTED_MARKET_IRM = {
    'CompileCUSDt.py': ('CUSDt', 'CFA2_IRM'),
    'CompileCUSDtz.py': ('CUSDtz', 'CFA12_IRM'),
    'CompileCXTZ.py': ('CXTZ', 'CXTZ_IRM'),
    'CompileTzBTC.py': ('CtzBTC', 'CtzBTC_IRM'),
}

IRM_ATTR_PATTERN = re.compile(r'CFG\.deployResult\.(\w*_IRM)')


def find_irm_reference(sourceText):
    matches = set(IRM_ATTR_PATTERN.findall(sourceText))
    return matches


def main():
    failures = []

    for fileName, (marketName, expectedIrmKey) in EXPECTED_MARKET_IRM.items():
        filePath = os.path.join(COMPILE_TARGETS_DIR, fileName)
        if not os.path.exists(filePath):
            failures.append(f'{fileName}: file not found at {filePath}')
            continue

        with open(filePath) as f:
            source = f.read()

        referencedIrmKeys = find_irm_reference(source)
        if expectedIrmKey not in referencedIrmKeys:
            failures.append(
                f'{fileName} ({marketName} market): expected it to reference '
                f'CFG.deployResult.{expectedIrmKey}, but found references to '
                f'{sorted(referencedIrmKeys) or "no IRM at all"} instead.'
            )
        elif len(referencedIrmKeys) > 1:
            failures.append(
                f'{fileName} ({marketName} market): references multiple IRM keys '
                f'{sorted(referencedIrmKeys)}; expected exactly {expectedIrmKey}.'
            )

        if fileName == 'CompileTzBTC.py' and 'CFG.CFA12.initialExchangeRateMantissa' not in source:
            failures.append(
                'CompileTzBTC.py (CtzBTC market): expected the FA1.2 initial '
                'exchange rate from CFG.CFA12.'
            )

    if failures:
        print('IRM wiring check FAILED:')
        for failure in failures:
            print(f'  - {failure}')
        sys.exit(1)

    print(f'IRM wiring check passed for {len(EXPECTED_MARKET_IRM)} market(s):')
    for fileName, (marketName, expectedIrmKey) in EXPECTED_MARKET_IRM.items():
        print(f'  - {marketName} ({fileName}) -> {expectedIrmKey}')


if __name__ == '__main__':
    main()

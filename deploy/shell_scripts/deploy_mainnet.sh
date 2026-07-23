#!/usr/bin/env bash
set -euo pipefail
# Deploys the protocol to mainnet using only canonical production token/oracle
# addresses. This script never runs CompileTestData.py and will refuse to proceed
# unless:
#   - config.json declares networkProfile "mainnet" and the connected RPC reports a
#     known mainnet chain id (see assert_network.js),
#   - the manifest already contains vetted PriceOracle/USDt/tzBTC addresses that match
#     the allowlist in mainnet_preflight.js and exist on-chain,
#   - MAINNET_DEPLOY_CONFIRM=yes is set after reviewing the printed deployment plan.
#
# Order matters: the plan/confirmation check (mainnet_preflight.js) runs BEFORE
# prepare.js, so the manifest is never touched (not even to set OriginatorAddress) if
# the operator declines to confirm.
#
# 1 - path to SmartPy.sh
# example:  MAINNET_DEPLOY_CONFIRM=yes ./deploy/shell_scripts/deploy_mainnet.sh ~/smartpy-cli/SmartPy.sh

smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"

# Belt-and-suspenders: even though util.js/Config.py already default to
# deploy.mainnet.json when config.json declares networkProfile "mainnet", export it
# explicitly here so every child process (node and non-node alike) agrees on the same
# manifest file without relying solely on that implicit default.
export DEPLOY_MANIFEST="${DEPLOY_MANIFEST:-TezFinBuild/deploy_result/deploy.mainnet.json}"

node ./deploy/deploy_script/assert_network.js mainnet

# Sanity check: every market compile target must reference its own asset-specific IRM
# config key (e.g. tzBTC -> CtzBTC_IRM), not another market's by mistake.
python3 ./deploy/compile_targets/tests/test_irm_wiring.py

# Sanity check: shell-script compile-target references exist, CtzBTC_IRM reads its own
# config block, and Config.py/util.js agree on the default manifest path per profile.
python3 ./deploy/compile_targets/tests/test_deploy_pipeline_wiring.py

node ./deploy/deploy_script/mainnet_preflight.js
node ./deploy/deploy_script/prepare.js

compile_and_deploy() {
  "$smartpy" compile "$1" ./TezFinBuild/compiled_contracts --purge --protocol kathmandu "${@:2}"
  node ./deploy/deploy_script/deploy.js
}

# Intentionally does NOT run CompileTestData.py: mainnet must never originate mock
# tokens or a mock PriceOracle. PriceOracle/USDt/tzBTC are required to already be
# present (and verified against the allowlist) in the manifest by mainnet_preflight.js
# above.
node ./deploy/deploy_script/verify_oracle.js
compile_and_deploy ./deploy/compile_targets/CompileTezFinOracle.py
compile_and_deploy ./deploy/compile_targets/CompileGovernance.py
compile_and_deploy ./deploy/compile_targets/CompileComptroller.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileIRMs.py
compile_and_deploy ./deploy/compile_targets/CompileCtzBTC_IRM.py
compile_and_deploy ./deploy/compile_targets/CompileCUSDt.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileCXTZ.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileTzBTC.py --erase-comments --erase-var-annots --initial-cast

echo ""
echo "[INFO] Mainnet origination complete. Do NOT unpause markets or open the protocol to users"
echo "[INFO] until the admin handoff checklist in README.md ('Post-Deployment Admin Handoff') has"
echo "[INFO] been fully completed and verified on-chain."

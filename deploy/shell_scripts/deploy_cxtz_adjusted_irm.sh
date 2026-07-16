#!/usr/bin/env bash
set -euo pipefail
# Deploy the v3.0 fXTZ AdjustedInterestRateModel to mainnet.
# This is a targeted recovery deploy: it must not run against Previewnet by
# accident. Requires config.json networkProfile "mainnet" (or an explicit
# DEPLOY_MANIFEST pointing at deploy.mainnet.json) and a known mainnet chain id.
#
# After deployment, switch fXTZ to the new IRM via Governance:
#   setInterestRateModel({ cToken: <fXTZ>, interestRateModel: <CXTZ_AdjustedIRM> })
#
# 1 - path to SmartPy.sh
# example:
#   MAINNET_DEPLOY_CONFIRM=yes ./deploy/shell_scripts/deploy_cxtz_adjusted_irm.sh ~/smartpy-cli/SmartPy.sh
smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"

export DEPLOY_MANIFEST="${DEPLOY_MANIFEST:-TezFinBuild/deploy_result/deploy.mainnet.json}"

node ./deploy/deploy_script/assert_network.js mainnet
node ./deploy/deploy_script/mainnet_preflight.js
node ./deploy/deploy_script/prepare.js
"$smartpy" compile ./deploy/compile_targets/CompileCXTZ_AdjustedIRM.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu
node ./deploy/deploy_script/deploy.js
echo ""
echo "[INFO] CXTZ_AdjustedIRM deployed to mainnet manifest ${DEPLOY_MANIFEST}."
echo "[INFO] Next step (governance):"
echo "       setInterestRateModel({ cToken: fXTZ, interestRateModel: <CXTZ_AdjustedIRM> })"

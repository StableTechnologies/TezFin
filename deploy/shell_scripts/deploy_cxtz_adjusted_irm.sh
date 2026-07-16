#!/usr/bin/env bash
set -euo pipefail
# Deploy the v3.0 fXTZ adjusted interest-rate model (virtual cash offset only).
# After deployment, switch fXTZ to the new IRM via Governance:
#   setInterestRateModel({ cToken: <fXTZ>, interestRateModel: <CXTZ_AdjustedIRM> })
#
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_cxtz_adjusted_irm.sh ~/smartpy-cli/SmartPy.sh
smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"
node ./deploy/deploy_script/prepare.js
"$smartpy" compile ./deploy/compile_targets/CompileCXTZ_AdjustedIRM.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu
node ./deploy/deploy_script/deploy.js
echo ""
echo "[INFO] CXTZ_AdjustedIRM deployed. Next step (governance):"
echo "       setInterestRateModel({ cToken: fXTZ, interestRateModel: <CXTZ_AdjustedIRM address from manifest> })"

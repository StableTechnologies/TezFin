#!/usr/bin/env bash
set -euo pipefail
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_governance.sh ~/smartpy-cli/SmartPy.sh

smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"
node ./deploy/deploy_script/prepare.js
"$smartpy" compile ./deploy/compile_targets/CompileGovernance.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu
node ./deploy/deploy_script/deploy.js

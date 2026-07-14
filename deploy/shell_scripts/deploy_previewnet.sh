#!/usr/bin/env bash
set -euo pipefail
# Deploys the full protocol to Previewnet, including mock test tokens and a mock
# PriceOracle. This script must NEVER be used for a mainnet deployment; use
# deploy_mainnet.sh instead, which refuses to run CompileTestData.py.
#
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_previewnet.sh ~/smartpy-cli/SmartPy.sh

smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"

# Guard against accidentally pointing this script at mainnet: config.json (or
# DEPLOY_MANIFEST) must not resolve to a mainnet chain id.
node ./deploy/deploy_script/assert_network.js previewnet

node ./deploy/deploy_script/prepare.js

compile_and_deploy() {
  "$smartpy" compile "$1" ./TezFinBuild/compiled_contracts --purge --protocol kathmandu "${@:2}"
  node ./deploy/deploy_script/deploy.js
}

# WARNING: CompileTestData.py compiles/deploys a mock PriceOracle plus fake tzBTC,
# USDtz, and USDt tokens (with an admin-mint entry point). This is Previewnet-only
# test tooling. Do NOT run this script against mainnet; a mainnet deployment must
# supply the vetted production oracle and canonical token addresses directly in the
# manifest instead of originating these mocks. See README.md "Deployment Manifest".
compile_and_deploy ./deploy/compile_targets/CompileTestData.py
node ./deploy/deploy_script/verify_oracle.js
compile_and_deploy ./deploy/compile_targets/CompileTezFinOracle.py
compile_and_deploy ./deploy/compile_targets/CompileGovernance.py
compile_and_deploy ./deploy/compile_targets/CompileComptroller.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileIRMs.py
compile_and_deploy ./deploy/compile_targets/CompileCtzBTC_IRM.py
compile_and_deploy ./deploy/compile_targets/CompileCUSDt.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileCXTZ.py --erase-comments --erase-var-annots --initial-cast
compile_and_deploy ./deploy/compile_targets/CompileTzBTC.py --erase-comments --erase-var-annots --initial-cast

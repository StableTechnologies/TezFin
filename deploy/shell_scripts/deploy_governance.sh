#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_governance.sh ~/smartpy-cli/SmartPy.sh

($1 compile ./deploy/compile_targets/CompileGovernance.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
&& echo "CompileGovernance.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

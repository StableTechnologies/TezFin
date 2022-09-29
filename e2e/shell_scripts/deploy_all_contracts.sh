#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./e2e/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh

 cd ./deploy/deploy_script && npm install
 cd -
 cd ./src/util && npm install
 cd -
 cd ./postdeploy && npm install
 cd -
 
 export E2E=e2e/deploy_result/deploy.json
# 
# ($1 compile ./deploy/compile_targets/CompileTestData.py ./e2e/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileTestData.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileTezFinOracle.py ./e2e/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileTezFinOracle.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileGovernance.py ./e2e/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileGovernance.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileIRMs.py ./e2e/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileIRMs.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileComptroller.py ./e2e/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
# && echo "CompileComptroller.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileCBTCtz.py ./e2e/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
# && echo "CompileCBTCtz.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileCEthtz.py ./e2e/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
# && echo "CompileCEthtz.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileCUSDtz.py ./e2e/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
# && echo "CompileCUSDtz.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js
# 
# ($1 compile ./deploy/compile_targets/CompileCXTZ.py ./e2e/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
# && echo "CompileCXTZ.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy_e2e.js

node ./postdeploy/build/src/e2e.js

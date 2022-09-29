#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh

# ($1 compile ./deploy/compile_targets/CompileTestData.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileTestData.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy.js

# ($1 compile ./deploy/compile_targets/CompileTezFinOracle.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileTezFinOracle.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy.js

# ($1 compile ./deploy/compile_targets/CompileGovernance.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
# && echo "CompileGovernance.py was successfully compiled" || echo
# node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileComptroller.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileComptroller.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileIRMs.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
&& echo "CompileIRMs.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCBTCtz.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCBTCtz.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCEthtz.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCEthtz.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCUSDtz.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCUSDtz.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCXTZ.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCXTZ.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

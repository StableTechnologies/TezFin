#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh

($1 compile ./deploy/compile_targets/CompileTestData.py ./TezFinBuild/compiled_contracts --purge --protocol florence)\
&& echo "CompileTestData.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileGovernance.py ./TezFinBuild/compiled_contracts --purge --protocol florence)\
&& echo "CompileGovernance.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileComptroller.py ./TezFinBuild/compiled_contracts --purge --protocol florence --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileComptroller.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileIRMs.py ./TezFinBuild/compiled_contracts --purge --protocol florence)\
&& echo "CompileIRMs.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCFA2.py ./TezFinBuild/compiled_contracts --purge --protocol florence --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCFA2.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCFA12.py ./TezFinBuild/compiled_contracts --purge --protocol florence --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCFA12.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

($1 compile ./deploy/compile_targets/CompileCXTZ.py ./TezFinBuild/compiled_contracts --purge --protocol florence --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCXTZ.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

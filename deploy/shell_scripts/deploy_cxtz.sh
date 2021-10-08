#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_cxtz.sh ~/smartpy-cli/SmartPy.sh


($1 compile ./deploy/compile_targets/CompileCXTZ_IRM.py ./TezFinBuild/compiled_contracts --purge --protocol granada)\
&& echo "CompileCXTZ_IRM.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js


($1 compile ./deploy/compile_targets/CompileCXTZ.py ./TezFinBuild/compiled_contracts --purge --protocol granada --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCXTZ.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

#!/bin/bash
set -e # Any subsequent(*) commands which fail will cause the shell script to exit immediately
# 1 - path to SmartPy.sh
# example:  ./deploy/shell_scripts/deploy_cfa2.sh ~/smartpy-cli/SmartPy.sh


($1 compile ./deploy/compile_targets/CompileCFA2_IRM.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu)\
&& echo "CompileCFA2_IRM.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js


($1 compile ./deploy/compile_targets/CompileCFA2.py ./TezFinBuild/compiled_contracts --purge --protocol kathmandu --erase-comments --erase-var-annots --initial-cast)\
&& echo "CompileCFA2.py was successfully compiled" || echo
node ./deploy/deploy_script/deploy.js

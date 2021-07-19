#!/bin/bash
# 1 - path to SmartPy.sh
# example:  .../TezFin$ ./contracts/tests/run_tests.sh ~/smartpy-cli/SmartPy.sh

PASSED=0
COUNT=0

for filename in ./contracts/tests/*.py
do
    echo -e "------------------------------------------"
    echo ${filename}: | cut -d'/' -f 4
    ($1 test ${filename} ../TezFinTest/ --html) && echo "PASS" && let PASSED++ || echo
    let COUNT++
done

echo -e "------------------------------------------"
echo ${PASSED} out of ${COUNT} tests passed

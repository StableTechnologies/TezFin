# TezFin Contracts

This project is implementation of Compound Protocol on Tezos chain using SmartPy language.

## Project structure

SmartPy CLI is required to interact with contracts. For installation please refer to https://smartpy.io/cli/

Code is organized in following structure

 - [contracts](contracts) - contains SmartPy code of smart contracts
    - [interfaces](contracts/interfaces) - smart contracts interfaces with description of external entry points
    - [utils](contracts/utils) - smart contracts extentions with utility functions
    - [tests](contracts/tests) - unit tests
        - [mock](contracts/tests/mock) - mock contracts for test purposes
        - [utils](contracts/tests/utils) - unit tests utility functions
        - [CTokenTest.py](contracts/tests/CTokenTest.py) - unit tests for generic CToken code
        - [CFA12Test.py](contracts/tests/CFA12Test.py) - unit tests for FA1.2 CToken template
        - [CXTZTest.py](contracts/tests/CXTZTest.py) - unit tests for XTZ CToken implementation
        - [InterestRateModelTest.py](contracts/tests/InterestRateModelTest.py) - unit tests for interest rate model
    - [InterestRateModel.py](contracts/InterestRateModel.py) - interest rate model, calculates supply and borrow rate for CToken instanse
    - [CToken.py](contracts/CToken.py) - CToken generic code
    - [CFA12.py](contracts/CFA12.py) - FA1.2 CToken template
    - [CXTZ.py](contracts/CXTZ.py) - XTZ CToken implementation

## Test Contracts

To run tests use SmartPy CLI from the core project directory. Create a folder for test outputs. Example:

```sh
mkdir TezFinTest
cd TezFin
~/smartpy-cli/SmartPy.sh test contracts/tests/CTokenTest.py ../TezFinTest/ --html
```

After executing the previous command, an HTML report will be generated in "../TezFinTest/CToken_Tests/log.html"

## Compile Contracts

## Deploy Contracts

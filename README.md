# TezFin

This project is the implementation of Compound Protocol on Tezos chain using SmartPy language.

The diagram demonstrates relations between contracts
![](https://github.com/RSerhii/TezFin/blob/master/docs/ContractsRelations.png)

The platform consists of the following contracts
 - Governance - admin contract that has the ability to change parameters in Comptroller and ꜰTokens. The first version of Tezfin has a centralized Governance that works as an admin proxy
 - Comptroller - the risk management layer. It determines how much collateral a user is required to maintain, and whether (and by how much) a user can be liquidated. Each time a user interacts with a ꜰToken, the Comptroller is asked to approve or deny the transaction
   - Price oracle - third-party contract that provides price data. Used by Comptroller for liquidity calculation 
 - ꜰToken - Tezfin market for the underlying token
   - Interest Rate Model - specifies rules of acquiring interest rate and borrow rate
   - Underlying token - the contract of the actual asset. Tezfin supports both FA1.2 and FA2 tokens

For the detailed description please refer to the [wiki pages](https://github.com/RSerhii/TezFin/wiki).

## Project Structure

SmartPy CLI is required to interact with contracts. For installation please refer to https://smartpy.io/cli/

Code is organized in the following structure

 - [contracts](contracts) - contains SmartPy code of smart contracts
    - [interfaces](contracts/interfaces) - smart contracts interfaces with description of external entry points
    - [utils](contracts/utils) - smart contracts extensions with utility functions
    - [tests](contracts/tests) - unit tests
        - [mock](contracts/tests/mock) - mock contracts for test purposes
        - [utils](contracts/tests/utils) - unit tests utility functions
        - [CTokenTest.py](contracts/tests/CTokenTest.py) - unit tests for generic ꜰToken code
        - [CFA12Test.py](contracts/tests/CFA12Test.py) - unit tests for FA1.2 ꜰToken template
        - [CFA2Test.py](contracts/tests/CFA2Test.py) - unit tests for FA2 ꜰToken template
        - [CXTZTest.py](contracts/tests/CXTZTest.py) - unit tests for XTZ ꜰToken implementation
        - [InterestRateModelTest.py](contracts/tests/InterestRateModelTest.py) - unit tests for interest rate model
        - [ComptrollerTest.py](contracts/tests/ComptrollerTest.py) - unit tests for Comptroller
        - [GovernanceTest.py](contracts/tests/GovernanceTest.py) - unit tests for Governance
    - [InterestRateModel.py](contracts/InterestRateModel.py) - interest rate model, calculates supply and borrow rate for ꜰToken instance
    - [CToken.py](contracts/CToken.py) - ꜰToken generic code
    - [CFA12.py](contracts/CFA12.py) - FA1.2 ꜰToken template
    - [CFA2.py](contracts/CFA2.py) - FA2 ꜰToken template
    - [CXTZ.py](contracts/CXTZ.py) - XTZ ꜰToken implementation
    - [Comptroller.py](contracts/Comptroller.py) - The risk model contract
    - [Governance.py](contracts/Governance.py) - Performs control over the protocol
 - [docs](docs) - materials for documentation
 - [deploy](deploy) - contains scipts for compilation and deployment
    - [test_data](deploy/test_data) - additional contracts for deploment on testnet
    - [compile_targets](deploy/compile_targets) - contains description of compilation targets
       - [Config.json](deploy/compile_targets/Config.json) - contracts compilation configuration
    - [deploy_script](deploy/deploy_script)
       - [config.json](deploy/deploy_script/config.json) - deploy configuration with secret data
       - [deploy.js](deploy/deploy_script/deploy.js) - conseiljs deployment script
    - [shell_scripts](deploy/shell_scripts) - shell scripts to compile and deploy contracts in one command

## Run Contract Unit Tests

To run tests use SmartPy CLI from the core project directory. Create a folder for test outputs. Example:


```sh
mkdir TezFinTest
cd TezFin
~/smartpy-cli/SmartPy.sh test contracts/tests/CTokenTest.py ../TezFinTest/ --html
```

After executing the previous command, an HTML report will be generated in "../TezFinTest/CToken_Tests/log.html"

The following script does the same as above, but for all test files at once.
```sh
cd TezFin
./contracts/tests/run_tests.sh ~/smartpy-cli/SmartPy.sh
```

## Run Contract E2E Tests

To run e2e tests use the following command, you will need latest smartpy cli installed.

```sh
cd TezFin
./e2e/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh
```

## Compile & Deploy Contracts

To compile and deploy all contracts at once:
1. Configure parameters for contracts compilation in [Config.json](deploy/compile_targets/Config.json). Reffer to [Compilation arguments](https://github.com/RSerhii/TezFin/wiki/Compilation-arguments)
2. Configure deployment parameters in [config.json](deploy/deploy_script/config.json)
3. Install deployment dependencies
```sh
cd deploy/deploy_script
npm install
```
4. Run deployment script
```sh
./deploy/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh
```

> To deploy a specific contract run the corresponding script in [shell_scripts](deploy/shell_scripts)


## Build and Run UI

1. Build Util

```sh
cd src/util
npm install
```

2. Build UI
```sh
cd src/ui
npm install
```

2. Run

```sh
cd src/ui
npm start
```



import smartpy as sp

UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
# use harbinger instead of mock
# Oracle = sp.io.import_script_from_url("file:deploy/test_data/PriceOracle.py")
FA12 = sp.io.import_script_from_url("file:deploy/test_data/FA1.2.py")
FA2 = sp.io.import_script_from_url("file:deploy/test_data/FA2.py")

UTILS.checkDependencies(CFG.FA12)
UTILS.checkDependencies(CFG.FA2)

# Oracle.compile()
FA12.compile("tzBTC",CFG.deployResult.OriginatorAddress)
FA12.compile("USDtz",CFG.deployResult.OriginatorAddress)
FA2.compile("USDt",CFG.deployResult.OriginatorAddress)
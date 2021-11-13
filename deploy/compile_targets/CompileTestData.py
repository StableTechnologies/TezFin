import smartpy as sp

UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
# use granadanet harbinger instead of mock
# Oracle = sp.io.import_script_from_url("file:deploy/test_data/PriceOracle.py")
FA12 = sp.io.import_script_from_url("file:deploy/test_data/FA1.2.py")
FA2 = sp.io.import_script_from_url("file:deploy/test_data/FA2.py")

UTILS.checkDependencies(CFG.FA12)
UTILS.checkDependencies(CFG.FA2)

# Oracle.compile()
FA12.compile(CFG.deployResult.OriginatorAddress)
FA2.compile(CFG.deployResult.OriginatorAddress)

import smartpy as sp

TezFinOracle = sp.io.import_script_from_url("file:contracts/TezFinOracle.py").TezFinOracle
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("TezFinOracle", TezFinOracle(
    admin = sp.address(CFG.deployResult.Governance),
    oracle =sp.address(CFG.deployResult.PriceOracle)))

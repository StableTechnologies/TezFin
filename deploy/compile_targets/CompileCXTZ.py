import smartpy as sp

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CXTZ)

sp.add_compilation_target("CXTZ", CXTZ.CXTZ(
    scale_=1000000000000000000,
    underlyingScale_=1000000,
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CXTZ_IRM),
    administrator_ = sp.address(CFG.deployResult.Governance),
    ))

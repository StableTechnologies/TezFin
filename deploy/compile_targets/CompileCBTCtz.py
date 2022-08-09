import smartpy as sp

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA2)

sp.add_compilation_target("CBTCtz", CFA2.CFA2(
    scale_=1000000000000000000,
    underlyingScale_=100000000,
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CFA2_IRM),
    initialExchangeRateMantissa_ = sp.nat(CFG.CFA2.initialExchangeRateMantissa),
    administrator_ = sp.address(CFG.deployResult.Governance),
    fa2_TokenAddress_ = sp.address(CFG.deployResult.BTCtz),
    tokenId_ = sp.nat(CFG.CFA2.tokenId)
    ))

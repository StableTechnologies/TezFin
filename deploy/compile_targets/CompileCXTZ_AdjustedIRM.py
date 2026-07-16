import smartpy as sp

AdjustedIRM = sp.io.import_script_from_url("file:contracts/AdjustedInterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CXTZ_AdjustedIRM", AdjustedIRM.AdjustedInterestRateModel(
    scale_=CFG.CXTZ_AdjustedIRM.scale,
    multiplierPerBlock_=CFG.CXTZ_AdjustedIRM.multiplierPerBlock,
    baseRatePerBlock_=CFG.CXTZ_AdjustedIRM.baseRatePerBlock,
    jumpMultiplierPerBlock_=CFG.CXTZ_AdjustedIRM.jumpMultiplierPerBlock,
    kink_=CFG.CXTZ_AdjustedIRM.kink,
    cashOffset_=CFG.CXTZ_AdjustedIRM.cashOffset,
    administrator_=sp.address(CFG.deployResult.Governance)))

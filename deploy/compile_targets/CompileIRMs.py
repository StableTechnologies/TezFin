import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CFA12_IRM", IRM.InterestRateModel(
    scale_ = CFG.CUSDtz_IRM.scale,
    multiplierPerBlock_ = CFG.CUSDtz_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CUSDtz_IRM.baseRatePerBlock,
    jumpMultiplierPerBlock_ = CFG.CUSDtz_IRM.jumpMultiplierPerBlock,
    kink_ = CFG.CUSDtz_IRM.kink))

sp.add_compilation_target("CFA2_IRM", IRM.InterestRateModel(
    scale_ = CFG.CUSDt_IRM.scale,
    multiplierPerBlock_ = CFG.CUSDt_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CUSDt_IRM.baseRatePerBlock,
    jumpMultiplierPerBlock_ = CFG.CUSDt_IRM.jumpMultiplierPerBlock,
    kink_ = CFG.CUSDt_IRM.kink))

sp.add_compilation_target("CXTZ_IRM", IRM.InterestRateModel(
    scale_ = CFG.CXTZ_IRM.scale,
    multiplierPerBlock_ = CFG.CXTZ_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CXTZ_IRM.baseRatePerBlock,
    jumpMultiplierPerBlock_ = CFG.CXTZ_IRM.jumpMultiplierPerBlock,
    kink_ = CFG.CXTZ_IRM.kink))

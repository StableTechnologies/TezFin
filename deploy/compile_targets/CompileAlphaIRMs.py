import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/AlphaInterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CFA12_IRM", IRM.InterestRateModel(
    scale_ = 1000000000000000000,
    multiplierPerBlock_ = CFG.CFA12_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CFA12_IRM.baseRatePerBlock,
    alpha_ = CFG.ALPHA_CFA12_IRM.alpha,
    admin_ = ""))

sp.add_compilation_target("CFA2_IRM", IRM.InterestRateModel(
    scale_ = 1000000000000000000,
    multiplierPerBlock_ = CFG.CFA2_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CFA2_IRM.baseRatePerBlock,
    alpha_ = CFG.ALPHA_CFA2_IRM.alpha,
    admin_ = ""))

sp.add_compilation_target("CXTZ_IRM", IRM.InterestRateModel(
    scale_ = 1000000000000000000,
    multiplierPerBlock_ = CFG.CXTZ_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CXTZ_IRM.baseRatePerBlock,
    alpha_ = CFG.ALPHA_CXTZ_IRM.alpha,
    admin_ = ""))
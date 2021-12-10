import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CFA12_IRM", IRM.InterestRateModel(
    scale = CFG.CFA12_IRM.multiplierPerBlock,
    multiplierPerBlock_ = CFG.CFA12_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CFA12_IRM.baseRatePerBlock))

sp.add_compilation_target("CFA2_IRM", IRM.InterestRateModel(
    scale = CFG.CFA2_IRM.multiplierPerBlock,
    multiplierPerBlock_ = CFG.CFA2_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CFA2_IRM.baseRatePerBlock))

sp.add_compilation_target("CXTZ_IRM", IRM.InterestRateModel(
    scale = CFG.CXTZ_IRM.multiplierPerBlock,
    multiplierPerBlock_ = CFG.CXTZ_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CXTZ_IRM.baseRatePerBlock))

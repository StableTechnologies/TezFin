import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CFA2_IRM", IRM.InterestRateModel(multiplierPerBlock_ = CFG.CFA2_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CFA2_IRM.baseRatePerBlock, scale_ = CFG.CFA2_IRM.scale))

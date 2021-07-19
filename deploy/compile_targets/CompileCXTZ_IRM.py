import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CXTZ_IRM", IRM.InterestRateModel(multiplierPerBlock_ = CFG.CXTZ_IRM.multiplierPerBlock,
    baseRatePerBlock_ = CFG.CXTZ_IRM.baseRatePerBlock))


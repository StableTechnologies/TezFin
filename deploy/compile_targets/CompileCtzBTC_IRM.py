import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CtzBTC_IRM", IRM.InterestRateModel(multiplierPerBlock_=CFG.CtzBTC_IRM.multiplierPerBlock,
                                                             baseRatePerBlock_=CFG.CtzBTC_IRM.baseRatePerBlock, jumpMultiplierPerBlock_=CFG.CtzBTC_IRM.jumpMultiplierPerBlock, kink_=CFG.CtzBTC_IRM.kink, scale_=CFG.CtzBTC_IRM.scale))
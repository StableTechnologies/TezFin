import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CUSDtz_IRM", IRM.InterestRateModel(multiplierPerBlock_=CFG.CUSDtz_IRM.multiplierPerBlock,
                                                              baseRatePerBlock_=CFG.CUSDtz_IRM.baseRatePerBlock, jumpMultiplierPerBlock_=CFG.CUSDtz_IRM.jumpMultiplierPerBlock, kink_=CFG.CUSDtz_IRM.kink, scale_=CFG.CUSDtz_IRM.scale))

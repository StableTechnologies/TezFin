import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CUSDt_IRM", IRM.InterestRateModel(multiplierPerBlock_=CFG.CUSDt_IRM.multiplierPerBlock,
                                                             baseRatePerBlock_=CFG.CUSDt_IRM.baseRatePerBlock, jumpMultiplierPerBlock_=CFG.CUSDt_IRM.jumpMultiplierPerBlock, kink_=CFG.CUSDt_IRM.kink, scale_=CFG.CUSDt_IRM.scale))

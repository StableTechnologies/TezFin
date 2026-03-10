import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

sp.add_compilation_target("CstXTZ_IRM", IRM.InterestRateModel(multiplierPerBlock_=CFG.CstXTZ_IRM.multiplierPerBlock,
                                                             baseRatePerBlock_=CFG.CstXTZ_IRM.baseRatePerBlock, jumpMultiplierPerBlock_=CFG.CstXTZ_IRM.jumpMultiplierPerBlock, kink_=CFG.CstXTZ_IRM.kink, scale_=CFG.CstXTZ_IRM.scale))
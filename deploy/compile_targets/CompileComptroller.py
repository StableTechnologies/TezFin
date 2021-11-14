import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.Comptroller)

sp.add_compilation_target("Comptroller", CMPT.Comptroller(administrator_ = sp.address(CFG.deployResult.Governance),
    # oracleAddress_ = sp.address(CFG.deployResult.PriceOracle),
    oracleAddress_ = sp.address("KT1MwuujtBodVQFm1Jk1KTGNc49wygqoLvpe"),
    closeFactorMantissa_ = sp.nat(CFG.Comptroller.closeFactorMantissa),
    liquidationIncentiveMantissa_ = sp.nat(CFG.Comptroller.liquidationIncentiveMantissa)
    ))

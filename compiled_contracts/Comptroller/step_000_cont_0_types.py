import smartpy as sp

tstorage = sp.TRecord(account_liquidity = sp.TBigMap(sp.TAddress, sp.TRecord(liquidity = sp.TInt, updateLevel = sp.TNat, valid = sp.TBool).layout(("liquidity", ("updateLevel", "valid")))), activeOperations = sp.TSet(sp.TNat), administrator = sp.TAddress, closeFactorMantissa = sp.TNat, collaterals = sp.TBigMap(sp.TAddress, sp.TSet(sp.TAddress)), expScale = sp.TNat, halfExpScale = sp.TNat, liquidationIncentiveMantissa = sp.TNat, loans = sp.TBigMap(sp.TAddress, sp.TSet(sp.TAddress)), marketNameToAddress = sp.TMap(sp.TString, sp.TAddress), markets = sp.TBigMap(sp.TAddress, sp.TRecord(borrowPaused = sp.TBool, collateralFactor = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), isListed = sp.TBool, mintPaused = sp.TBool, name = sp.TString, price = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), priceExp = sp.TNat, priceTimestamp = sp.TTimestamp, updateLevel = sp.TNat).layout(((("borrowPaused", "collateralFactor"), ("isListed", "mintPaused")), (("name", "price"), ("priceExp", ("priceTimestamp", "updateLevel")))))), maxPriceTimeDifference = sp.TInt, oracleAddress = sp.TAddress, pendingAdministrator = sp.TOption(sp.TAddress), transferPaused = sp.TBool).layout(((("account_liquidity", ("activeOperations", "administrator")), (("closeFactorMantissa", "collaterals"), ("expScale", "halfExpScale"))), ((("liquidationIncentiveMantissa", "loans"), ("marketNameToAddress", "markets")), (("maxPriceTimeDifference", "oracleAddress"), ("pendingAdministrator", "transferPaused")))))
tparameter = sp.TVariant(acceptGovernance = sp.TUnit, borrowAllowed = sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))), disableMarket = sp.TAddress, enterMarkets = sp.TList(sp.TAddress), exitMarket = sp.TAddress, hardResetOp = sp.TUnit, liquidateBorrowAllowed = sp.TRecord(borrower = sp.TAddress, cTokenBorrowed = sp.TAddress, cTokenCollateral = sp.TAddress, liquidator = sp.TAddress, repayAmount = sp.TNat).layout((("borrower", "cTokenBorrowed"), ("cTokenCollateral", ("liquidator", "repayAmount")))), mintAllowed = sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))), redeemAllowed = sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))), removeFromLoans = sp.TAddress, repayBorrowAllowed = sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))), setAccountLiquidityWithView = sp.TAddress, setAccountSnapAndExitMarket = sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))), setBorrowPaused = sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")), setCloseFactor = sp.TNat, setCollateralFactor = sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat).layout(("cToken", "newCollateralFactor")), setLiquidationIncentive = sp.TNat, setMintPaused = sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")), setPendingGovernance = sp.TAddress, setPriceOracleAndTimeDiff = sp.TRecord(priceOracle = sp.TAddress, timeDiff = sp.TInt).layout(("priceOracle", "timeDiff")), setTransferPaused = sp.TBool, supportMarket = sp.TRecord(cToken = sp.TAddress, name = sp.TString, priceExp = sp.TNat).layout(("cToken", ("name", "priceExp"))), sweepFA12 = sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", "tokenAddress")), sweepFA2 = sp.TRecord(amount = sp.TNat, id = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", ("id", "tokenAddress"))), sweepMutez = sp.TBool, transferAllowed = sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))), updateAccountLiquidityWithView = sp.TAddress, updateAllAssetPricesWithView = sp.TUnit).layout((((("acceptGovernance", ("borrowAllowed", "disableMarket")), (("enterMarkets", "exitMarket"), ("hardResetOp", "liquidateBorrowAllowed"))), (("mintAllowed", ("redeemAllowed", "removeFromLoans")), (("repayBorrowAllowed", "setAccountLiquidityWithView"), ("setAccountSnapAndExitMarket", "setBorrowPaused")))), ((("setCloseFactor", ("setCollateralFactor", "setLiquidationIncentive")), (("setMintPaused", "setPendingGovernance"), ("setPriceOracleAndTimeDiff", "setTransferPaused"))), (("supportMarket", ("sweepFA12", "sweepFA2")), (("sweepMutez", "transferAllowed"), ("updateAccountLiquidityWithView", "updateAllAssetPricesWithView"))))))
tprivates = { }
tviews = { "liquidateCalculateSeizeTokens": (sp.TRecord(actualRepayAmount = sp.TNat, cTokenBorrowed = sp.TAddress, cTokenCollateral = sp.TAddress).layout(("actualRepayAmount", ("cTokenBorrowed", "cTokenCollateral"))), sp.TNat), "seizeAllowed": (sp.TRecord(cTokenBorrowed = sp.TAddress, cTokenCollateral = sp.TAddress).layout(("cTokenBorrowed", "cTokenCollateral")), sp.TBool) }
import smartpy as sp

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")

def validateAccountLiquidityRelevance(scenario, actionText, bLevel, account, comptroller, accountToUpdate, callback, arg, **runOptions):
    scenario.h4(f'call {actionText} with old account liquidity')
    scenario += callback(arg).run(sender = account, level = bLevel.add(CMPT.UPDATE_LIQUIDITY_PERIOD + 1), valid = False, **runOptions)

    scenario.h4(f'call {actionText} with relevant account liquidity')
    updateAccountLiquidity(scenario, bLevel, account, comptroller, accountToUpdate)
    scenario += callback(arg).run(sender = account, level = bLevel.next(), **runOptions)

def validateAssetPriceRelevance(scenario, actionText, bLevel, account, comptroller, asset, callback, arg, **runOptions):
    scenario.h4(f'call {actionText} with old asset price')
    scenario += callback(arg).run(sender = account, level = bLevel.add(CMPT.UPDATE_PRICE_PERIOD + 1), valid = False, **runOptions)

    scenario.h4(f'call {actionText} with relevant asset price')
    updateAssetPrice(scenario, bLevel, account, comptroller, asset)
    scenario += callback(arg).run(sender = account, level = bLevel.next(), **runOptions)

def validateAccrueInterestRelevance(scenario, actionText, bLevel, account, cToken, callback, arg, **runOptions):
    scenario.h4(f'call {actionText} with old accrue interest')
    scenario += callback(arg).run(sender = account, level = bLevel.add(CToken.UPDATE_ACCRUE_INTEREST_PERIOD + 1), valid = False, **runOptions)
    scenario.verify(cToken.data.isAccrualInterestValid == False)

    scenario.h4(f'call {actionText} with relevant accrue interest')
    updateAccrueInterest(scenario, bLevel, account, cToken)
    scenario += callback(arg).run(sender = account, level = bLevel.next(), **runOptions)

def validateAllRelevance(scenario, actionText, bLevel, account, cToken, callback, arg, comptroller, asset, accountToUpdate, **runOptions):
    updateAllRelevance(scenario, bLevel, account, cToken, comptroller, asset, accountToUpdate)
    scenario.h4(f'call {actionText} with relevant account liquidity, asset price and accrue interest')
    scenario += callback(arg).run(sender = account, level = bLevel.next(), **runOptions)
    scenario.verify(cToken.data.isAccrualInterestValid == False)

    scenario.h4(f'call {actionText} with old account liquidity')
    scenario += callback(arg).run(sender = account, level = bLevel.addWithoutModify(CMPT.UPDATE_LIQUIDITY_PERIOD + 1), valid = False, **runOptions)

def updateAllRelevance(scenario, bLevel, account, cToken, comptroller, asset, accountToUpdate):
    updateAccrueInterest(scenario, bLevel, account, cToken)
    updateAssetPrice(scenario, bLevel, account, comptroller, asset)
    updateAccountLiquidity(scenario, bLevel, account, comptroller, accountToUpdate)

def updateAccrueInterest(scenario, bLevel, account, cToken):
    scenario += cToken.accrueInterest().run(sender = account, level = bLevel.next())

def updateAssetPrice(scenario, bLevel, account, comptroller, asset):
    scenario += comptroller.updateAssetPrice(asset).run(sender = account, level = bLevel.next())

def updateAccountLiquidity(scenario, bLevel, account, comptroller, accountToUpdate):
    scenario += comptroller.updateAccountLiquidity(accountToUpdate).run(sender = account, level = bLevel.next())

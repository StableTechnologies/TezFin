import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(account_liquidity = sp.TBigMap(sp.TAddress, sp.TRecord(liquidity = sp.TInt, updateLevel = sp.TNat, valid = sp.TBool).layout(("liquidity", ("updateLevel", "valid")))), activeOperations = sp.TSet(sp.TNat), administrator = sp.TAddress, closeFactorMantissa = sp.TNat, collaterals = sp.TBigMap(sp.TAddress, sp.TSet(sp.TAddress)), expScale = sp.TNat, halfExpScale = sp.TNat, liquidationIncentiveMantissa = sp.TNat, loans = sp.TBigMap(sp.TAddress, sp.TSet(sp.TAddress)), marketNameToAddress = sp.TMap(sp.TString, sp.TAddress), markets = sp.TBigMap(sp.TAddress, sp.TRecord(borrowPaused = sp.TBool, collateralFactor = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), isListed = sp.TBool, mintPaused = sp.TBool, name = sp.TString, price = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), priceExp = sp.TNat, priceTimestamp = sp.TTimestamp, updateLevel = sp.TNat).layout(((("borrowPaused", "collateralFactor"), ("isListed", "mintPaused")), (("name", "price"), ("priceExp", ("priceTimestamp", "updateLevel")))))), maxPriceTimeDifference = sp.TInt, oracleAddress = sp.TAddress, pendingAdministrator = sp.TOption(sp.TAddress), transferPaused = sp.TBool).layout(((("account_liquidity", ("activeOperations", "administrator")), (("closeFactorMantissa", "collaterals"), ("expScale", "halfExpScale"))), ((("liquidationIncentiveMantissa", "loans"), ("marketNameToAddress", "markets")), (("maxPriceTimeDifference", "oracleAddress"), ("pendingAdministrator", "transferPaused"))))))
    self.init(account_liquidity = {},
              activeOperations = sp.set([]),
              administrator = sp.address('KT1NF6DKX5giazRTzPtEuNX1npkVcaoQkvK2'),
              closeFactorMantissa = 500000000000000000,
              collaterals = {},
              expScale = 1000000000000000000,
              halfExpScale = 500000000000000000,
              liquidationIncentiveMantissa = 1050000000000000000,
              loans = {},
              marketNameToAddress = {},
              markets = {},
              maxPriceTimeDifference = 86400,
              oracleAddress = sp.address('KT1LDtNKDnpziwSrmSfx3xCbs7nBMg7VFp4m'),
              pendingAdministrator = sp.none,
              transferPaused = True)

  @sp.entrypoint
  def acceptGovernance(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.pendingAdministrator.open_some(message = 'CMPT_NOT_SET_PENDING_ADMIN'), 'CMPT_NOT_PENDING_ADMIN')
    self.data.administrator = self.data.pendingAdministrator.open_some()
    self.data.pendingAdministrator = sp.none

  @sp.entrypoint
  def borrowAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))))
    sp.verify(~ self.data.markets[params.cToken].borrowPaused, 'CMPT_BORROW_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if ~ (self.data.loans.contains(params.borrower)):
      sp.verify(sp.sender == params.cToken, 'CMPT_INVALID_BORROW_SENDER')
      sp.verify((self.data.markets.contains(sp.sender)) & self.data.markets[sp.sender].isListed, 'CMPT_MARKET_NOT_LISTED')
      sp.if self.data.loans.contains(params.borrower):
        self.data.loans[params.borrower].add(sp.sender)
      sp.else:
        self.data.loans[params.borrower] = sp.set([sp.sender])
    sp.verify(self.data.account_liquidity.contains(params.borrower), 'CMPT_LIQUIDITY_ABSENT')
    sp.verify(self.data.account_liquidity[params.borrower].valid, 'CMPT_LIQUIDITY_INVALID')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.account_liquidity[params.borrower].updateLevel, sp.TNat)
    compute_Comptroller_759 = sp.local("compute_Comptroller_759", sp.as_nat(sp.level - self.data.account_liquidity[params.borrower].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_Comptroller_759.value == 0, 'CMPT_LIQUIDITY_OLD')
    sp.verify(sp.level == self.data.markets[params.cToken].updateLevel, 'CMPT_UPDATE_PRICE')
    sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
    sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.borrowAmount, sp.TNat)
    sp.set_type(self.data.markets[params.cToken].price.mantissa * params.borrowAmount, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.borrowAmount), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    compute_Comptroller_190 = sp.local("compute_Comptroller_190", self.data.account_liquidity[params.borrower].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.borrowAmount) // self.data.expScale))
    sp.verify(compute_Comptroller_190.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.borrower):
      self.data.account_liquidity[params.borrower].valid = False

  @sp.entrypoint
  def disableMarket(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify((self.data.markets.contains(params)) & self.data.markets[params].isListed, 'CMPT_MARKET_NOT_LISTED')
    self.data.markets[params].isListed = False

  @sp.entrypoint
  def enterMarkets(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TList(sp.TAddress))
    sp.for token in params:
      sp.verify((self.data.markets.contains(token)) & self.data.markets[token].isListed, 'CMPT_MARKET_NOT_LISTED')
      sp.if self.data.collaterals.contains(sp.sender):
        self.data.collaterals[sp.sender].add(token)
      sp.else:
        self.data.collaterals[sp.sender] = sp.set([token])
    sp.if self.data.account_liquidity.contains(sp.sender):
      self.data.account_liquidity[sp.sender].valid = False

  @sp.entrypoint
  def exitMarket(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TAddress)
    self.data.activeOperations.add(1)
    sp.transfer((sp.sender, sp.self_entrypoint('setAccountSnapAndExitMarket')), sp.tez(0), sp.contract(sp.TPair(sp.TAddress, sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))), params, entrypoint='getAccountSnapshot').open_some())

  @sp.entrypoint
  def hardResetOp(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.activeOperations = sp.set([])

  @sp.entrypoint
  def liquidateBorrowAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cTokenBorrowed = sp.TAddress, cTokenCollateral = sp.TAddress, liquidator = sp.TAddress, repayAmount = sp.TNat).layout((("borrower", "cTokenBorrowed"), ("cTokenCollateral", ("liquidator", "repayAmount")))))
    sp.verify((self.data.markets.contains(params.cTokenBorrowed)) & self.data.markets[params.cTokenBorrowed].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.verify((self.data.markets.contains(params.cTokenCollateral)) & self.data.markets[params.cTokenCollateral].isListed, 'CMPT_MARKET_NOT_LISTED')
    calculation = sp.local("calculation", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
    temp = sp.local("temp", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
    sp.if self.data.collaterals.contains(params.borrower):
      sp.for asset in self.data.collaterals[params.borrower].elements():
        sp.verify(sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
        params = sp.local("params", sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
        sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
        compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
        sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
        sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
        compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
        calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
        sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
          sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(params.value.cTokenBalance, sp.TNat)
          sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
          sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params.value.borrowBalance, sp.TNat)
        sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
        sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
        calculation.value.sumCollateral += calc.value.sumCollateral
        calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
    sp.if self.data.loans.contains(params.borrower):
      sp.for asset in self.data.loans[params.borrower].elements():
        sp.if self.data.collaterals.contains(params.borrower):
          sp.if ~ (self.data.collaterals[params.borrower].contains(asset)):
            sp.verify(sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
            params = sp.local("params", sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
            sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
            compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
            sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
            sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
            sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
            compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
            calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
            sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
              sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              sp.set_type(params.value.cTokenBalance, sp.TNat)
              sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
              sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(params.value.borrowBalance, sp.TNat)
            sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
            sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
            calculation.value.sumCollateral += calc.value.sumCollateral
            calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
        sp.else:
          sp.verify(sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
          params = sp.local("params", sp.view("getAccountSnapshotView", params.borrower, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
          sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
          compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
          sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
          sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
          sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
          compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
          calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
          sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
            sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(params.value.cTokenBalance, sp.TNat)
            sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
            sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(params.value.borrowBalance, sp.TNat)
          sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
          sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
          calculation.value.sumCollateral += calc.value.sumCollateral
          calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
    calcLiquidity = sp.local("calcLiquidity", calculation.value)
    compute_Comptroller_380 = sp.local("compute_Comptroller_380", calcLiquidity.value.sumCollateral - calcLiquidity.value.sumBorrowPlusEffects)
    liquidtiy = sp.local("liquidtiy", compute_Comptroller_380.value)
    sp.verify(liquidtiy.value < 0, 'CMPT_INSUFFICIENT_SHORTFALL')
    sp.set_type(self.data.closeFactorMantissa, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.closeFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.record(mantissa = self.data.closeFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.fst(sp.view("borrowBalanceStoredView", params.borrower, params.cTokenBorrowed, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID ACCOUNT BORROW BALANCE VIEW')), sp.TNat)
    sp.set_type(self.data.closeFactorMantissa * sp.fst(sp.view("borrowBalanceStoredView", params.borrower, params.cTokenBorrowed, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID ACCOUNT BORROW BALANCE VIEW')), sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.closeFactorMantissa * sp.fst(sp.view("borrowBalanceStoredView", params.borrower, params.cTokenBorrowed, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID ACCOUNT BORROW BALANCE VIEW'))), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    maxClose = sp.local("maxClose", (self.data.closeFactorMantissa * sp.fst(sp.view("borrowBalanceStoredView", params.borrower, params.cTokenBorrowed, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID ACCOUNT BORROW BALANCE VIEW'))) // self.data.expScale)
    sp.verify(maxClose.value >= params.repayAmount, 'CMPT_TOO_MUCH_REPAY')
    sp.if self.data.account_liquidity.contains(params.borrower):
      self.data.account_liquidity[params.borrower].valid = False
    sp.if self.data.account_liquidity.contains(params.liquidator):
      self.data.account_liquidity[params.liquidator].valid = False

  @sp.entrypoint
  def mintAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))))
    sp.verify(~ self.data.markets[params.cToken].mintPaused, 'CMPT_MINT_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if self.data.account_liquidity.contains(params.minter):
      self.data.account_liquidity[params.minter].valid = False

  @sp.entrypoint
  def redeemAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.collaterals.contains(params.redeemer)) & (self.data.collaterals[params.redeemer].contains(params.cToken)):
      sp.if (self.data.loans.contains(params.redeemer)) & (sp.len(self.data.loans[params.redeemer]) != 0):
        sp.verify(self.data.account_liquidity.contains(params.redeemer), 'CMPT_LIQUIDITY_ABSENT')
        sp.verify(self.data.account_liquidity[params.redeemer].valid, 'CMPT_LIQUIDITY_INVALID')
        sp.set_type(sp.level, sp.TNat)
        sp.set_type(self.data.account_liquidity[params.redeemer].updateLevel, sp.TNat)
        compute_Comptroller_759 = sp.local("compute_Comptroller_759", sp.as_nat(sp.level - self.data.account_liquidity[params.redeemer].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
        sp.verify(compute_Comptroller_759.value == 0, 'CMPT_LIQUIDITY_OLD')
        sp.verify(sp.level == self.data.markets[params.cToken].updateLevel, 'CMPT_UPDATE_PRICE')
        sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
        sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params.redeemAmount, sp.TNat)
        sp.set_type(self.data.markets[params.cToken].price.mantissa * params.redeemAmount, sp.TNat)
        sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.redeemAmount), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_Comptroller_190 = sp.local("compute_Comptroller_190", self.data.account_liquidity[params.redeemer].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.redeemAmount) // self.data.expScale))
        sp.verify(compute_Comptroller_190.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.redeemer):
      self.data.account_liquidity[params.redeemer].valid = False

  @sp.entrypoint
  def removeFromLoans(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.verify((self.data.markets.contains(sp.sender)) & self.data.markets[sp.sender].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.loans.contains(params)) & (self.data.loans[params].contains(sp.sender)):
      self.data.loans[params].remove(sp.sender)

  @sp.entrypoint
  def repayBorrowAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if self.data.account_liquidity.contains(params.borrower):
      self.data.account_liquidity[params.borrower].valid = False
    sp.if self.data.account_liquidity.contains(params.payer):
      self.data.account_liquidity[params.payer].valid = False

  @sp.entrypoint
  def setAccountLiquidityWithView(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TAddress)
    calculation = sp.local("calculation", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
    temp = sp.local("temp", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
    sp.if self.data.collaterals.contains(params):
      sp.for asset in self.data.collaterals[params].elements():
        sp.verify(sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
        params = sp.local("params", sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
        sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
        compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
        sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
        sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
        compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
        calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
        sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
          sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(params.value.cTokenBalance, sp.TNat)
          sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
          sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params.value.borrowBalance, sp.TNat)
        sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
        sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
        calculation.value.sumCollateral += calc.value.sumCollateral
        calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
    sp.if self.data.loans.contains(params):
      sp.for asset in self.data.loans[params].elements():
        sp.if self.data.collaterals.contains(params):
          sp.if ~ (self.data.collaterals[params].contains(asset)):
            sp.verify(sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
            params = sp.local("params", sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
            sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
            compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
            sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
            sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
            sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
            compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
            calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
            sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
              sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              sp.set_type(params.value.cTokenBalance, sp.TNat)
              sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
              sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
              calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(params.value.borrowBalance, sp.TNat)
            sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
            sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
            calculation.value.sumCollateral += calc.value.sumCollateral
            calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
        sp.else:
          sp.verify(sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').is_some(), 'CMPT_OUTDATED_ACCOUNT_SNAPHOT')
          params = sp.local("params", sp.view("getAccountSnapshotView", params, asset, sp.TOption(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))).open_some(message = 'INVALID ACCOUNT SNAPSHOT VIEW').open_some())
          sp.set_type(params.value.exchangeRateMantissa, sp.TNat)
          compute_Comptroller_522 = sp.local("compute_Comptroller_522", sp.record(mantissa = params.value.exchangeRateMantissa))
          sp.verify(sp.level == self.data.markets[asset].updateLevel, 'CMPT_UPDATE_PRICE')
          sp.verify(self.data.markets[asset].price.mantissa > 0, 'CMPT_INVALID_PRICE')
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(self.data.markets[asset].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
          sp.set_type(sp.record(mantissa = (self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(compute_Comptroller_522.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type((((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale, sp.TNat)
          compute_Comptroller_526 = sp.local("compute_Comptroller_526", sp.record(mantissa = (((self.data.markets[asset].price.mantissa * self.data.markets[asset].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_522.value.mantissa) // self.data.expScale))
          calc = sp.local("calc", sp.record(sumBorrowPlusEffects = 0, sumCollateral = 0))
          sp.if (self.data.collaterals.contains(params.value.account)) & (self.data.collaterals[params.value.account].contains(asset)):
            sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(compute_Comptroller_526.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            sp.set_type(params.value.cTokenBalance, sp.TNat)
            sp.set_type(compute_Comptroller_526.value.mantissa * params.value.cTokenBalance, sp.TNat)
            sp.set_type(sp.record(mantissa = compute_Comptroller_526.value.mantissa * params.value.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
            calc.value.sumCollateral += (compute_Comptroller_526.value.mantissa * params.value.cTokenBalance) // self.data.expScale
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(self.data.markets[asset].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(params.value.borrowBalance, sp.TNat)
          sp.set_type(self.data.markets[asset].price.mantissa * params.value.borrowBalance, sp.TNat)
          sp.set_type(sp.record(mantissa = self.data.markets[asset].price.mantissa * params.value.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          calc.value.sumBorrowPlusEffects += (self.data.markets[asset].price.mantissa * params.value.borrowBalance) // self.data.expScale
          calculation.value.sumCollateral += calc.value.sumCollateral
          calculation.value.sumBorrowPlusEffects += calc.value.sumBorrowPlusEffects
    liquidity = sp.local("liquidity", calculation.value)
    sp.verify(self.data.activeOperations.contains(4), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(4)
    self.data.account_liquidity[params] = sp.record(liquidity = liquidity.value.sumCollateral - liquidity.value.sumBorrowPlusEffects, updateLevel = sp.level, valid = True)

  @sp.entrypoint
  def setAccountSnapAndExitMarket(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))
    sp.verify(self.data.activeOperations.contains(1), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(1)
    sp.verify(params.borrowBalance == 0, 'CMPT_BORROW_IN_MARKET')
    sp.verify((self.data.markets.contains(sp.sender)) & self.data.markets[sp.sender].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.collaterals.contains(params.account)) & (self.data.collaterals[params.account].contains(sp.sender)):
      sp.if (self.data.loans.contains(params.account)) & (sp.len(self.data.loans[params.account]) != 0):
        sp.verify(self.data.account_liquidity.contains(params.account), 'CMPT_LIQUIDITY_ABSENT')
        sp.verify(self.data.account_liquidity[params.account].valid, 'CMPT_LIQUIDITY_INVALID')
        sp.set_type(sp.level, sp.TNat)
        sp.set_type(self.data.account_liquidity[params.account].updateLevel, sp.TNat)
        compute_Comptroller_759 = sp.local("compute_Comptroller_759", sp.as_nat(sp.level - self.data.account_liquidity[params.account].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
        sp.verify(compute_Comptroller_759.value == 0, 'CMPT_LIQUIDITY_OLD')
        sp.verify(sp.level == self.data.markets[sp.sender].updateLevel, 'CMPT_UPDATE_PRICE')
        sp.verify(self.data.markets[sp.sender].price.mantissa > 0, 'CMPT_INVALID_PRICE')
        sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params.cTokenBalance, sp.TNat)
        sp.set_type(self.data.markets[sp.sender].price.mantissa * params.cTokenBalance, sp.TNat)
        sp.set_type(sp.record(mantissa = self.data.markets[sp.sender].price.mantissa * params.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_Comptroller_190 = sp.local("compute_Comptroller_190", self.data.account_liquidity[params.account].liquidity - sp.to_int((self.data.markets[sp.sender].price.mantissa * params.cTokenBalance) // self.data.expScale))
        sp.verify(compute_Comptroller_190.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.account):
      self.data.account_liquidity[params.account].valid = False
    sp.if (self.data.collaterals.contains(params.account)) & (self.data.collaterals[params.account].contains(sp.sender)):
      self.data.collaterals[params.account].remove(sp.sender)
    sp.if self.data.account_liquidity.contains(params.account):
      self.data.account_liquidity[params.account].valid = False

  @sp.entrypoint
  def setBorrowPaused(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.markets[params.cToken].borrowPaused = params.state

  @sp.entrypoint
  def setCloseFactor(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.closeFactorMantissa = params

  @sp.entrypoint
  def setCollateralFactor(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat).layout(("cToken", "newCollateralFactor")))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    self.data.markets[params.cToken].collateralFactor.mantissa = params.newCollateralFactor

  @sp.entrypoint
  def setLiquidationIncentive(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.liquidationIncentiveMantissa = params

  @sp.entrypoint
  def setMintPaused(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.markets[params.cToken].mintPaused = params.state

  @sp.entrypoint
  def setPendingGovernance(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.some(params)

  @sp.entrypoint
  def setPriceOracleAndTimeDiff(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(priceOracle = sp.TAddress, timeDiff = sp.TInt).layout(("priceOracle", "timeDiff")))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.maxPriceTimeDifference = params.timeDiff
    self.data.oracleAddress = params.priceOracle

  @sp.entrypoint
  def setTransferPaused(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TBool)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.transferPaused = params

  @sp.entrypoint
  def supportMarket(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, name = sp.TString, priceExp = sp.TNat).layout(("cToken", ("name", "priceExp"))))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify(~ ((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed), 'CMPT_MARKET_ALREADY_LISTED')
    sp.set_type(500000000000000000, sp.TNat)
    sp.set_type(0, sp.TNat)
    self.data.markets[params.cToken] = sp.record(borrowPaused = True, collateralFactor = sp.record(mantissa = 500000000000000000), isListed = True, mintPaused = True, name = params.name, price = sp.record(mantissa = 0), priceExp = params.priceExp, priceTimestamp = sp.timestamp(0), updateLevel = 0)
    self.data.marketNameToAddress[params.name + '-USD'] = params.cToken

  @sp.entrypoint
  def sweepFA12(self, params):
    sp.set_type(params, sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", "tokenAddress")))
    sp.transfer(sp.record(from_ = sp.self_address, to_ = self.data.administrator, value = params.amount), sp.tez(0), sp.contract(sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))), params.tokenAddress, entrypoint='transfer').open_some())

  @sp.entrypoint
  def sweepFA2(self, params):
    sp.set_type(params, sp.TRecord(amount = sp.TNat, id = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", ("id", "tokenAddress"))))
    sp.transfer(sp.list([sp.record(from_ = sp.self_address, txs = sp.list([sp.record(amount = params.amount, to_ = self.data.administrator, token_id = params.id)]))]), sp.tez(0), sp.contract(sp.TList(sp.TRecord(from_ = sp.TAddress, txs = sp.TList(sp.TRecord(amount = sp.TNat, to_ = sp.TAddress, token_id = sp.TNat).layout(("to_", ("token_id", "amount"))))).layout(("from_", "txs"))), params.tokenAddress, entrypoint='transfer').open_some())

  @sp.entrypoint
  def sweepMutez(self, params):
    sp.set_type(params, sp.TBool)
    sp.if params:
      sp.send(self.data.administrator, sp.balance)
    sp.else:
      sp.send(self.data.administrator, sp.balance)

  @sp.entrypoint
  def transferAllowed(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))))
    sp.verify(~ self.data.transferPaused, 'CMPT_TRANSFER_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.collaterals.contains(params.src)) & (self.data.collaterals[params.src].contains(params.cToken)):
      sp.if (self.data.loans.contains(params.src)) & (sp.len(self.data.loans[params.src]) != 0):
        sp.verify(self.data.account_liquidity.contains(params.src), 'CMPT_LIQUIDITY_ABSENT')
        sp.verify(self.data.account_liquidity[params.src].valid, 'CMPT_LIQUIDITY_INVALID')
        sp.set_type(sp.level, sp.TNat)
        sp.set_type(self.data.account_liquidity[params.src].updateLevel, sp.TNat)
        compute_Comptroller_759 = sp.local("compute_Comptroller_759", sp.as_nat(sp.level - self.data.account_liquidity[params.src].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
        sp.verify(compute_Comptroller_759.value == 0, 'CMPT_LIQUIDITY_OLD')
        sp.verify(sp.level == self.data.markets[params.cToken].updateLevel, 'CMPT_UPDATE_PRICE')
        sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
        sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params.transferTokens, sp.TNat)
        sp.set_type(self.data.markets[params.cToken].price.mantissa * params.transferTokens, sp.TNat)
        sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.transferTokens), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_Comptroller_190 = sp.local("compute_Comptroller_190", self.data.account_liquidity[params.src].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.transferTokens) // self.data.expScale))
        sp.verify(compute_Comptroller_190.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.src):
      self.data.account_liquidity[params.src].valid = False

  @sp.entrypoint
  def updateAccountLiquidityWithView(self, params):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.set_type(params, sp.TAddress)
    sp.for asset in self.data.marketNameToAddress.values():
      sp.if self.data.markets[asset].updateLevel < sp.level:
        pricePair = sp.local("pricePair", sp.view("getPrice", self.data.markets[asset].name + '-USD', self.data.oracleAddress, sp.TPair(sp.TTimestamp, sp.TNat)).open_some(message = 'invalid oracle view call'))
        sp.if self.data.markets[asset].priceTimestamp != sp.timestamp(0):
          sp.verify((sp.now - sp.fst(pricePair.value)) <= self.data.maxPriceTimeDifference, 'STALE_ASSET_PRICE')
        sp.set_type(sp.snd(pricePair.value) * self.data.markets[asset].priceExp, sp.TNat)
        self.data.markets[asset].price = sp.record(mantissa = sp.snd(pricePair.value) * self.data.markets[asset].priceExp)
        self.data.markets[asset].priceTimestamp = sp.fst(pricePair.value)
        self.data.markets[asset].updateLevel = sp.level
    sp.for asset in self.data.marketNameToAddress.values():
      sp.send(asset, sp.tez(0))
    self.data.activeOperations.add(4)
    sp.transfer(params, sp.tez(0), sp.self_entrypoint('setAccountLiquidityWithView'))

  @sp.entrypoint
  def updateAllAssetPricesWithView(self):
    sp.verify(sp.amount == sp.mul(sp.set_type_expr(0, sp.TNat), sp.mutez(1)), 'TEZ_TRANSFERED')
    sp.for asset in self.data.marketNameToAddress.values():
      sp.if self.data.markets[asset].updateLevel < sp.level:
        pricePair = sp.local("pricePair", sp.view("getPrice", self.data.markets[asset].name + '-USD', self.data.oracleAddress, sp.TPair(sp.TTimestamp, sp.TNat)).open_some(message = 'invalid oracle view call'))
        sp.if self.data.markets[asset].priceTimestamp != sp.timestamp(0):
          sp.verify((sp.now - sp.fst(pricePair.value)) <= self.data.maxPriceTimeDifference, 'STALE_ASSET_PRICE')
        sp.set_type(sp.snd(pricePair.value) * self.data.markets[asset].priceExp, sp.TNat)
        self.data.markets[asset].price = sp.record(mantissa = sp.snd(pricePair.value) * self.data.markets[asset].priceExp)
        self.data.markets[asset].priceTimestamp = sp.fst(pricePair.value)
        self.data.markets[asset].updateLevel = sp.level

sp.add_compilation_target("test", Contract())
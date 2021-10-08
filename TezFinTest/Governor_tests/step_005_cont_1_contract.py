import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(account_assets = sp.TBigMap(sp.TAddress, sp.TSet(sp.TAddress)), account_liquidity = sp.TBigMap(sp.TAddress, sp.TRecord(liquidity = sp.TInt, updateLevel = sp.TNat, valid = sp.TBool).layout(("liquidity", ("updateLevel", "valid")))), activeOperations = sp.TSet(sp.TNat), administrator = sp.TAddress, calculation = sp.TRecord(account = sp.TOption(sp.TAddress), borrowAmount = sp.TNat, cTokenModify = sp.TOption(sp.TAddress), redeemTokens = sp.TNat, sumBorrowPlusEffects = sp.TNat, sumCollateral = sp.TNat).layout((("account", ("borrowAmount", "cTokenModify")), ("redeemTokens", ("sumBorrowPlusEffects", "sumCollateral")))), closeFactorMantissa = sp.TNat, expScale = sp.TNat, halfExpScale = sp.TNat, liquidationIncentiveMantissa = sp.TNat, liquidityPeriodRelevance = sp.TNat, marketNameToAddress = sp.TMap(sp.TString, sp.TAddress), markets = sp.TMap(sp.TAddress, sp.TRecord(accountMembership = sp.TBigMap(sp.TAddress, sp.TBool), borrowCap = sp.TNat, borrowPaused = sp.TBool, collateralFactor = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), isListed = sp.TBool, mintPaused = sp.TBool, name = sp.TString, price = sp.TRecord(mantissa = sp.TNat).layout("mantissa"), updateLevel = sp.TNat).layout(((("accountMembership", "borrowCap"), ("borrowPaused", "collateralFactor")), (("isListed", "mintPaused"), ("name", ("price", "updateLevel")))))), oracleAddress = sp.TAddress, pendingAdministrator = sp.TOption(sp.TAddress), pricePeriodRelevance = sp.TNat, transferPaused = sp.TBool).layout((((("account_assets", "account_liquidity"), ("activeOperations", "administrator")), (("calculation", "closeFactorMantissa"), ("expScale", "halfExpScale"))), ((("liquidationIncentiveMantissa", "liquidityPeriodRelevance"), ("marketNameToAddress", "markets")), (("oracleAddress", "pendingAdministrator"), ("pricePeriodRelevance", "transferPaused"))))))
    self.init(account_assets = {},
              account_liquidity = {},
              activeOperations = sp.set([]),
              administrator = sp.address('KT1TezoooozzSmartPyzzSTATiCzzzwwBFA1'),
              calculation = sp.record(account = sp.none, borrowAmount = 0, cTokenModify = sp.none, redeemTokens = 0, sumBorrowPlusEffects = 0, sumCollateral = 0),
              closeFactorMantissa = 0,
              expScale = 1000000000000000000,
              halfExpScale = 500000000000000000,
              liquidationIncentiveMantissa = 0,
              liquidityPeriodRelevance = 5,
              marketNameToAddress = {},
              markets = {},
              oracleAddress = sp.address('KT10'),
              pendingAdministrator = sp.none,
              pricePeriodRelevance = 5,
              transferPaused = True)

  @sp.entry_point
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.pendingAdministrator.open_some(message = 'CMPT_NOT_SET_PENDING_ADMIN'), 'CMPT_NOT_PENDING_ADMIN')
    self.data.administrator = self.data.pendingAdministrator.open_some()
    self.data.pendingAdministrator = sp.none

  @sp.entry_point
  def borrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))))
    sp.verify(~ self.data.markets[params.cToken].borrowPaused, 'CMPT_BORROW_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if ~ ((self.data.markets[params.cToken].accountMembership.contains(params.borrower)) & self.data.markets[params.cToken].accountMembership[params.borrower]):
      sp.verify(sp.sender == params.cToken, 'CMPT_INVALID_BORROW_SENDER')
      sp.verify((self.data.markets.contains(sp.sender)) & self.data.markets[sp.sender].isListed, 'CMPT_MARKET_NOT_LISTED')
      sp.verify(~ ((self.data.markets[sp.sender].accountMembership.contains(params.borrower)) & self.data.markets[sp.sender].accountMembership[params.borrower]), 'CMPT_MARKET_JOINED')
      self.data.markets[sp.sender].accountMembership[params.borrower] = True
      sp.if self.data.account_assets.contains(params.borrower):
        self.data.account_assets[params.borrower].add(sp.sender)
      sp.else:
        self.data.account_assets[params.borrower] = sp.set([sp.sender])
    sp.verify(self.data.account_liquidity.contains(params.borrower), 'CMPT_LIQUIDITY_ABSENT')
    sp.verify(self.data.account_liquidity[params.borrower].valid, 'CMPT_LIQUIDITY_INVALID')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.account_liquidity[params.borrower].updateLevel, sp.TNat)
    compute_Comptroller_625 = sp.local("compute_Comptroller_625", sp.as_nat(sp.level - self.data.account_liquidity[params.borrower].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_Comptroller_625.value < self.data.liquidityPeriodRelevance, 'CMPT_LIQUIDITY_OLD')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.markets[params.cToken].updateLevel, sp.TNat)
    compute_Comptroller_270 = sp.local("compute_Comptroller_270", sp.as_nat(sp.level - self.data.markets[params.cToken].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_Comptroller_270.value < self.data.pricePeriodRelevance, 'CMPT_UPDATE_PRICE')
    sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
    sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.borrowAmount, sp.TNat)
    sp.set_type(self.data.markets[params.cToken].price.mantissa * params.borrowAmount, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.borrowAmount), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    compute_Comptroller_174 = sp.local("compute_Comptroller_174", self.data.account_liquidity[params.borrower].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.borrowAmount) // self.data.expScale))
    sp.verify(compute_Comptroller_174.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.borrower):
      self.data.account_liquidity[params.borrower].valid = False

  @sp.entry_point
  def calculateAccountAssetLiquidity(self, params):
    sp.set_type(params, sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))
    sp.verify(self.data.activeOperations.contains(3), 'OP_NOT_ACTIVE')
    sp.set_type(params.exchangeRateMantissa, sp.TNat)
    compute_Comptroller_376 = sp.local("compute_Comptroller_376", sp.record(mantissa = params.exchangeRateMantissa))
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.markets[sp.sender].updateLevel, sp.TNat)
    compute_Comptroller_270 = sp.local("compute_Comptroller_270", sp.as_nat(sp.level - self.data.markets[sp.sender].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_Comptroller_270.value < self.data.pricePeriodRelevance, 'CMPT_UPDATE_PRICE')
    sp.verify(self.data.markets[sp.sender].price.mantissa > 0, 'CMPT_INVALID_PRICE')
    sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.markets[sp.sender].collateralFactor, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type((self.data.markets[sp.sender].price.mantissa * self.data.markets[sp.sender].collateralFactor.mantissa) // self.data.expScale, sp.TNat)
    sp.set_type(sp.record(mantissa = (self.data.markets[sp.sender].price.mantissa * self.data.markets[sp.sender].collateralFactor.mantissa) // self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_Comptroller_376.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type((((self.data.markets[sp.sender].price.mantissa * self.data.markets[sp.sender].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_376.value.mantissa) // self.data.expScale, sp.TNat)
    compute_Comptroller_379 = sp.local("compute_Comptroller_379", sp.record(mantissa = (((self.data.markets[sp.sender].price.mantissa * self.data.markets[sp.sender].collateralFactor.mantissa) // self.data.expScale) * compute_Comptroller_376.value.mantissa) // self.data.expScale))
    sp.set_type(compute_Comptroller_379.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_Comptroller_379.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.cTokenBalance, sp.TNat)
    sp.set_type(compute_Comptroller_379.value.mantissa * params.cTokenBalance, sp.TNat)
    sp.set_type(sp.record(mantissa = compute_Comptroller_379.value.mantissa * params.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.calculation.sumCollateral += (compute_Comptroller_379.value.mantissa * params.cTokenBalance) // self.data.expScale
    sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.borrowBalance, sp.TNat)
    sp.set_type(self.data.markets[sp.sender].price.mantissa * params.borrowBalance, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.markets[sp.sender].price.mantissa * params.borrowBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.calculation.sumBorrowPlusEffects += (self.data.markets[sp.sender].price.mantissa * params.borrowBalance) // self.data.expScale
    sp.if sp.some(sp.sender) == self.data.calculation.cTokenModify:
      sp.set_type(compute_Comptroller_379.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(compute_Comptroller_379.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.calculation.redeemTokens, sp.TNat)
      sp.set_type(compute_Comptroller_379.value.mantissa * self.data.calculation.redeemTokens, sp.TNat)
      sp.set_type(sp.record(mantissa = compute_Comptroller_379.value.mantissa * self.data.calculation.redeemTokens), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      self.data.calculation.sumCollateral += (compute_Comptroller_379.value.mantissa * self.data.calculation.redeemTokens) // self.data.expScale
      sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.calculation.borrowAmount, sp.TNat)
      sp.set_type(self.data.markets[sp.sender].price.mantissa * self.data.calculation.borrowAmount, sp.TNat)
      sp.set_type(sp.record(mantissa = self.data.markets[sp.sender].price.mantissa * self.data.calculation.borrowAmount), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      self.data.calculation.sumBorrowPlusEffects += (self.data.markets[sp.sender].price.mantissa * self.data.calculation.borrowAmount) // self.data.expScale

  @sp.entry_point
  def disableMarket(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify((self.data.markets.contains(params)) & self.data.markets[params].isListed, 'CMPT_MARKET_NOT_LISTED')
    self.data.markets[params].isListed = False

  @sp.entry_point
  def enterMarkets(self, params):
    sp.set_type(params, sp.TList(sp.TAddress))
    sp.for token in params:
      sp.verify((self.data.markets.contains(token)) & self.data.markets[token].isListed, 'CMPT_MARKET_NOT_LISTED')
      sp.verify(~ ((self.data.markets[token].accountMembership.contains(sp.sender)) & self.data.markets[token].accountMembership[sp.sender]), 'CMPT_MARKET_JOINED')
      self.data.markets[token].accountMembership[sp.sender] = True
      sp.if self.data.account_assets.contains(sp.sender):
        self.data.account_assets[sp.sender].add(token)
      sp.else:
        self.data.account_assets[sp.sender] = sp.set([token])
    sp.if self.data.account_liquidity.contains(sp.sender):
      self.data.account_liquidity[sp.sender].valid = False

  @sp.entry_point
  def exitMarket(self, params):
    sp.set_type(params, sp.TAddress)
    self.data.activeOperations.add(1)
    sp.transfer((sp.sender, sp.self_entry_point('setAccountSnapAndExitMarket')), sp.tez(0), sp.contract(sp.TPair(sp.TAddress, sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))), params, entry_point='getAccountSnapshot').open_some())

  @sp.entry_point
  def getHypoAccountLiquidity(self, params):
    sp.set_type(params, sp.TRecord(callback = sp.TContract(sp.TInt), data = sp.TRecord(account = sp.TAddress, borrowAmount = sp.TNat, cTokenModify = sp.TAddress, redeemTokens = sp.TNat).layout(("account", ("cTokenModify", ("redeemTokens", "borrowAmount"))))).layout(("callback", "data")))
    self.data.activeOperations.add(3)
    self.data.calculation = sp.record(account = sp.some(params.data.account), borrowAmount = params.data.borrowAmount, cTokenModify = sp.some(params.data.cTokenModify), redeemTokens = params.data.redeemTokens, sumBorrowPlusEffects = 0, sumCollateral = 0)
    sp.if self.data.account_assets.contains(params.data.account):
      sp.for asset in self.data.account_assets[params.data.account].elements():
        sp.transfer((params.data.account, sp.self_entry_point('calculateAccountAssetLiquidity')), sp.tez(0), sp.contract(sp.TPair(sp.TAddress, sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))), asset, entry_point='getAccountSnapshot').open_some())
    sp.transfer((sp.unit, params.callback), sp.tez(0), sp.self_entry_point('returnHypoAccountLiquidity'))

  @sp.entry_point
  def hardResetOp(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.activeOperations = sp.set([])

  @sp.entry_point
  def mintAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))))
    sp.verify(~ self.data.markets[params.cToken].mintPaused, 'CMPT_MINT_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if self.data.account_liquidity.contains(params.minter):
      self.data.account_liquidity[params.minter].valid = False

  @sp.entry_point
  def redeemAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.markets[params.cToken].accountMembership.contains(params.redeemer)) & self.data.markets[params.cToken].accountMembership[params.redeemer]:
      sp.verify(self.data.account_liquidity.contains(params.redeemer), 'CMPT_LIQUIDITY_ABSENT')
      sp.verify(self.data.account_liquidity[params.redeemer].valid, 'CMPT_LIQUIDITY_INVALID')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.account_liquidity[params.redeemer].updateLevel, sp.TNat)
      compute_Comptroller_625 = sp.local("compute_Comptroller_625", sp.as_nat(sp.level - self.data.account_liquidity[params.redeemer].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_625.value < self.data.liquidityPeriodRelevance, 'CMPT_LIQUIDITY_OLD')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.markets[params.cToken].updateLevel, sp.TNat)
      compute_Comptroller_270 = sp.local("compute_Comptroller_270", sp.as_nat(sp.level - self.data.markets[params.cToken].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_270.value < self.data.pricePeriodRelevance, 'CMPT_UPDATE_PRICE')
      sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
      sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(params.redeemAmount, sp.TNat)
      sp.set_type(self.data.markets[params.cToken].price.mantissa * params.redeemAmount, sp.TNat)
      sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.redeemAmount), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      compute_Comptroller_174 = sp.local("compute_Comptroller_174", self.data.account_liquidity[params.redeemer].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.redeemAmount) // self.data.expScale))
      sp.verify(compute_Comptroller_174.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.redeemer):
      self.data.account_liquidity[params.redeemer].valid = False

  @sp.entry_point
  def repayBorrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if self.data.account_liquidity.contains(params.borrower):
      self.data.account_liquidity[params.borrower].valid = False
    sp.if self.data.account_liquidity.contains(params.payer):
      self.data.account_liquidity[params.payer].valid = False

  @sp.entry_point
  def returnHypoAccountLiquidity(self, params):
    sp.set_type(sp.fst(params), sp.TUnit)
    sp.verify(self.data.activeOperations.contains(3), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(3)
    compute_Comptroller_331 = sp.local("compute_Comptroller_331", self.data.calculation.sumCollateral - self.data.calculation.sumBorrowPlusEffects)
    self.data.calculation = sp.record(account = sp.none, borrowAmount = 0, cTokenModify = sp.none, redeemTokens = 0, sumBorrowPlusEffects = 0, sumCollateral = 0)
    __s1 = sp.local("__s1", compute_Comptroller_331.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TInt))
    sp.transfer(__s1.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def setAccountLiquidity(self, params):
    sp.set_type(params, sp.TUnit)
    self.data.account_liquidity[self.data.calculation.account.open_some()] = sp.record(liquidity = self.data.calculation.sumCollateral - self.data.calculation.sumBorrowPlusEffects, updateLevel = sp.level, valid = True)
    self.data.calculation = sp.record(account = sp.none, borrowAmount = 0, cTokenModify = sp.none, redeemTokens = 0, sumBorrowPlusEffects = 0, sumCollateral = 0)

  @sp.entry_point
  def setAccountSnapAndExitMarket(self, params):
    sp.set_type(params, sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))
    sp.verify(params.borrowBalance == 0, 'CMPT_BORROW_IN_MARKET')
    sp.verify((self.data.markets.contains(sp.sender)) & self.data.markets[sp.sender].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.markets[sp.sender].accountMembership.contains(params.account)) & self.data.markets[sp.sender].accountMembership[params.account]:
      sp.verify(self.data.account_liquidity.contains(params.account), 'CMPT_LIQUIDITY_ABSENT')
      sp.verify(self.data.account_liquidity[params.account].valid, 'CMPT_LIQUIDITY_INVALID')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.account_liquidity[params.account].updateLevel, sp.TNat)
      compute_Comptroller_625 = sp.local("compute_Comptroller_625", sp.as_nat(sp.level - self.data.account_liquidity[params.account].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_625.value < self.data.liquidityPeriodRelevance, 'CMPT_LIQUIDITY_OLD')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.markets[sp.sender].updateLevel, sp.TNat)
      compute_Comptroller_270 = sp.local("compute_Comptroller_270", sp.as_nat(sp.level - self.data.markets[sp.sender].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_270.value < self.data.pricePeriodRelevance, 'CMPT_UPDATE_PRICE')
      sp.verify(self.data.markets[sp.sender].price.mantissa > 0, 'CMPT_INVALID_PRICE')
      sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.markets[sp.sender].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(params.cTokenBalance, sp.TNat)
      sp.set_type(self.data.markets[sp.sender].price.mantissa * params.cTokenBalance, sp.TNat)
      sp.set_type(sp.record(mantissa = self.data.markets[sp.sender].price.mantissa * params.cTokenBalance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      compute_Comptroller_174 = sp.local("compute_Comptroller_174", self.data.account_liquidity[params.account].liquidity - sp.to_int((self.data.markets[sp.sender].price.mantissa * params.cTokenBalance) // self.data.expScale))
      sp.verify(compute_Comptroller_174.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.account):
      self.data.account_liquidity[params.account].valid = False
    sp.if (self.data.markets[sp.sender].accountMembership.contains(params.account)) & self.data.markets[sp.sender].accountMembership[params.account]:
      del self.data.markets[sp.sender].accountMembership[params.account]
      self.data.account_assets[params.account].remove(sp.sender)
    sp.if self.data.account_liquidity.contains(params.account):
      self.data.account_liquidity[params.account].valid = False

  @sp.entry_point
  def setAssetPrice(self, params):
    sp.set_type(params, sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)))
    sp.verify(self.data.activeOperations.contains(2), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(2)
    compute_Comptroller_263 = sp.local("compute_Comptroller_263", sp.fst(params))
    compute_Comptroller_264 = sp.local("compute_Comptroller_264", sp.snd(params))
    sp.set_type(sp.snd(compute_Comptroller_264.value), sp.TNat)
    sp.set_type(sp.snd(compute_Comptroller_264.value) * self.data.expScale, sp.TNat)
    self.data.markets[self.data.marketNameToAddress[compute_Comptroller_263.value]].price = sp.record(mantissa = sp.snd(compute_Comptroller_264.value) * self.data.expScale)
    self.data.markets[self.data.marketNameToAddress[compute_Comptroller_263.value]].updateLevel = sp.level

  @sp.entry_point
  def setBorrowPaused(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.markets[params.cToken].borrowPaused = params.state

  @sp.entry_point
  def setCloseFactor(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.closeFactorMantissa = params

  @sp.entry_point
  def setCollateralFactor(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat).layout(("cToken", "newCollateralFactor")))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    self.data.markets[params.cToken].collateralFactor.mantissa = params.newCollateralFactor

  @sp.entry_point
  def setLiquidationIncentive(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.liquidationIncentiveMantissa = params

  @sp.entry_point
  def setLiquidityPeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.set_type(params, sp.TNat)
    self.data.liquidityPeriodRelevance = params

  @sp.entry_point
  def setMarketBorrowCap(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newBorrowCap = sp.TNat).layout(("cToken", "newBorrowCap")))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify(self.data.markets.contains(params.cToken), 'CMPT_MARKET_NOT_EXISTS')
    self.data.markets[params.cToken].borrowCap = params.newBorrowCap

  @sp.entry_point
  def setMintPaused(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")))
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.markets[params.cToken].mintPaused = params.state

  @sp.entry_point
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.some(params)

  @sp.entry_point
  def setPriceOracle(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.oracleAddress = params

  @sp.entry_point
  def setPricePeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.set_type(params, sp.TNat)
    self.data.pricePeriodRelevance = params

  @sp.entry_point
  def setTransferPaused(self, params):
    sp.set_type(params, sp.TBool)
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    self.data.transferPaused = params

  @sp.entry_point
  def supportMarket(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, name = sp.TString).layout(("cToken", "name")))
    sp.verify(sp.sender == self.data.administrator, 'CMPT_NOT_ADMIN')
    sp.verify(~ ((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed), 'CMPT_MARKET_ALREADY_LISTED')
    sp.set_type(900000000000000000, sp.TNat)
    sp.set_type(0, sp.TNat)
    self.data.markets[params.cToken] = sp.record(accountMembership = sp.set_type_expr({}, sp.TBigMap(sp.TAddress, sp.TBool)), borrowCap = 0, borrowPaused = True, collateralFactor = sp.record(mantissa = 900000000000000000), isListed = True, mintPaused = True, name = params.name, price = sp.record(mantissa = 0), updateLevel = 0)
    self.data.marketNameToAddress[params.name] = params.cToken

  @sp.entry_point
  def sweepFA12(self, params):
    sp.set_type(params, sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", "tokenAddress")))
    sp.transfer(sp.record(from_ = sp.self_address, to_ = self.data.administrator, value = params.amount), sp.tez(0), sp.contract(sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))), params.tokenAddress, entry_point='transfer').open_some())

  @sp.entry_point
  def sweepFA2(self, params):
    sp.set_type(params, sp.TRecord(amount = sp.TNat, id = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", ("id", "tokenAddress"))))
    sp.transfer(sp.list([sp.record(from_ = sp.self_address, txs = sp.list([sp.record(to_ = self.data.administrator, token_id = params.id, amount = params.amount)]))]), sp.tez(0), sp.contract(sp.TList(sp.TRecord(from_ = sp.TAddress, txs = sp.TList(sp.TRecord(amount = sp.TNat, to_ = sp.TAddress, token_id = sp.TNat).layout(("to_", ("token_id", "amount"))))).layout(("from_", "txs"))), params.tokenAddress, entry_point='transfer').open_some())

  @sp.entry_point
  def sweepMutez(self, params):
    sp.set_type(params, sp.TBool)
    sp.if params:
      sp.send(self.data.administrator, sp.balance)
    sp.else:
      sp.send(self.data.administrator, sp.balance)

  @sp.entry_point
  def transferAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))))
    sp.verify(~ self.data.transferPaused, 'CMPT_TRANSFER_PAUSED')
    sp.verify((self.data.markets.contains(params.cToken)) & self.data.markets[params.cToken].isListed, 'CMPT_MARKET_NOT_LISTED')
    sp.if (self.data.markets[params.cToken].accountMembership.contains(params.src)) & self.data.markets[params.cToken].accountMembership[params.src]:
      sp.verify(self.data.account_liquidity.contains(params.src), 'CMPT_LIQUIDITY_ABSENT')
      sp.verify(self.data.account_liquidity[params.src].valid, 'CMPT_LIQUIDITY_INVALID')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.account_liquidity[params.src].updateLevel, sp.TNat)
      compute_Comptroller_625 = sp.local("compute_Comptroller_625", sp.as_nat(sp.level - self.data.account_liquidity[params.src].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_625.value < self.data.liquidityPeriodRelevance, 'CMPT_LIQUIDITY_OLD')
      sp.set_type(sp.level, sp.TNat)
      sp.set_type(self.data.markets[params.cToken].updateLevel, sp.TNat)
      compute_Comptroller_270 = sp.local("compute_Comptroller_270", sp.as_nat(sp.level - self.data.markets[params.cToken].updateLevel, message = 'SUBTRACTION_UNDERFLOW'))
      sp.verify(compute_Comptroller_270.value < self.data.pricePeriodRelevance, 'CMPT_UPDATE_PRICE')
      sp.verify(self.data.markets[params.cToken].price.mantissa > 0, 'CMPT_INVALID_PRICE')
      sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.markets[params.cToken].price, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(params.transferTokens, sp.TNat)
      sp.set_type(self.data.markets[params.cToken].price.mantissa * params.transferTokens, sp.TNat)
      sp.set_type(sp.record(mantissa = self.data.markets[params.cToken].price.mantissa * params.transferTokens), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      compute_Comptroller_174 = sp.local("compute_Comptroller_174", self.data.account_liquidity[params.src].liquidity - sp.to_int((self.data.markets[params.cToken].price.mantissa * params.transferTokens) // self.data.expScale))
      sp.verify(compute_Comptroller_174.value >= 0, 'CMPT_REDEEMER_SHORTFALL')
    sp.if self.data.account_liquidity.contains(params.src):
      self.data.account_liquidity[params.src].valid = False

  @sp.entry_point
  def updateAccountLiquidity(self, params):
    sp.set_type(params, sp.TAddress)
    self.data.activeOperations.add(3)
    self.data.calculation = sp.record(account = sp.some(params), borrowAmount = 0, cTokenModify = sp.none, redeemTokens = 0, sumBorrowPlusEffects = 0, sumCollateral = 0)
    sp.if self.data.account_assets.contains(params):
      sp.for asset in self.data.account_assets[params].elements():
        sp.transfer((params, sp.self_entry_point('calculateAccountAssetLiquidity')), sp.tez(0), sp.contract(sp.TPair(sp.TAddress, sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))), asset, entry_point='getAccountSnapshot').open_some())
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('setAccountLiquidity'))

  @sp.entry_point
  def updateAssetPrice(self, params):
    sp.set_type(params, sp.TAddress)
    sp.if self.data.markets[params].updateLevel < sp.level:
      self.data.activeOperations.add(2)
      sp.transfer((self.data.markets[params].name, sp.self_entry_point('setAssetPrice')), sp.tez(0), sp.contract(sp.TPair(sp.TString, sp.TContract(sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)))), self.data.oracleAddress, entry_point='get').open_some())
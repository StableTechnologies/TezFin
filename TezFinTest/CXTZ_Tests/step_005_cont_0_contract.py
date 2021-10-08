import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(borrow_allowed = sp.TBool, mint_allowed = sp.TBool, redeem_allowed = sp.TBool, repay_borrow_allowed = sp.TBool).layout((("borrow_allowed", "mint_allowed"), ("redeem_allowed", "repay_borrow_allowed"))))
    self.init(borrow_allowed = True,
              mint_allowed = True,
              redeem_allowed = True,
              repay_borrow_allowed = True)

  @sp.entry_point
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entry_point
  def borrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))))
    sp.verify(self.data.borrow_allowed)

  @sp.entry_point
  def disableMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def enterMarkets(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def exitMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def getHypoAccountLiquidity(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def mintAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))))
    sp.verify(self.data.mint_allowed)

  @sp.entry_point
  def redeemAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))))
    sp.verify(self.data.redeem_allowed)

  @sp.entry_point
  def repayBorrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))))
    sp.verify(self.data.repay_borrow_allowed)

  @sp.entry_point
  def setBorrowAllowed(self, params):
    self.data.borrow_allowed = params

  @sp.entry_point
  def setBorrowPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setCloseFactor(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setCollateralFactor(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setLiquidationIncentive(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setLiquidityPeriodRelevance(self, params):
    sp.set_type(params, sp.TNat)

  @sp.entry_point
  def setMarketBorrowCap(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setMintAllowed(self, params):
    self.data.mint_allowed = params

  @sp.entry_point
  def setMintPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entry_point
  def setPriceOracle(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def setPricePeriodRelevance(self, params):
    sp.set_type(params, sp.TNat)

  @sp.entry_point
  def setRedeemAllowed(self, params):
    self.data.redeem_allowed = params

  @sp.entry_point
  def setRepayBorrowAllowed(self, params):
    self.data.repay_borrow_allowed = params

  @sp.entry_point
  def setTransferPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def supportMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def transferAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))))

  @sp.entry_point
  def updateAccountLiquidity(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entry_point
  def updateAssetPrice(self, params):
    sp.set_type(params, sp.TAddress)
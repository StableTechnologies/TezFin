import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(borrow_allowed = sp.TBool, mint_allowed = sp.TBool, redeem_allowed = sp.TBool, repay_borrow_allowed = sp.TBool).layout((("borrow_allowed", "mint_allowed"), ("redeem_allowed", "repay_borrow_allowed"))))
    self.init(borrow_allowed = True,
              mint_allowed = True,
              redeem_allowed = True,
              repay_borrow_allowed = True)

  @sp.entrypoint
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entrypoint
  def borrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))))
    sp.verify(self.data.borrow_allowed)

  @sp.entrypoint
  def disableMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def enterMarkets(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def exitMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def getHypoAccountLiquidity(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def mintAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))))
    sp.verify(self.data.mint_allowed)

  @sp.entrypoint
  def redeemAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))))
    sp.verify(self.data.redeem_allowed)

  @sp.entrypoint
  def removeFromLoans(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entrypoint
  def repayBorrowAllowed(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))))
    sp.verify(self.data.repay_borrow_allowed)

  @sp.entrypoint
  def setBorrowAllowed(self, params):
    self.data.borrow_allowed = params

  @sp.entrypoint
  def setBorrowPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setCloseFactor(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setCollateralFactor(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setLiquidationIncentive(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setLiquidityPeriodRelevance(self, params):
    sp.set_type(params, sp.TNat)

  @sp.entrypoint
  def setMintAllowed(self, params):
    self.data.mint_allowed = params

  @sp.entrypoint
  def setMintPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entrypoint
  def setPriceOracleAndTimeDiff(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def setPricePeriodRelevance(self, params):
    sp.set_type(params, sp.TNat)

  @sp.entrypoint
  def setRedeemAllowed(self, params):
    self.data.redeem_allowed = params

  @sp.entrypoint
  def setRepayBorrowAllowed(self, params):
    self.data.repay_borrow_allowed = params

  @sp.entrypoint
  def setTransferPaused(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def supportMarket(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def transferAllowed(self, params):
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))))

  @sp.entrypoint
  def updateAccountLiquidity(self, params):
    sp.set_type(params, sp.TAddress)

  @sp.entrypoint
  def updateAssetPrice(self, params):
    sp.set_type(params, sp.TAddress)

sp.add_compilation_target("test", Contract())
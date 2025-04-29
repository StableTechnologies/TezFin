import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(administrator = sp.TAddress, pendingAdministrator = sp.TOption(sp.TAddress)).layout(("administrator", "pendingAdministrator")))
    self.init(administrator = sp.address('tz1RESHvJAfmQCXCAD3ubNmVtac788pnN1oL'),
              pendingAdministrator = sp.none)

  @sp.entrypoint
  def acceptContractGovernance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TAddress)
    sp.send(params, sp.tez(0))

  @sp.entrypoint
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.pendingAdministrator.open_some(message = 'GOV_NOT_SET_PENDING_ADMIN'), 'GOV_NOT_PENDING_ADMIN')
    self.data.administrator = self.data.pendingAdministrator.open_some()
    self.data.pendingAdministrator = sp.none

  @sp.entrypoint
  def disableMarket(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, comptroller = sp.TAddress).layout(("cToken", "comptroller")))
    sp.transfer(params.cToken, sp.tez(0), sp.contract(sp.TAddress, params.comptroller, entrypoint='disableMarket').open_some())

  @sp.entrypoint
  def receive(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entrypoint
  def reduceReserves(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(amount = sp.TNat, cToken = sp.TAddress).layout(("amount", "cToken")))
    sp.transfer(params.amount, sp.tez(0), sp.contract(sp.TNat, params.cToken, entrypoint='reduceReserves').open_some())

  @sp.entrypoint
  def setAccrualIntPeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(blockNumber = sp.TNat, cToken = sp.TAddress).layout(("blockNumber", "cToken")))
    sp.transfer(params.blockNumber, sp.tez(0), sp.contract(sp.TNat, params.cToken, entrypoint='setAccrualIntPeriodRelevance').open_some())

  @sp.entrypoint
  def setBorrowPaused(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, tokenState = sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state"))).layout(("comptroller", "tokenState")))
    sp.transfer(params.tokenState, sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")), params.comptroller, entrypoint='setBorrowPaused').open_some())

  @sp.entrypoint
  def setCloseFactor(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(closeFactor = sp.TNat, comptroller = sp.TAddress).layout(("closeFactor", "comptroller")))
    sp.transfer(params.closeFactor, sp.tez(0), sp.contract(sp.TNat, params.comptroller, entrypoint='setCloseFactor').open_some())

  @sp.entrypoint
  def setCollateralFactor(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(collateralFactor = sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat).layout(("cToken", "newCollateralFactor")), comptroller = sp.TAddress).layout(("collateralFactor", "comptroller")))
    sp.transfer(params.collateralFactor, sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat).layout(("cToken", "newCollateralFactor")), params.comptroller, entrypoint='setCollateralFactor').open_some())

  @sp.entrypoint
  def setComptroller(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, comptroller = sp.TAddress).layout(("cToken", "comptroller")))
    sp.transfer(params.comptroller, sp.tez(0), sp.contract(sp.TAddress, params.cToken, entrypoint='setComptroller').open_some())

  @sp.entrypoint
  def setContractGovernance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(contractAddress = sp.TAddress, governance = sp.TAddress).layout(("contractAddress", "governance")))
    sp.transfer(params.governance, sp.tez(0), sp.contract(sp.TAddress, params.contractAddress, entrypoint='setPendingGovernance').open_some())

  @sp.entrypoint
  def setInterestRateModel(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, interestRateModel = sp.TAddress).layout(("cToken", "interestRateModel")))
    sp.transfer(params.interestRateModel, sp.tez(0), sp.contract(sp.TAddress, params.cToken, entrypoint='setInterestRateModel').open_some())

  @sp.entrypoint
  def setLiquidationIncentive(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, liquidationIncentive = sp.TNat).layout(("comptroller", "liquidationIncentive")))
    sp.transfer(params.liquidationIncentive, sp.tez(0), sp.contract(sp.TNat, params.comptroller, entrypoint='setLiquidationIncentive').open_some())

  @sp.entrypoint
  def setLiquidityPeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(blockNumber = sp.TNat, comptroller = sp.TAddress).layout(("blockNumber", "comptroller")))
    sp.transfer(params.blockNumber, sp.tez(0), sp.contract(sp.TNat, params.comptroller, entrypoint='setLiquidityPeriodRelevance').open_some())

  @sp.entrypoint
  def setMintPaused(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, tokenState = sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state"))).layout(("comptroller", "tokenState")))
    sp.transfer(params.tokenState, sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, state = sp.TBool).layout(("cToken", "state")), params.comptroller, entrypoint='setMintPaused').open_some())

  @sp.entrypoint
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    self.data.pendingAdministrator = sp.some(params)

  @sp.entrypoint
  def setPriceOracleAndTimeDiff(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, priceOracle = sp.TAddress, timeDiff = sp.TInt).layout(("comptroller", ("priceOracle", "timeDiff"))))
    sp.transfer(sp.record(priceOracle = params.priceOracle, timeDiff = params.timeDiff), sp.tez(0), sp.contract(sp.TRecord(priceOracle = sp.TAddress, timeDiff = sp.TInt).layout(("priceOracle", "timeDiff")), params.comptroller, entrypoint='setPriceOracleAndTimeDiff').open_some())

  @sp.entrypoint
  def setPricePeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(blockNumber = sp.TNat, comptroller = sp.TAddress).layout(("blockNumber", "comptroller")))
    sp.transfer(params.blockNumber, sp.tez(0), sp.contract(sp.TNat, params.comptroller, entrypoint='setPricePeriodRelevance').open_some())

  @sp.entrypoint
  def setReserveFactor(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newReserveFactor = sp.TNat).layout(("cToken", "newReserveFactor")))
    sp.transfer(params.newReserveFactor, sp.tez(0), sp.contract(sp.TNat, params.cToken, entrypoint='setReserveFactor').open_some())

  @sp.entrypoint
  def setTransferPaused(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, state = sp.TBool).layout(("comptroller", "state")))
    sp.transfer(params.state, sp.tez(0), sp.contract(sp.TBool, params.comptroller, entrypoint='setTransferPaused').open_some())

  @sp.entrypoint
  def supportMarket(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(comptroller = sp.TAddress, market = sp.TRecord(cToken = sp.TAddress, name = sp.TString, priceExp = sp.TNat).layout(("cToken", ("name", "priceExp")))).layout(("comptroller", "market")))
    sp.transfer(params.market, sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, name = sp.TString, priceExp = sp.TNat).layout(("cToken", ("name", "priceExp"))), params.comptroller, entrypoint='supportMarket').open_some())

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
  def updateMetadata(self, params):
    sp.verify(sp.sender == self.data.administrator, 'GOV_NOT_ADMIN')
    sp.set_type(params, sp.TRecord(cToken = sp.TAddress, key = sp.TString, value = sp.TBytes).layout(("cToken", ("key", "value"))))
    sp.transfer(sp.record(key = params.key, value = params.value), sp.tez(0), sp.contract(sp.TRecord(key = sp.TString, value = sp.TBytes).layout(("key", "value")), params.cToken, entrypoint='updateMetadata').open_some())

sp.add_compilation_target("test", Contract())
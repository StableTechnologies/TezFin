import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(accrualBlockNumber = sp.TNat, activeOperations = sp.TSet(sp.TNat), administrator = sp.TAddress, borrowIndex = sp.TNat, borrowRateMaxMantissa = sp.TNat, borrowRatePerBlock = sp.TNat, borrows = sp.TBigMap(sp.TAddress, sp.TRecord(interestIndex = sp.TNat, principal = sp.TNat).layout(("interestIndex", "principal"))), comptroller = sp.TAddress, expScale = sp.TNat, halfExpScale = sp.TNat, initialExchangeRateMantissa = sp.TNat, interestRateModel = sp.TAddress, ledger = sp.TBigMap(sp.TAddress, sp.TRecord(approvals = sp.TMap(sp.TAddress, sp.TNat), balance = sp.TNat).layout(("approvals", "balance"))), metadata = sp.TBigMap(sp.TString, sp.TBytes), pendingAdministrator = sp.TOption(sp.TAddress), protocolSeizeShareMantissa = sp.TNat, reserveFactorMantissa = sp.TNat, reserveFactorMaxMantissa = sp.TNat, supplyRatePerBlock = sp.TNat, token_metadata = sp.TBigMap(sp.TNat, sp.TRecord(token_id = sp.TNat, token_info = sp.TMap(sp.TString, sp.TBytes)).layout(("token_id", "token_info"))), totalBorrows = sp.TNat, totalReserves = sp.TNat, totalSupply = sp.TNat).layout((((("accrualBlockNumber", "activeOperations"), ("administrator", ("borrowIndex", "borrowRateMaxMantissa"))), (("borrowRatePerBlock", ("borrows", "comptroller")), ("expScale", ("halfExpScale", "initialExchangeRateMantissa")))), ((("interestRateModel", ("ledger", "metadata")), ("pendingAdministrator", ("protocolSeizeShareMantissa", "reserveFactorMantissa"))), (("reserveFactorMaxMantissa", ("supplyRatePerBlock", "token_metadata")), ("totalBorrows", ("totalReserves", "totalSupply")))))))
    self.init(accrualBlockNumber = 0,
              activeOperations = sp.set([]),
              administrator = sp.address('KT1NF6DKX5giazRTzPtEuNX1npkVcaoQkvK2'),
              borrowIndex = 1000000000000000000,
              borrowRateMaxMantissa = 800000000000,
              borrowRatePerBlock = 0,
              borrows = {},
              comptroller = sp.address('KT1DiWBT6RBC97iWrvLHRzKL7AWQKorBiuRG'),
              expScale = 1000000000000000000,
              halfExpScale = 500000000000000000,
              initialExchangeRateMantissa = 1000000000000000000,
              interestRateModel = sp.address('KT1B7zvU7EXmPBHazHhtajHaw5swFFxWCEfd'),
              ledger = {},
              metadata = {'' : sp.bytes('0x74657a6f732d73746f726167653a64617461'), 'data' : sp.bytes('0x7b226e616d65223a202254657a46696e20496e7465726573742d42656172696e672058545a222c20226465736372697074696f6e223a2022496e7465726573742d62656172696e6720746f6b656e20666f722054657a202858545a2920737570706c69656420746f207468652054657a46696e206c656e64696e672070726f746f636f6c2e222c202276657273696f6e223a2022332e30222c2022617574686f7273223a205b2254657a6f732046696e616e63652050726f746f636f6c225d2c2022686f6d6570616765223a202268747470733a2f2f74657a6f732e66696e616e6365222c2022696e7465726661636573223a205b22545a49502d303037222c2022545a49502d303136225d7d')},
              pendingAdministrator = sp.none,
              protocolSeizeShareMantissa = 100000000000000,
              reserveFactorMantissa = 50000000000000000,
              reserveFactorMaxMantissa = 1000000000000000000,
              supplyRatePerBlock = 0,
              token_metadata = {0 : sp.record(token_id = 0, token_info = {'decimals' : sp.bytes('0x36'), 'name' : sp.bytes('0x54657a46696e20496e7465726573742d42656172696e672058545a'), 'symbol' : sp.bytes('0xea9cb058545a')})},
              totalBorrows = 0,
              totalReserves = 0,
              totalSupply = 0)

  @sp.entrypoint
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.pendingAdministrator.open_some(message = 'CT_NOT_SET_PENDING_ADMIN'), 'CT_NOT_PENDING_ADMIN')
    self.data.administrator = self.data.pendingAdministrator.open_some()
    self.data.pendingAdministrator = sp.none

  @sp.entrypoint
  def accrueInterest(self, params):
    sp.set_type(params, sp.TUnit)
    sp.if sp.level != self.data.accrualBlockNumber:
      sp.if self.data.accrualBlockNumber == 0:
        self.data.accrualBlockNumber = sp.level
      sp.else:
        self.data.activeOperations.add(8)
        sp.transfer(sp.self_entrypoint('doAccrueInterest'), sp.tez(0), sp.contract(sp.TContract(sp.TNat), sp.self_address, entrypoint='accrueInterestInternal').open_some())

  @sp.entrypoint
  def accrueInterestInternal(self, params):
    sp.set_type(params, sp.TContract(sp.TNat))
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.transfer(sp.record(borrows = self.data.totalBorrows, cash = sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), cb = params, reserves = self.data.totalReserves), sp.tez(0), sp.contract(sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), self.data.interestRateModel, entrypoint='getBorrowRate').open_some())

  @sp.entrypoint
  def addReserves(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(11)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entrypoint('accrueInterest'))
    sp.transfer(sp.record(addAmount = params, originalSender = sp.sender), sp.amount, sp.self_entrypoint('addReservesInternal'))

  @sp.entrypoint
  def addReservesInternal(self, params):
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(11), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(11)
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    sp.if sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) > params.addAmount:
      sp.send(params.originalSender, sp.mul(sp.set_type_expr(sp.as_nat(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) - params.addAmount), sp.TNat), sp.mutez(1)))
    sp.else:
      sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == params.addAmount, 'CT_INVALID_MUTEZ')
    self.data.totalReserves += params.addAmount

  @sp.entrypoint
  def approve(self, params):
    sp.set_type(params, sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")))
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(sp.sender)):
      self.data.ledger[sp.sender] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(sp.sender)):
      self.data.borrows[sp.sender] = sp.record(interestIndex = 0, principal = 0)
    sp.verify((self.data.ledger[sp.sender].approvals.contains(params.spender)) | (sp.len(self.data.ledger[sp.sender].approvals) < 1000), ('FA1.2_MaxApprovalsReached', sp.unit))
    sp.verify((self.data.ledger[sp.sender].approvals.get(params.spender, default_value = 0) == 0) | (params.value == 0), ('UnsafeAllowanceChange', self.data.ledger[sp.sender].approvals.get(params.spender, default_value = 0)))
    sp.if params.value == 0:
      del self.data.ledger[sp.sender].approvals[params.spender]
    sp.else:
      self.data.ledger[sp.sender].approvals[params.spender] = params.value

  @sp.entrypoint
  def borrow(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(sp.sender)):
      self.data.ledger[sp.sender] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(sp.sender)):
      self.data.borrows[sp.sender] = sp.record(interestIndex = 0, principal = 0)
    sp.transfer(sp.record(borrowAmount = params, borrower = sp.sender, cToken = sp.self_address), sp.tez(0), sp.contract(sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))), self.data.comptroller, entrypoint='borrowAllowed').open_some())
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= params, 'CT_INSUFFICIENT_CASH')
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    sp.if False:
      sp.transfer(sp.unit, sp.mul(sp.set_type_expr(params, sp.TNat), sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entrypoint='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(sp.sender, sp.mul(sp.set_type_expr(params, sp.TNat), sp.mutez(1)))
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if self.data.borrows.contains(sp.sender):
      borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[sp.sender])
      sp.if borrowSnapshot.value.principal > 0:
        borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    self.data.borrows[sp.sender].principal = borrowBalance.value + params
    self.data.borrows[sp.sender].interestIndex = self.data.borrowIndex
    self.data.totalBorrows += params

  @sp.entrypoint
  def borrowBalanceStored(self, params):
    __s1 = sp.bind_block("__s1"):
    with __s1:
      sp.set_type(sp.fst(params), sp.TAddress)
      borrowBalance = sp.local("borrowBalance", 0)
      sp.if self.data.borrows.contains(sp.fst(params)):
        borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[sp.fst(params)])
        sp.if borrowSnapshot.value.principal > 0:
          borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
      sp.result((borrowBalance.value, self.data.accrualBlockNumber))
    sp.set_type(sp.snd(params), sp.TContract(sp.TPair(sp.TNat, sp.TNat)))
    sp.transfer(__s1.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def doAccrueInterest(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.interestRateModel, 'CT_SENDER_NOT_IRM')
    sp.verify(self.data.activeOperations.contains(8), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(8)
    sp.verify(params <= self.data.borrowRateMaxMantissa, 'CT_INVALID_BORROW_RATE')
    sp.set_type(params, sp.TNat)
    sp.set_type(sp.record(mantissa = params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.as_nat(sp.level - self.data.accrualBlockNumber), sp.TNat)
    sp.set_type(params * sp.as_nat(sp.level - self.data.accrualBlockNumber), sp.TNat)
    compute_CToken_771 = sp.local("compute_CToken_771", sp.record(mantissa = params * sp.as_nat(sp.level - self.data.accrualBlockNumber)))
    sp.set_type(compute_CToken_771.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_771.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(compute_CToken_771.value.mantissa * self.data.totalBorrows, sp.TNat)
    sp.set_type(sp.record(mantissa = compute_CToken_771.value.mantissa * self.data.totalBorrows), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    compute_CToken_773 = sp.local("compute_CToken_773", (compute_CToken_771.value.mantissa * self.data.totalBorrows) // self.data.expScale)
    self.data.totalBorrows = compute_CToken_773.value + self.data.totalBorrows
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_773.value, sp.TNat)
    sp.set_type(self.data.totalReserves, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_773.value, sp.TNat)
    sp.set_type(self.data.reserveFactorMantissa * compute_CToken_773.value, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa * compute_CToken_773.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.totalReserves = ((self.data.reserveFactorMantissa * compute_CToken_773.value) // self.data.expScale) + self.data.totalReserves
    sp.set_type(compute_CToken_771.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(compute_CToken_771.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_771.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(compute_CToken_771.value.mantissa * self.data.borrowIndex, sp.TNat)
    sp.set_type(sp.record(mantissa = compute_CToken_771.value.mantissa * self.data.borrowIndex), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.borrowIndex = ((compute_CToken_771.value.mantissa * self.data.borrowIndex) // self.data.expScale) + self.data.borrowIndex
    self.data.accrualBlockNumber = sp.level

  @sp.entrypoint
  def exchangeRateStored(self, params):
    __s2 = sp.bind_block("__s2"):
    with __s2:
      sp.set_type(sp.fst(params), sp.TUnit)
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      sp.result((excRate.value, self.data.accrualBlockNumber))
    sp.set_type(sp.snd(params), sp.TContract(sp.TPair(sp.TNat, sp.TNat)))
    sp.transfer(__s2.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getAccountSnapshot(self, params):
    __s3 = sp.bind_block("__s3"):
    with __s3:
      compute_CToken_571 = sp.local("compute_CToken_571", sp.record(account = sp.fst(params), borrowBalance = 0, cTokenBalance = 0, exchangeRateMantissa = 0))
      sp.if self.data.ledger.contains(sp.fst(params)):
        sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
        compute_CToken_571.value.cTokenBalance = self.data.ledger[sp.fst(params)].balance
        borrowBalance = sp.local("borrowBalance", 0)
        sp.if self.data.borrows.contains(sp.fst(params)):
          borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[sp.fst(params)])
          sp.if borrowSnapshot.value.principal > 0:
            borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
        compute_CToken_571.value.borrowBalance = borrowBalance.value
        excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
        sp.if self.data.totalSupply > 0:
          sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
          sp.set_type(0, sp.TNat)
          sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
          sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
          sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
          sp.set_type(self.data.totalSupply, sp.TNat)
          sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
          sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
          excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
        compute_CToken_571.value.exchangeRateMantissa = excRate.value
      sp.result(compute_CToken_571.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa")))))
    sp.transfer(__s3.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getAllowance(self, params):
    __s4 = sp.bind_block("__s4"):
    with __s4:
      result = sp.local("result", 0)
      sp.if self.data.ledger.contains(sp.fst(params).owner):
        sp.if self.data.ledger[sp.fst(params).owner].approvals.contains(sp.fst(params).spender):
          result.value = self.data.ledger[sp.fst(params).owner].approvals[sp.fst(params).spender]
      sp.result(result.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s4.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getBalance(self, params):
    __s5 = sp.bind_block("__s5"):
    with __s5:
      result = sp.local("result", 0)
      sp.if self.data.ledger.contains(sp.fst(params)):
        result.value = self.data.ledger[sp.fst(params)].balance
      sp.result(result.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s5.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getBalanceOfUnderlying(self, params):
    __s6 = sp.bind_block("__s6"):
    with __s6:
      sp.set_type(sp.fst(params), sp.TAddress)
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      sp.set_type(excRate.value, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.ledger[sp.fst(params)].balance, sp.TNat)
      sp.set_type(excRate.value * self.data.ledger[sp.fst(params)].balance, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value * self.data.ledger[sp.fst(params)].balance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.result(((excRate.value * self.data.ledger[sp.fst(params)].balance) // self.data.expScale, self.data.accrualBlockNumber))
    sp.set_type(sp.snd(params), sp.TContract(sp.TPair(sp.TNat, sp.TNat)))
    sp.transfer(__s6.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getCash(self, params):
    __s7 = sp.bind_block("__s7"):
    with __s7:
      sp.set_type(sp.fst(params), sp.TUnit)
      sp.result((sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), self.data.accrualBlockNumber))
    sp.set_type(sp.snd(params), sp.TContract(sp.TPair(sp.TNat, sp.TNat)))
    sp.transfer(__s7.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def getTotalSupply(self, params):
    __s8 = sp.bind_block("__s8"):
    with __s8:
      sp.set_type(sp.fst(params), sp.TUnit)
      sp.result(self.data.totalSupply)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s8.value, sp.tez(0), sp.snd(params))

  @sp.entrypoint
  def hardResetOp(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.activeOperations = sp.set([])

  @sp.entrypoint
  def liquidateBorrow(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, cTokenCollateral = sp.TAddress, repayAmount = sp.TNat).layout(("borrower", ("cTokenCollateral", "repayAmount"))))
    sp.transfer(sp.record(borrower = params.borrower, cTokenBorrowed = sp.self_address, cTokenCollateral = params.cTokenCollateral, liquidator = sp.sender, repayAmount = params.repayAmount), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, cTokenBorrowed = sp.TAddress, cTokenCollateral = sp.TAddress, liquidator = sp.TAddress, repayAmount = sp.TNat).layout((("borrower", "cTokenBorrowed"), ("cTokenCollateral", ("liquidator", "repayAmount")))), self.data.comptroller, entrypoint='liquidateBorrowAllowed').open_some())
    sp.verify(params.borrower != sp.sender, 'CT_LIQUIDATE_LIQUIDATOR_IS_BORROWER')
    sp.verify(params.repayAmount > 0, 'CT_LIQUIDATE_CLOSE_AMOUNT_IS_INVALID')
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if self.data.borrows.contains(params.borrower):
      borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[params.borrower])
      sp.if borrowSnapshot.value.principal > 0:
        borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    repayAmount = sp.local("repayAmount", sp.min(borrowBalance.value, params.repayAmount))
    actualRepayAmount = sp.local("actualRepayAmount", sp.min(repayAmount.value, self.data.totalBorrows))
    sp.if sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) > repayAmount.value:
      sp.send(sp.sender, sp.mul(sp.set_type_expr(sp.as_nat(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) - repayAmount.value), sp.TNat), sp.mutez(1)))
    sp.else:
      sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == repayAmount.value, 'CT_INVALID_MUTEZ')
    sp.set_type(borrowBalance.value, sp.TNat)
    sp.set_type(repayAmount.value, sp.TNat)
    self.data.borrows[params.borrower].principal = sp.as_nat(borrowBalance.value - repayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    self.data.borrows[params.borrower].interestIndex = self.data.borrowIndex
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(actualRepayAmount.value, sp.TNat)
    self.data.totalBorrows = sp.as_nat(self.data.totalBorrows - actualRepayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    sp.if self.data.borrows[params.borrower].principal == 0:
      sp.transfer(params.borrower, sp.tez(0), sp.contract(sp.TAddress, self.data.comptroller, entrypoint='removeFromLoans').open_some())
    sp.verify(sp.view("balanceOf", params.borrower, params.cTokenCollateral, sp.TNat).open_some(message = 'INVALID BALANCE OF VIEW') >= sp.fst(sp.view("liquidateCalculateSeizeTokens", sp.record(actualRepayAmount = params.repayAmount, cTokenBorrowed = sp.self_address, cTokenCollateral = params.cTokenCollateral), self.data.comptroller, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID LIQUIDATE CALC SEIZE TOKEN VIEW')), 'LIQUIDATE_SEIZE_TOO_MUCH')
    sp.transfer(sp.record(borrower = params.borrower, liquidator = sp.sender, seizeTokens = sp.fst(sp.view("liquidateCalculateSeizeTokens", sp.record(actualRepayAmount = params.repayAmount, cTokenBorrowed = sp.self_address, cTokenCollateral = params.cTokenCollateral), self.data.comptroller, sp.TPair(sp.TNat, sp.TNat)).open_some(message = 'INVALID LIQUIDATE CALC SEIZE TOKEN VIEW'))), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, liquidator = sp.TAddress, seizeTokens = sp.TNat).layout(("borrower", ("liquidator", "seizeTokens"))), params.cTokenCollateral, entrypoint='seize').open_some())

  @sp.entrypoint
  def mint(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(sp.sender)):
      self.data.ledger[sp.sender] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(sp.sender)):
      self.data.borrows[sp.sender] = sp.record(interestIndex = 0, principal = 0)
    sp.transfer(sp.record(cToken = sp.self_address, mintAmount = params, minter = sp.sender), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))), self.data.comptroller, entrypoint='mintAllowed').open_some())
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    sp.if sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) > params:
      sp.send(sp.sender, sp.mul(sp.set_type_expr(sp.as_nat(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) - params), sp.TNat), sp.mutez(1)))
    sp.else:
      sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == params, 'CT_INVALID_MUTEZ')
    excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
    sp.if self.data.totalSupply > 0:
      sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
      sp.set_type(params, sp.TNat)
      sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - params, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
      sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - params, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
      sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - params, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.totalSupply, sp.TNat)
      sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
      sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - params, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
      excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - params, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
    amount = sp.local("amount", 0)
    sp.if True:
      sp.set_type(excRate.value, sp.TNat)
      sp.set_type(params, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.verify(excRate.value > 0, 'DIVISION_BY_ZERO')
      compute_CToken_975 = sp.local("compute_CToken_975", (params * self.data.expScale) // excRate.value)
      amount.value = compute_CToken_975.value
    sp.else:
      sp.set_type(excRate.value, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(params, sp.TNat)
      sp.set_type(excRate.value * params, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      compute_CToken_978 = sp.local("compute_CToken_978", (excRate.value * params) // self.data.expScale)
      amount.value = compute_CToken_978.value
    sp.verify(amount.value > 0, 'CT_MINT_AMOUNT_IS_INVALID')
    self.data.totalSupply += amount.value
    self.data.ledger[sp.sender].balance += amount.value

  @sp.entrypoint
  def redeem(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.transfer(sp.record(cToken = sp.self_address, redeemAmount = params, redeemer = sp.sender), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))), self.data.comptroller, entrypoint='redeemAllowed').open_some())
    redeem_amount = sp.local("redeem_amount", 0)
    sp.if False:
      redeem_amount.value = params
    sp.else:
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      amount = sp.local("amount", 0)
      sp.if False:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.verify(excRate.value > 0, 'DIVISION_BY_ZERO')
        compute_CToken_975 = sp.local("compute_CToken_975", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_975.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_978 = sp.local("compute_CToken_978", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_978.value
      redeem_amount.value = amount.value
    redeem_tokens = sp.local("redeem_tokens", 0)
    sp.if False:
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      amount = sp.local("amount", 0)
      sp.if True:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.verify(excRate.value > 0, 'DIVISION_BY_ZERO')
        compute_Exponential_277 = sp.local("compute_Exponential_277", params * self.data.expScale)
        compute_Exponential_280 = sp.local("compute_Exponential_280", compute_Exponential_277.value // excRate.value)
        sp.if (compute_Exponential_277.value % excRate.value) > 0:
          pass
        compute_CToken_986 = sp.local("compute_CToken_986", compute_Exponential_280.value + 1)
        amount.value = compute_CToken_986.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_989 = sp.local("compute_CToken_989", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_989.value
      redeem_tokens.value = amount.value
    sp.else:
      redeem_tokens.value = params
    sp.if (redeem_amount.value > 0) & (redeem_tokens.value > 0):
      sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= redeem_amount.value, 'CT_INSUFFICIENT_CASH')
      sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
      self.data.totalSupply = sp.as_nat(self.data.totalSupply - redeem_tokens.value, message = 'Insufficient supply')
      self.data.ledger[sp.sender].balance = sp.as_nat(self.data.ledger[sp.sender].balance - redeem_tokens.value, message = 'Insufficient balance')
      sp.if False:
        sp.transfer(sp.unit, sp.mul(sp.set_type_expr(redeem_amount.value, sp.TNat), sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entrypoint='receive').open_some(message = 'bad contract destination'))
      sp.else:
        sp.send(sp.sender, sp.mul(sp.set_type_expr(redeem_amount.value, sp.TNat), sp.mutez(1)))

  @sp.entrypoint
  def redeemUnderlying(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.transfer(sp.record(cToken = sp.self_address, redeemAmount = params, redeemer = sp.sender), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))), self.data.comptroller, entrypoint='redeemAllowed').open_some())
    redeem_amount = sp.local("redeem_amount", 0)
    sp.if True:
      redeem_amount.value = params
    sp.else:
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      amount = sp.local("amount", 0)
      sp.if False:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.verify(excRate.value > 0, 'DIVISION_BY_ZERO')
        compute_CToken_975 = sp.local("compute_CToken_975", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_975.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_978 = sp.local("compute_CToken_978", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_978.value
      redeem_amount.value = amount.value
    redeem_tokens = sp.local("redeem_tokens", 0)
    sp.if True:
      excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
      sp.if self.data.totalSupply > 0:
        sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
        sp.set_type(0, sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
        sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
        sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(self.data.totalSupply, sp.TNat)
        sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
        sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
        excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
      amount = sp.local("amount", 0)
      sp.if True:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.verify(excRate.value > 0, 'DIVISION_BY_ZERO')
        compute_Exponential_277 = sp.local("compute_Exponential_277", params * self.data.expScale)
        compute_Exponential_280 = sp.local("compute_Exponential_280", compute_Exponential_277.value // excRate.value)
        sp.if (compute_Exponential_277.value % excRate.value) > 0:
          pass
        compute_CToken_986 = sp.local("compute_CToken_986", compute_Exponential_280.value + 1)
        amount.value = compute_CToken_986.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_989 = sp.local("compute_CToken_989", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_989.value
      redeem_tokens.value = amount.value
    sp.else:
      redeem_tokens.value = params
    sp.if (redeem_amount.value > 0) & (redeem_tokens.value > 0):
      sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= redeem_amount.value, 'CT_INSUFFICIENT_CASH')
      sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
      self.data.totalSupply = sp.as_nat(self.data.totalSupply - redeem_tokens.value, message = 'Insufficient supply')
      self.data.ledger[sp.sender].balance = sp.as_nat(self.data.ledger[sp.sender].balance - redeem_tokens.value, message = 'Insufficient balance')
      sp.if False:
        sp.transfer(sp.unit, sp.mul(sp.set_type_expr(redeem_amount.value, sp.TNat), sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entrypoint='receive').open_some(message = 'bad contract destination'))
      sp.else:
        sp.send(sp.sender, sp.mul(sp.set_type_expr(redeem_amount.value, sp.TNat), sp.mutez(1)))

  @sp.entrypoint
  def reduceReserves(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(12)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entrypoint('accrueInterest'))
    sp.transfer(params, sp.amount, sp.self_entrypoint('reduceReservesInternal'))

  @sp.entrypoint
  def reduceReservesInternal(self, params):
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(12), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(12)
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= params, 'CT_INSUFFICIENT_CASH')
    sp.verify(params <= self.data.totalReserves, 'CT_REDUCE_AMOUNT')
    sp.set_type(self.data.totalReserves, sp.TNat)
    sp.set_type(params, sp.TNat)
    self.data.totalReserves = sp.as_nat(self.data.totalReserves - params, message = 'SUBTRACTION_UNDERFLOW')
    sp.if True:
      sp.transfer(sp.unit, sp.mul(sp.set_type_expr(params, sp.TNat), sp.mutez(1)), sp.contract(sp.TUnit, self.data.administrator, entrypoint='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(self.data.administrator, sp.mul(sp.set_type_expr(params, sp.TNat), sp.mutez(1)))

  @sp.entrypoint
  def removePendingGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.none

  @sp.entrypoint
  def repayBorrow(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(sp.sender)):
      self.data.ledger[sp.sender] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(sp.sender)):
      self.data.borrows[sp.sender] = sp.record(interestIndex = 0, principal = 0)
    sp.transfer(sp.record(borrower = sp.sender, cToken = sp.self_address, payer = sp.sender, repayAmount = params), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))), self.data.comptroller, entrypoint='repayBorrowAllowed').open_some())
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if self.data.borrows.contains(sp.sender):
      borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[sp.sender])
      sp.if borrowSnapshot.value.principal > 0:
        borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    repayAmount = sp.local("repayAmount", sp.min(borrowBalance.value, params))
    actualRepayAmount = sp.local("actualRepayAmount", sp.min(repayAmount.value, self.data.totalBorrows))
    sp.if sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) > repayAmount.value:
      sp.send(sp.sender, sp.mul(sp.set_type_expr(sp.as_nat(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) - repayAmount.value), sp.TNat), sp.mutez(1)))
    sp.else:
      sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == repayAmount.value, 'CT_INVALID_MUTEZ')
    sp.set_type(borrowBalance.value, sp.TNat)
    sp.set_type(repayAmount.value, sp.TNat)
    self.data.borrows[sp.sender].principal = sp.as_nat(borrowBalance.value - repayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    self.data.borrows[sp.sender].interestIndex = self.data.borrowIndex
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(actualRepayAmount.value, sp.TNat)
    self.data.totalBorrows = sp.as_nat(self.data.totalBorrows - actualRepayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    sp.if self.data.borrows[sp.sender].principal == 0:
      sp.transfer(sp.sender, sp.tez(0), sp.contract(sp.TAddress, self.data.comptroller, entrypoint='removeFromLoans').open_some())

  @sp.entrypoint
  def repayBorrowBehalf(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, repayAmount = sp.TNat).layout(("borrower", "repayAmount")))
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(sp.sender)):
      self.data.ledger[sp.sender] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(sp.sender)):
      self.data.borrows[sp.sender] = sp.record(interestIndex = 0, principal = 0)
    sp.transfer(sp.record(borrower = params.borrower, cToken = sp.self_address, payer = sp.sender, repayAmount = params.repayAmount), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))), self.data.comptroller, entrypoint='repayBorrowAllowed').open_some())
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if self.data.borrows.contains(params.borrower):
      borrowSnapshot = sp.local("borrowSnapshot", self.data.borrows[params.borrower])
      sp.if borrowSnapshot.value.principal > 0:
        borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    repayAmount = sp.local("repayAmount", sp.min(borrowBalance.value, params.repayAmount))
    actualRepayAmount = sp.local("actualRepayAmount", sp.min(repayAmount.value, self.data.totalBorrows))
    sp.if sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) > repayAmount.value:
      sp.send(sp.sender, sp.mul(sp.set_type_expr(sp.as_nat(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) - repayAmount.value), sp.TNat), sp.mutez(1)))
    sp.else:
      sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == repayAmount.value, 'CT_INVALID_MUTEZ')
    sp.set_type(borrowBalance.value, sp.TNat)
    sp.set_type(repayAmount.value, sp.TNat)
    self.data.borrows[params.borrower].principal = sp.as_nat(borrowBalance.value - repayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    self.data.borrows[params.borrower].interestIndex = self.data.borrowIndex
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(actualRepayAmount.value, sp.TNat)
    self.data.totalBorrows = sp.as_nat(self.data.totalBorrows - actualRepayAmount.value, message = 'SUBTRACTION_UNDERFLOW')
    sp.if self.data.borrows[params.borrower].principal == 0:
      sp.transfer(params.borrower, sp.tez(0), sp.contract(sp.TAddress, self.data.comptroller, entrypoint='removeFromLoans').open_some())

  @sp.entrypoint
  def seize(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, liquidator = sp.TAddress, seizeTokens = sp.TNat).layout(("borrower", ("liquidator", "seizeTokens"))))
    sp.if ~ (self.data.ledger.contains(params.liquidator)):
      self.data.ledger[params.liquidator] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(params.liquidator)):
      self.data.borrows[params.liquidator] = sp.record(interestIndex = 0, principal = 0)
    sp.verify(sp.view("seizeAllowed", sp.record(cTokenBorrowed = sp.sender, cTokenCollateral = sp.self_address), self.data.comptroller, sp.TBool).open_some(message = 'INVALID SEIZE ALLOWED VIEW'), 'CT_LIQUIDATE_SEIZE_COMPTROLLER_REJECTION')
    sp.verify(params.borrower != params.liquidator, 'CT_LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER')
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    sp.set_type(self.data.ledger[params.borrower].balance, sp.TNat)
    sp.set_type(params.seizeTokens, sp.TNat)
    sp.set_type(self.data.protocolSeizeShareMantissa, sp.TNat)
    sp.set_type(params.seizeTokens, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.protocolSeizeShareMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    protocolSeizeTokens = sp.local("protocolSeizeTokens", (params.seizeTokens * self.data.protocolSeizeShareMantissa) // self.data.expScale)
    sp.set_type(params.seizeTokens, sp.TNat)
    sp.set_type(protocolSeizeTokens.value, sp.TNat)
    excRate = sp.local("excRate", self.data.initialExchangeRateMantissa)
    sp.if self.data.totalSupply > 0:
      sp.set_type(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), sp.TNat)
      sp.set_type(0, sp.TNat)
      sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves), sp.TNat)
      sp.set_type(sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale, sp.TNat)
      sp.set_type(sp.record(mantissa = sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(self.data.totalSupply, sp.TNat)
      sp.verify(self.data.totalSupply > 0, 'DIVISION_BY_ZERO')
      sp.set_type((sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply, sp.TNat)
      excRate.value = (sp.as_nat((sp.as_nat(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) - 0, message = 'SUBTRACTION_UNDERFLOW') + self.data.totalBorrows) - self.data.totalReserves) * self.data.expScale) // self.data.totalSupply
    sp.set_type(excRate.value, sp.TNat)
    sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(protocolSeizeTokens.value, sp.TNat)
    sp.set_type(excRate.value * protocolSeizeTokens.value, sp.TNat)
    sp.set_type(sp.record(mantissa = excRate.value * protocolSeizeTokens.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.totalReserves, sp.TNat)
    sp.set_type((excRate.value * protocolSeizeTokens.value) // self.data.expScale, sp.TNat)
    sp.set_type(self.data.totalSupply, sp.TNat)
    sp.set_type(protocolSeizeTokens.value, sp.TNat)
    sp.set_type(self.data.ledger[params.liquidator].balance, sp.TNat)
    sp.set_type(sp.as_nat(params.seizeTokens - protocolSeizeTokens.value, message = 'SUBTRACTION_UNDERFLOW'), sp.TNat)
    self.data.totalReserves += (excRate.value * protocolSeizeTokens.value) // self.data.expScale
    self.data.totalSupply = sp.as_nat(self.data.totalSupply - protocolSeizeTokens.value, message = 'SUBTRACTION_UNDERFLOW')
    self.data.ledger[params.borrower].balance = sp.as_nat(self.data.ledger[params.borrower].balance - params.seizeTokens, message = 'SUBTRACTION_UNDERFLOW')
    self.data.ledger[params.liquidator].balance += sp.as_nat(params.seizeTokens - protocolSeizeTokens.value, message = 'SUBTRACTION_UNDERFLOW')

  @sp.entrypoint
  def setComptroller(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.comptroller = params

  @sp.entrypoint
  def setInterestRateModel(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(9)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entrypoint('accrueInterest'))
    sp.transfer(params, sp.tez(0), sp.self_entrypoint('setInterestRateModelInternal'))

  @sp.entrypoint
  def setInterestRateModelInternal(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(9), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(9)
    self.data.interestRateModel = params

  @sp.entrypoint
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.some(params)

  @sp.entrypoint
  def setReserveFactor(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(10)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entrypoint('accrueInterest'))
    sp.transfer(params, sp.tez(0), sp.self_entrypoint('setReserveFactorInternal'))

  @sp.entrypoint
  def setReserveFactorInternal(self, params):
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(10), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(10)
    sp.verify(sp.level == self.data.accrualBlockNumber, 'CT_INTEREST_OLD')
    sp.verify(params <= self.data.reserveFactorMaxMantissa, 'CT_INVALID_RESERVE_FACTOR')
    self.data.reserveFactorMantissa = params

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
    sp.verify(False, 'CT_SWEEP_XTZ')
    sp.if params:
      sp.send(self.data.administrator, sp.balance)
    sp.else:
      sp.send(self.data.administrator, sp.balance)

  @sp.entrypoint
  def transfer(self, params):
    sp.set_type(params, sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
    sp.verify((params.from_ == sp.sender) | (self.data.ledger[params.from_].approvals[sp.sender] >= params.value), ('NotEnoughAllowance', (params.value, self.data.ledger[params.from_].approvals[sp.sender])))
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.ledger.contains(params.to_)):
      self.data.ledger[params.to_] = sp.record(approvals = {}, balance = 0)
    sp.if ~ (self.data.borrows.contains(params.to_)):
      self.data.borrows[params.to_] = sp.record(interestIndex = 0, principal = 0)
    sp.transfer(sp.record(cToken = sp.self_address, dst = params.to_, src = params.from_, transferTokens = params.value), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))), self.data.comptroller, entrypoint='transferAllowed').open_some())
    sp.set_type(sp.record(from_ = params.from_, sender = sp.sender, to_ = params.to_, value = params.value), sp.TRecord(from_ = sp.TAddress, sender = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout((("from_", "sender"), ("to_", "value"))))
    sp.verify(self.data.ledger[params.from_].balance >= params.value, ('NotEnoughBalance', (params.value, self.data.ledger[params.from_].balance)))
    self.data.ledger[params.from_].balance = sp.as_nat(self.data.ledger[params.from_].balance - params.value)
    self.data.ledger[params.to_].balance += params.value
    sp.if params.from_ != sp.sender:
      self.data.ledger[params.from_].approvals[sp.sender] = sp.as_nat(self.data.ledger[params.from_].approvals[sp.sender] - params.value)
      sp.if self.data.ledger[params.from_].approvals[sp.sender] == 0:
        del self.data.ledger[params.from_].approvals[sp.sender]

  @sp.entrypoint
  def updateMetadata(self, params):
    sp.set_type(params, sp.TRecord(key = sp.TString, value = sp.TBytes).layout(("key", "value")))
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.metadata[params.key] = params.value

  @sp.entrypoint
  def updateProtocolSeizeShare(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.protocolSeizeShareMantissa = params

sp.add_compilation_target("test", Contract())
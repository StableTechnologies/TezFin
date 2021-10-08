import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(accrualBlockNumber = sp.TNat, accrualIntPeriodRelevance = sp.TNat, activeOperations = sp.TSet(sp.TNat), administrator = sp.TAddress, balances = sp.TBigMap(sp.TAddress, sp.TRecord(accountBorrows = sp.TRecord(interestIndex = sp.TNat, principal = sp.TNat).layout(("interestIndex", "principal")), approvals = sp.TMap(sp.TAddress, sp.TNat), balance = sp.TNat).layout(("accountBorrows", ("approvals", "balance")))), borrowIndex = sp.TNat, borrowRateMaxMantissa = sp.TNat, borrowRatePerBlock = sp.TNat, comptroller = sp.TAddress, expScale = sp.TNat, halfExpScale = sp.TNat, initialExchangeRateMantissa = sp.TNat, interestRateModel = sp.TAddress, isAccrualInterestValid = sp.TBool, pendingAdministrator = sp.TOption(sp.TAddress), reserveFactorMantissa = sp.TNat, reserveFactorMaxMantissa = sp.TNat, supplyRatePerBlock = sp.TNat, totalBorrows = sp.TNat, totalReserves = sp.TNat, totalSupply = sp.TNat).layout((((("accrualBlockNumber", "accrualIntPeriodRelevance"), ("activeOperations", ("administrator", "balances"))), (("borrowIndex", "borrowRateMaxMantissa"), ("borrowRatePerBlock", ("comptroller", "expScale")))), ((("halfExpScale", "initialExchangeRateMantissa"), ("interestRateModel", ("isAccrualInterestValid", "pendingAdministrator"))), (("reserveFactorMantissa", ("reserveFactorMaxMantissa", "supplyRatePerBlock")), ("totalBorrows", ("totalReserves", "totalSupply")))))))
    self.init(accrualBlockNumber = 0,
              accrualIntPeriodRelevance = 5,
              activeOperations = sp.set([]),
              administrator = sp.address('tz1UyQDepgtUBnWjyzzonqeDwaiWoQzRKSP5'),
              balances = {},
              borrowIndex = 1000000000000000000,
              borrowRateMaxMantissa = 5000000000000,
              borrowRatePerBlock = 0,
              comptroller = sp.address('KT1TezoooozzSmartPyzzSTATiCzzzwwBFA1'),
              expScale = 1000000000000000000,
              halfExpScale = 500000000000000000,
              initialExchangeRateMantissa = 1000000000000000000,
              interestRateModel = sp.address('KT1Tezooo1zzSmartPyzzSTATiCzzzyfC8eF'),
              isAccrualInterestValid = False,
              pendingAdministrator = sp.none,
              reserveFactorMantissa = 0,
              reserveFactorMaxMantissa = 1000000000000000000,
              supplyRatePerBlock = 0,
              totalBorrows = 0,
              totalReserves = 0,
              totalSupply = 0)

  @sp.entry_point
  def acceptGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.pendingAdministrator.open_some(message = 'CT_NOT_SET_PENDING_ADMIN'), 'CT_NOT_PENDING_ADMIN')
    self.data.administrator = self.data.pendingAdministrator.open_some()
    self.data.pendingAdministrator = sp.none

  @sp.entry_point
  def accrueInterest(self, params):
    sp.set_type(params, sp.TUnit)
    sp.if self.data.accrualBlockNumber == 0:
      self.data.accrualBlockNumber = sp.level
    sp.if sp.level != self.data.accrualBlockNumber:
      self.data.activeOperations.add(8)
      sp.transfer(sp.record(borrows = self.data.totalBorrows, cash = sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), cb = sp.self_entry_point('doAccrueInterest'), reserves = self.data.totalReserves), sp.tez(0), sp.contract(sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), self.data.interestRateModel, entry_point='getBorrowRate').open_some())
    self.data.isAccrualInterestValid = True

  @sp.entry_point
  def addReserves(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(11)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('accrueInterest'))
    sp.transfer(sp.record(addAmount = params, originalSender = sp.sender), sp.amount, sp.self_entry_point('addReservesInternal'))

  @sp.entry_point
  def addReservesInternal(self, params):
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(11), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(11)
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == params.addAmount, 'CT_INVALID_MUTEZ')
    self.data.totalReserves += params.addAmount
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def approve(self, params):
    sp.set_type(params, sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")))
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.verify((self.data.balances[sp.sender].approvals.get(params.spender, default_value = 0) == 0) | (params.value == 0), 'CT_UNSAFE_ALLOWANCE_CHANGE')
    self.data.balances[sp.sender].approvals[params.spender] = params.value

  @sp.entry_point
  def borrow(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.balances.contains(sp.sender)):
      self.data.balances[sp.sender] = sp.record(accountBorrows = sp.record(interestIndex = 0, principal = 0), approvals = {}, balance = 0)
    sp.transfer(sp.record(cToken = sp.self_address, borrower = sp.sender, borrowAmount = params), sp.tez(0), sp.contract(sp.TRecord(borrowAmount = sp.TNat, borrower = sp.TAddress, cToken = sp.TAddress).layout(("cToken", ("borrower", "borrowAmount"))), self.data.comptroller, entry_point='borrowAllowed').open_some())
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= params, 'CT_INSUFFICIENT_CASH')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    sp.if False:
      sp.transfer(sp.unit, sp.mul(params, sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entry_point='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(sp.sender, sp.mul(params, sp.mutez(1)))
    borrowSnapshot = sp.local("borrowSnapshot", self.data.balances[sp.sender].accountBorrows)
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if borrowSnapshot.value.principal > 0:
      borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    self.data.balances[sp.sender].accountBorrows.principal = borrowBalance.value + params
    self.data.balances[sp.sender].accountBorrows.interestIndex = self.data.borrowIndex
    self.data.totalBorrows += borrowBalance.value + params
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def borrowBalanceStored(self, params):
    sp.set_type(sp.fst(params), sp.TAddress)
    borrowSnapshot = sp.local("borrowSnapshot", self.data.balances[sp.fst(params)].accountBorrows)
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if borrowSnapshot.value.principal > 0:
      borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    __s1 = sp.local("__s1", borrowBalance.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s1.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
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
    compute_CToken_545 = sp.local("compute_CToken_545", sp.record(mantissa = params * sp.as_nat(sp.level - self.data.accrualBlockNumber)))
    sp.set_type(compute_CToken_545.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_545.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(compute_CToken_545.value.mantissa * self.data.totalBorrows, sp.TNat)
    sp.set_type(sp.record(mantissa = compute_CToken_545.value.mantissa * self.data.totalBorrows), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    compute_CToken_546 = sp.local("compute_CToken_546", (compute_CToken_545.value.mantissa * self.data.totalBorrows) // self.data.expScale)
    self.data.totalBorrows = compute_CToken_546.value + self.data.totalBorrows
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_546.value, sp.TNat)
    sp.set_type(self.data.totalReserves, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_546.value, sp.TNat)
    sp.set_type(self.data.reserveFactorMantissa * compute_CToken_546.value, sp.TNat)
    sp.set_type(sp.record(mantissa = self.data.reserveFactorMantissa * compute_CToken_546.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.totalReserves = ((self.data.reserveFactorMantissa * compute_CToken_546.value) // self.data.expScale) + self.data.totalReserves
    sp.set_type(compute_CToken_545.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(compute_CToken_545.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(compute_CToken_545.value, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(self.data.borrowIndex, sp.TNat)
    sp.set_type(compute_CToken_545.value.mantissa * self.data.borrowIndex, sp.TNat)
    sp.set_type(sp.record(mantissa = compute_CToken_545.value.mantissa * self.data.borrowIndex), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.borrowIndex = ((compute_CToken_545.value.mantissa * self.data.borrowIndex) // self.data.expScale) + self.data.borrowIndex
    self.data.accrualBlockNumber = sp.level

  @sp.entry_point
  def exchangeRateStored(self, params):
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
    __s2 = sp.local("__s2", excRate.value)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s2.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getAccountSnapshot(self, params):
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    borrowSnapshot = sp.local("borrowSnapshot", self.data.balances[sp.fst(params)].accountBorrows)
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if borrowSnapshot.value.principal > 0:
      borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
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
    __s3 = sp.local("__s3", sp.record(account = sp.fst(params), borrowBalance = borrowBalance.value, cTokenBalance = self.data.balances[sp.fst(params)].balance, exchangeRateMantissa = excRate.value))
    sp.set_type(sp.snd(params), sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa")))))
    sp.transfer(__s3.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getAllowance(self, params):
    __s4 = sp.local("__s4", self.data.balances[sp.fst(params).owner].approvals[sp.fst(params).spender])
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s4.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getBalance(self, params):
    __s5 = sp.local("__s5", self.data.balances[sp.fst(params)].balance)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s5.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getBalanceOfUnderlying(self, params):
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
    sp.set_type(self.data.balances[sp.fst(params)].balance, sp.TNat)
    sp.set_type(excRate.value * self.data.balances[sp.fst(params)].balance, sp.TNat)
    sp.set_type(sp.record(mantissa = excRate.value * self.data.balances[sp.fst(params)].balance), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    __s6 = sp.local("__s6", (excRate.value * self.data.balances[sp.fst(params)].balance) // self.data.expScale)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s6.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getCash(self, params):
    sp.set_type(sp.fst(params), sp.TUnit)
    __s7 = sp.local("__s7", sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)))
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s7.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def getTotalSupply(self, params):
    sp.set_type(sp.fst(params), sp.TUnit)
    __s8 = sp.local("__s8", self.data.totalSupply)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s8.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def hardResetOp(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.activeOperations = sp.set([])

  @sp.entry_point
  def mint(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.balances.contains(sp.sender)):
      self.data.balances[sp.sender] = sp.record(accountBorrows = sp.record(interestIndex = 0, principal = 0), approvals = {}, balance = 0)
    sp.transfer(sp.record(cToken = sp.self_address, minter = sp.sender, mintAmount = params), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, mintAmount = sp.TNat, minter = sp.TAddress).layout(("cToken", ("minter", "mintAmount"))), self.data.comptroller, entry_point='mintAllowed').open_some())
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
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
      compute_CToken_747 = sp.local("compute_CToken_747", (params * self.data.expScale) // excRate.value)
      amount.value = compute_CToken_747.value
    sp.else:
      sp.set_type(excRate.value, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      sp.set_type(params, sp.TNat)
      sp.set_type(excRate.value * params, sp.TNat)
      sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
      compute_CToken_749 = sp.local("compute_CToken_749", (excRate.value * params) // self.data.expScale)
      amount.value = compute_CToken_749.value
    self.data.totalSupply += amount.value
    self.data.balances[sp.sender].balance += amount.value
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def redeem(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.transfer(sp.record(cToken = sp.self_address, redeemer = sp.sender, redeemAmount = params), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))), self.data.comptroller, entry_point='redeemAllowed').open_some())
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
        compute_CToken_747 = sp.local("compute_CToken_747", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_747.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_749 = sp.local("compute_CToken_749", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_749.value
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
        compute_CToken_747 = sp.local("compute_CToken_747", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_747.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_749 = sp.local("compute_CToken_749", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_749.value
      redeem_tokens.value = amount.value
    sp.else:
      redeem_tokens.value = params
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= redeem_amount.value, 'CT_INSUFFICIENT_CASH')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    self.data.totalSupply = sp.as_nat(self.data.totalSupply - redeem_tokens.value, message = 'Insufficient supply')
    self.data.balances[sp.sender].balance = sp.as_nat(self.data.balances[sp.sender].balance - redeem_tokens.value, message = 'Insufficient balance')
    sp.if False:
      sp.transfer(sp.unit, sp.mul(redeem_amount.value, sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entry_point='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(sp.sender, sp.mul(redeem_amount.value, sp.mutez(1)))
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def redeemUnderlying(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.transfer(sp.record(cToken = sp.self_address, redeemer = sp.sender, redeemAmount = params), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, redeemAmount = sp.TNat, redeemer = sp.TAddress).layout(("cToken", ("redeemer", "redeemAmount"))), self.data.comptroller, entry_point='redeemAllowed').open_some())
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
        compute_CToken_747 = sp.local("compute_CToken_747", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_747.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_749 = sp.local("compute_CToken_749", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_749.value
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
        compute_CToken_747 = sp.local("compute_CToken_747", (params * self.data.expScale) // excRate.value)
        amount.value = compute_CToken_747.value
      sp.else:
        sp.set_type(excRate.value, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(sp.record(mantissa = excRate.value), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        sp.set_type(params, sp.TNat)
        sp.set_type(excRate.value * params, sp.TNat)
        sp.set_type(sp.record(mantissa = excRate.value * params), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
        compute_CToken_749 = sp.local("compute_CToken_749", (excRate.value * params) // self.data.expScale)
        amount.value = compute_CToken_749.value
      redeem_tokens.value = amount.value
    sp.else:
      redeem_tokens.value = params
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) >= redeem_amount.value, 'CT_INSUFFICIENT_CASH')
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    self.data.totalSupply = sp.as_nat(self.data.totalSupply - redeem_tokens.value, message = 'Insufficient supply')
    self.data.balances[sp.sender].balance = sp.as_nat(self.data.balances[sp.sender].balance - redeem_tokens.value, message = 'Insufficient balance')
    sp.if False:
      sp.transfer(sp.unit, sp.mul(redeem_amount.value, sp.mutez(1)), sp.contract(sp.TUnit, sp.sender, entry_point='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(sp.sender, sp.mul(redeem_amount.value, sp.mutez(1)))
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def reduceReserves(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(12)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('accrueInterest'))
    sp.transfer(params, sp.amount, sp.self_entry_point('reduceReservesInternal'))

  @sp.entry_point
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
      sp.transfer(sp.unit, sp.mul(params, sp.mutez(1)), sp.contract(sp.TUnit, self.data.administrator, entry_point='receive').open_some(message = 'bad contract destination'))
    sp.else:
      sp.send(self.data.administrator, sp.mul(params, sp.mutez(1)))
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def removePendingGovernance(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.none

  @sp.entry_point
  def repayBorrow(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.balances.contains(sp.sender)):
      self.data.balances[sp.sender] = sp.record(accountBorrows = sp.record(interestIndex = 0, principal = 0), approvals = {}, balance = 0)
    sp.transfer(sp.record(cToken = sp.self_address, payer = sp.sender, borrower = sp.sender, repayAmount = params), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))), self.data.comptroller, entry_point='repayBorrowAllowed').open_some())
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    borrowSnapshot = sp.local("borrowSnapshot", self.data.balances[sp.sender].accountBorrows)
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if borrowSnapshot.value.principal > 0:
      borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == sp.min(borrowBalance.value, params), 'CT_INVALID_MUTEZ')
    sp.set_type(borrowBalance.value, sp.TNat)
    sp.set_type(sp.min(borrowBalance.value, params), sp.TNat)
    self.data.balances[sp.sender].accountBorrows.principal = sp.as_nat(borrowBalance.value - sp.min(borrowBalance.value, params), message = 'SUBTRACTION_UNDERFLOW')
    self.data.balances[sp.sender].accountBorrows.interestIndex = self.data.borrowIndex
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(sp.min(borrowBalance.value, params), sp.TNat)
    self.data.totalBorrows = sp.as_nat(self.data.totalBorrows - sp.min(borrowBalance.value, params), message = 'SUBTRACTION_UNDERFLOW')
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def repayBorrowBehalf(self, params):
    sp.set_type(params, sp.TRecord(borrower = sp.TAddress, repayAmount = sp.TNat).layout(("borrower", "repayAmount")))
    sp.verify(sp.sender != sp.self_address, 'CT_INTERNAL_CALL')
    sp.if ~ (self.data.balances.contains(sp.sender)):
      self.data.balances[sp.sender] = sp.record(accountBorrows = sp.record(interestIndex = 0, principal = 0), approvals = {}, balance = 0)
    sp.transfer(sp.record(cToken = sp.self_address, payer = sp.sender, borrower = params.borrower, repayAmount = params.repayAmount), sp.tez(0), sp.contract(sp.TRecord(borrower = sp.TAddress, cToken = sp.TAddress, payer = sp.TAddress, repayAmount = sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount")))), self.data.comptroller, entry_point='repayBorrowAllowed').open_some())
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    borrowSnapshot = sp.local("borrowSnapshot", self.data.balances[params.borrower].accountBorrows)
    borrowBalance = sp.local("borrowBalance", 0)
    sp.if borrowSnapshot.value.principal > 0:
      borrowBalance.value = (borrowSnapshot.value.principal * self.data.borrowIndex) // borrowSnapshot.value.interestIndex
    sp.verify(sp.fst(sp.ediv(sp.amount, sp.mutez(1)).open_some(message = sp.unit)) == sp.min(borrowBalance.value, params.repayAmount), 'CT_INVALID_MUTEZ')
    sp.set_type(borrowBalance.value, sp.TNat)
    sp.set_type(sp.min(borrowBalance.value, params.repayAmount), sp.TNat)
    self.data.balances[params.borrower].accountBorrows.principal = sp.as_nat(borrowBalance.value - sp.min(borrowBalance.value, params.repayAmount), message = 'SUBTRACTION_UNDERFLOW')
    self.data.balances[params.borrower].accountBorrows.interestIndex = self.data.borrowIndex
    sp.set_type(self.data.totalBorrows, sp.TNat)
    sp.set_type(sp.min(borrowBalance.value, params.repayAmount), sp.TNat)
    self.data.totalBorrows = sp.as_nat(self.data.totalBorrows - sp.min(borrowBalance.value, params.repayAmount), message = 'SUBTRACTION_UNDERFLOW')
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def setAccrualIntPeriodRelevance(self, params):
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.set_type(params, sp.TNat)
    self.data.accrualIntPeriodRelevance = params

  @sp.entry_point
  def setBorrowRatePerBlock(self, params):
    sp.verify(sp.sender == self.data.interestRateModel, 'CT_SENDER_NOT_IRM')
    sp.verify(self.data.activeOperations.contains(6), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(6)
    self.data.borrowRatePerBlock = params

  @sp.entry_point
  def setComptroller(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.comptroller = params

  @sp.entry_point
  def setInterestRateModel(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(9)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('accrueInterest'))
    sp.transfer(params, sp.tez(0), sp.self_entry_point('setInterestRateModelInternal'))

  @sp.entry_point
  def setInterestRateModelInternal(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(9), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(9)
    self.data.interestRateModel = params

  @sp.entry_point
  def setPendingGovernance(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    self.data.pendingAdministrator = sp.some(params)

  @sp.entry_point
  def setReserveFactor(self, params):
    sp.set_type(params, sp.TNat)
    sp.verify(sp.sender == self.data.administrator, 'CT_NOT_ADMIN')
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(10)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('accrueInterest'))
    sp.transfer(params, sp.tez(0), sp.self_entry_point('setReserveFactorInternal'))

  @sp.entry_point
  def setReserveFactorInternal(self, params):
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(10), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(10)
    sp.set_type(sp.level, sp.TNat)
    sp.set_type(self.data.accrualBlockNumber, sp.TNat)
    compute_CToken_730 = sp.local("compute_CToken_730", sp.as_nat(sp.level - self.data.accrualBlockNumber, message = 'SUBTRACTION_UNDERFLOW'))
    sp.verify(compute_CToken_730.value < self.data.accrualIntPeriodRelevance, 'CT_INTEREST_OLD')
    sp.verify(self.data.isAccrualInterestValid, 'CT_INTEREST_INVALID')
    sp.verify(params <= self.data.reserveFactorMaxMantissa, 'CT_INVALID_RESERVE_FACTOR')
    self.data.reserveFactorMantissa = params
    self.data.isAccrualInterestValid = False

  @sp.entry_point
  def setSupplyRatePerBlock(self, params):
    sp.verify(sp.sender == self.data.interestRateModel, 'CT_SENDER_NOT_IRM')
    sp.verify(self.data.activeOperations.contains(7), 'OP_NOT_ACTIVE')
    self.data.activeOperations.remove(7)
    self.data.supplyRatePerBlock = params

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
    sp.verify(False, 'CT_SWEEP_XTZ')
    sp.if params:
      sp.send(self.data.administrator, sp.balance)
    sp.else:
      sp.send(self.data.administrator, sp.balance)

  @sp.entry_point
  def transfer(self, params):
    sp.set_type(params, sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
    sp.verify((params.from_ == sp.sender) | (self.data.balances[params.from_].approvals[sp.sender] >= params.value), 'CT_TRANSFER_NOT_APPROVED')
    sp.if ~ (self.data.balances.contains(params.to_)):
      self.data.balances[params.to_] = sp.record(accountBorrows = sp.record(interestIndex = 0, principal = 0), approvals = {}, balance = 0)
    sp.transfer(sp.record(cToken = sp.self_address, src = params.from_, dst = params.to_, transferTokens = params.value), sp.tez(0), sp.contract(sp.TRecord(cToken = sp.TAddress, dst = sp.TAddress, src = sp.TAddress, transferTokens = sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens"))), self.data.comptroller, entry_point='transferAllowed').open_some())
    sp.set_type(sp.record(from_ = params.from_, sender = sp.sender, to_ = params.to_, value = params.value), sp.TRecord(from_ = sp.TAddress, sender = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout((("from_", "sender"), ("to_", "value"))))
    sp.verify(self.data.balances[params.from_].balance >= params.value, 'CT_INSUFFICIENT_BALANCE')
    self.data.balances[params.from_].balance = sp.as_nat(self.data.balances[params.from_].balance - params.value)
    self.data.balances[params.to_].balance += params.value
    sp.if params.from_ != sp.sender:
      self.data.balances[params.from_].approvals[sp.sender] = sp.as_nat(self.data.balances[params.from_].approvals[sp.sender] - params.value)

  @sp.entry_point
  def updateBorrowRateInternal(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(6), 'OP_NOT_ACTIVE')
    sp.transfer(sp.record(borrows = self.data.totalBorrows, cash = sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), cb = sp.self_entry_point('setBorrowRatePerBlock'), reserves = self.data.totalReserves), sp.tez(0), sp.contract(sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), self.data.interestRateModel, entry_point='getBorrowRate').open_some())

  @sp.entry_point
  def updateBorrowRatePerBlock(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(6)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('updateBorrowRateInternal'))

  @sp.entry_point
  def updateSupplyRateInternal(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.sender == sp.self_address, 'CT_INTERNAL_FUNCTION')
    sp.verify(self.data.activeOperations.contains(7), 'OP_NOT_ACTIVE')
    sp.transfer(sp.record(borrows = self.data.totalBorrows, cash = sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)), cb = sp.self_entry_point('setSupplyRatePerBlock'), reserves = self.data.totalReserves), sp.tez(0), sp.contract(sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), self.data.interestRateModel, entry_point='getSupplyRate').open_some())

  @sp.entry_point
  def updateSupplyRatePerBlock(self, params):
    sp.set_type(params, sp.TUnit)
    sp.verify(sp.len(self.data.activeOperations) == 0, 'OP_IN_PROGRESS')
    self.data.activeOperations.add(7)
    sp.transfer(sp.unit, sp.tez(0), sp.self_entry_point('updateSupplyRateInternal'))
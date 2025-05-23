import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(baseRatePerBlock = sp.TNat, multiplierPerBlock = sp.TNat, scale = sp.TNat).layout(("baseRatePerBlock", ("multiplierPerBlock", "scale"))))
    self.init(baseRatePerBlock = 760514107,
              multiplierPerBlock = 334400000000,
              scale = 1000000000000000000)

  @sp.entrypoint
  def getBorrowRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))))
    sp.transfer(self.calculateBorrowRate(self.utilizationRate(sp.record(borrows = params.borrows, cash = params.cash, reserves = params.reserves))), sp.tez(0), params.cb)

  @sp.entrypoint
  def getSupplyRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserveFactorMantissa = sp.TNat, reserves = sp.TNat).layout((("borrows", "cash"), ("cb", ("reserveFactorMantissa", "reserves")))))
    sp.transfer((self.utilizationRate(sp.record(borrows = params.borrows, cash = params.cash, reserves = params.reserves)) * ((self.calculateBorrowRate(self.utilizationRate(sp.record(borrows = params.borrows, cash = params.cash, reserves = params.reserves))) * sp.as_nat(self.data.scale - params.reserveFactorMantissa)) // self.data.scale)) // self.data.scale, sp.tez(0), params.cb)

  @sp.private_lambda()
  def calculateBorrowRate(_x0):
    compute_InterestRateModel_68 = sp.local("compute_InterestRateModel_68", ((_x0 * self.data.multiplierPerBlock) // self.data.scale) + self.data.baseRatePerBlock)
    sp.result(compute_InterestRateModel_68.value)

  @sp.private_lambda()
  def utilizationRate(_x2):
    sp.set_type(_x2, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, reserves = sp.TNat).layout(("borrows", ("cash", "reserves"))))
    ur = sp.local("ur", 0)
    sp.if _x2.borrows > 0:
      compute_InterestRateModel_61 = sp.local("compute_InterestRateModel_61", sp.as_nat((_x2.cash + _x2.borrows) - _x2.reserves))
      sp.verify(compute_InterestRateModel_61.value > 0, 'IRM_INSUFFICIENT_CASH')
      ur.value = (_x2.borrows * self.data.scale) // compute_InterestRateModel_61.value
    sp.result(ur.value)

sp.add_compilation_target("test", Contract())
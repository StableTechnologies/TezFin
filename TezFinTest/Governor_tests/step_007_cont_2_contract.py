import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(baseRatePerBlock = sp.TNat, multiplierPerBlock = sp.TNat, scale = sp.TNat).layout(("baseRatePerBlock", ("multiplierPerBlock", "scale"))))
    self.init(baseRatePerBlock = 840000000000,
              multiplierPerBlock = 180000000000,
              scale = 1000000000000000000)

  @sp.entry_point
  def getBorrowRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))))
    ur = sp.local("ur", 0)
    sp.if params.borrows > 0:
      compute_InterestRateModel_55 = sp.local("compute_InterestRateModel_55", sp.as_nat((params.cash + params.borrows) - params.reserves))
      sp.verify(compute_InterestRateModel_55.value > 0, 'IRM_INSUFFICIENT_CASH')
      ur.value = (params.borrows * self.data.scale) // compute_InterestRateModel_55.value
    compute_InterestRateModel_62 = sp.local("compute_InterestRateModel_62", ((ur.value * self.data.multiplierPerBlock) // self.data.scale) + self.data.baseRatePerBlock)
    sp.transfer(compute_InterestRateModel_62.value, sp.tez(0), params.cb)

  @sp.entry_point
  def getSupplyRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserveFactorMantissa = sp.TNat, reserves = sp.TNat).layout((("borrows", "cash"), ("cb", ("reserveFactorMantissa", "reserves")))))
    ur = sp.local("ur", 0)
    sp.if params.borrows > 0:
      compute_InterestRateModel_55 = sp.local("compute_InterestRateModel_55", sp.as_nat((params.cash + params.borrows) - params.reserves))
      sp.verify(compute_InterestRateModel_55.value > 0, 'IRM_INSUFFICIENT_CASH')
      ur.value = (params.borrows * self.data.scale) // compute_InterestRateModel_55.value
    compute_InterestRateModel_62 = sp.local("compute_InterestRateModel_62", ((ur.value * self.data.multiplierPerBlock) // self.data.scale) + self.data.baseRatePerBlock)
    sp.transfer((ur.value * ((compute_InterestRateModel_62.value * sp.as_nat(self.data.scale - params.reserveFactorMantissa)) // self.data.scale)) // self.data.scale, sp.tez(0), params.cb)
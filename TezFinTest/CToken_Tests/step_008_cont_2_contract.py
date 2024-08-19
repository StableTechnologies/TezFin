import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(borrowRate = sp.TNat, supplyRate = sp.TNat).layout(("borrowRate", "supplyRate")))
    self.init(borrowRate = 80000000000,
              supplyRate = 180000000000)

  @sp.entry_point
  def getBorrowRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))))
    sp.transfer(self.data.borrowRate, sp.tez(0), params.cb)

  @sp.entry_point
  def getSupplyRate(self, params):
    sp.set_type(params, sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))))
    sp.transfer(self.data.supplyRate, sp.tez(0), params.cb)

  @sp.entry_point
  def setBorrowRate(self, params):
    sp.set_type(params, sp.TNat)
    self.data.borrowRate = params

  @sp.entry_point
  def setSupplyRate(self, params):
    sp.set_type(params, sp.TNat)
    self.data.supplyRate = params

sp.add_compilation_target("test", Contract())
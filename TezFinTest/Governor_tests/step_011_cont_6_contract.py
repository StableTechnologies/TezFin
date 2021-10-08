import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(price = sp.TNat).layout("price"))
    self.init(price = 0)

  @sp.entry_point
  def get(self, params):
    sp.set_type(params, sp.TPair(sp.TString, sp.TContract(sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)))))
    compute_OracleMock_19 = sp.local("compute_OracleMock_19", sp.fst(params))
    compute_OracleMock_20 = sp.local("compute_OracleMock_20", sp.snd(params))
    sp.transfer((compute_OracleMock_19.value, (sp.timestamp(0), self.data.price)), sp.tez(0), compute_OracleMock_20.value)

  @sp.entry_point
  def setPrice(self, params):
    sp.set_type(params, sp.TNat)
    self.data.price = params
import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(last = sp.TOption(sp.TInt)).layout("last"))
    self.init(last = sp.none)

  @sp.entry_point
  def target(self, params):
    self.data.last = sp.some(params)

  @sp.entry_point
  def targetInt(self, params):
    sp.set_type(params, sp.TInt)
    self.data.last = sp.some(params)
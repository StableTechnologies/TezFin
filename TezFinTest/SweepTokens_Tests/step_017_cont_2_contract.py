import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(administrator = sp.TAddress).layout("administrator"))
    self.init(administrator = sp.address('tz1UyQDepgtUBnWjyzzonqeDwaiWoQzRKSP5'))

  @sp.entry_point
  def receive(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def stubFn(self, params):
    sp.set_type(params, sp.TUnit)
import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(last = sp.TOption(sp.TNat)).layout("last"))
    self.init(last = sp.none)

  @sp.entrypoint
  def target(self, params):
    self.data.last = sp.some(params)

  @sp.entrypoint
  def targetNat(self, params):
    sp.set_type(params, sp.TNat)
    self.data.last = sp.some(params)

sp.add_compilation_target("test", Contract())
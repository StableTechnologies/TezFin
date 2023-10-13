import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(admin = sp.TAddress, alias = sp.TBigMap(sp.TString, sp.TString), oracle = sp.TAddress, overrides = sp.TBigMap(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)), pendingAdmin = sp.TOption(sp.TAddress)).layout((("admin", "alias"), ("oracle", ("overrides", "pendingAdmin")))))
    self.init(admin = sp.address('tz1RESHvJAfmQCXCAD3ubNmVtac788pnN1oL'),
              alias = {'OXTZ-USD' : 'XTZ-USD', 'WTZ-USD' : 'XTZ-USD'},
              oracle = sp.address('KT1KBrn1udLLrGNbQ3n1mWgMVXkr26krj6Nj'),
              overrides = {'USD-USD' : (sp.timestamp(1697180304), 1000000)},
              pendingAdmin = sp.none)

  @sp.entry_point
  def accept_admin(self):
    sp.verify(sp.sender == self.data.pendingAdmin.open_some(message = 'NOT_SET_PENDING_ADMIN'), 'NOT_PENDING_ADMIN')
    self.data.admin = sp.sender
    self.data.pendingAdmin = sp.none

  @sp.entry_point
  def addAlias(self, params):
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    sp.set_type(params, sp.TList(sp.TRecord(alias = sp.TString, asset = sp.TString).layout(("alias", "asset"))))
    sp.for item in params:
      self.data.alias[item.alias] = item.asset

  @sp.entry_point
  def removeAlias(self, params):
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    del self.data.alias[params]

  @sp.entry_point
  def removeAsset(self, params):
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    del self.data.overrides[params]

  @sp.entry_point
  def setPrice(self, params):
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    sp.set_type(params, sp.TList(sp.TRecord(asset = sp.TString, price = sp.TNat).layout(("asset", "price"))))
    sp.for item in params:
      self.data.overrides[item.asset] = (sp.now, item.price)

  @sp.entry_point
  def set_oracle(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    self.data.oracle = params

  @sp.entry_point
  def set_pending_admin(self, params):
    sp.set_type(params, sp.TAddress)
    sp.verify(sp.sender == self.data.admin, 'NOT_ADMIN')
    self.data.pendingAdmin = sp.some(params)

sp.add_compilation_target("test", Contract())
import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(balances = sp.TBigMap(sp.TAddress, sp.TRecord(approvals = sp.TMap(sp.TAddress, sp.TNat), balance = sp.TNat).layout(("approvals", "balance")))).layout("balances"))
    self.init(balances = {})

  @sp.entry_point
  def approve(self, params):
    sp.set_type(params, sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")))
    self.data.balances[sp.sender].approvals[params.spender] = params.value

  @sp.entry_point
  def getBalance(self, params):
    __s1 = sp.local("__s1", self.data.balances[sp.fst(params)].balance)
    sp.set_type(sp.snd(params), sp.TContract(sp.TNat))
    sp.transfer(__s1.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def mint(self, params):
    sp.set_type(params, sp.TRecord(address = sp.TAddress, value = sp.TNat).layout(("address", "value")))
    sp.if ~ (self.data.balances.contains(params.address)):
      self.data.balances[params.address] = sp.record(approvals = {}, balance = 0)
    self.data.balances[params.address].balance += params.value

  @sp.entry_point
  def transfer(self, params):
    sp.set_type(params, sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
    sp.verify((params.from_ == sp.sender) | (self.data.balances[params.from_].approvals[sp.sender] >= params.value))
    sp.if ~ (self.data.balances.contains(params.to_)):
      self.data.balances[params.to_] = sp.record(approvals = {}, balance = 0)
    sp.verify(self.data.balances[params.from_].balance >= params.value)
    self.data.balances[params.from_].balance = sp.as_nat(self.data.balances[params.from_].balance - params.value)
    self.data.balances[params.to_].balance += params.value
    sp.if params.from_ != sp.sender:
      self.data.balances[params.from_].approvals[sp.sender] = sp.as_nat(self.data.balances[params.from_].approvals[sp.sender] - params.value)
import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(administrator = sp.TAddress).layout("administrator"))
    self.init(administrator = sp.address('tz1UyQDepgtUBnWjyzzonqeDwaiWoQzRKSP5'))

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
    sp.if params:
      sp.send(self.data.administrator, sp.balance)
    sp.else:
      sp.send(self.data.administrator, sp.balance)

  @sp.entry_point
  def verifyMutezBalance(self, params):
    sp.verify(sp.fst(sp.ediv(sp.balance, sp.mutez(1)).open_some(message = sp.unit)) == params)
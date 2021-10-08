import smartpy as sp

tstorage = sp.TRecord(balances = sp.TBigMap(sp.TAddress, sp.TRecord(approvals = sp.TMap(sp.TAddress, sp.TNat), balance = sp.TNat).layout(("approvals", "balance")))).layout("balances")
tparameter = sp.TVariant(approve = sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")), getBalance = sp.TPair(sp.TAddress, sp.TContract(sp.TNat)), mint = sp.TRecord(address = sp.TAddress, value = sp.TNat).layout(("address", "value")), transfer = sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value")))).layout((("approve", "getBalance"), ("mint", "transfer")))
tglobals = { }
tviews = { }

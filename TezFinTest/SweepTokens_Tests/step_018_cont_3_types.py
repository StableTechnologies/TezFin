import smartpy as sp

tstorage = sp.TRecord(administrator = sp.TAddress).layout("administrator")
tparameter = sp.TVariant(sweepFA12 = sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", "tokenAddress")), sweepFA2 = sp.TRecord(amount = sp.TNat, id = sp.TNat, tokenAddress = sp.TAddress).layout(("amount", ("id", "tokenAddress"))), sweepMutez = sp.TBool, verifyMutezBalance = sp.TNat).layout((("sweepFA12", "sweepFA2"), ("sweepMutez", "verifyMutezBalance")))
tglobals = { }
tviews = { }

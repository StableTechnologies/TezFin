import smartpy as sp

tstorage = sp.TRecord(price = sp.TNat).layout("price")
tparameter = sp.TVariant(get = sp.TPair(sp.TString, sp.TContract(sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)))), setPrice = sp.TNat).layout(("get", "setPrice"))
tglobals = { }
tviews = { }

import smartpy as sp

tstorage = sp.TRecord(last = sp.TOption(sp.TNat)).layout("last")
tparameter = sp.TVariant(target = sp.TNat, targetNat = sp.TNat).layout(("target", "targetNat"))
tglobals = { }
tviews = { }

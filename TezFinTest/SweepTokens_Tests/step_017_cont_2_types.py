import smartpy as sp

tstorage = sp.TRecord(administrator = sp.TAddress).layout("administrator")
tparameter = sp.TVariant(receive = sp.TUnit, stubFn = sp.TUnit).layout(("receive", "stubFn"))
tglobals = { }
tviews = { }

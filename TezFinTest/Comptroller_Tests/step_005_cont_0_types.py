import smartpy as sp

tstorage = sp.TRecord(last = sp.TOption(sp.TInt)).layout("last")
tparameter = sp.TVariant(target = sp.TInt, targetInt = sp.TInt).layout(("target", "targetInt"))
tglobals = { }
tviews = { }

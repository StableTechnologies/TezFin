import smartpy as sp

tstorage = sp.TRecord(baseRatePerBlock = sp.TNat, multiplierPerBlock = sp.TNat, scale = sp.TNat).layout(("baseRatePerBlock", ("multiplierPerBlock", "scale")))
tparameter = sp.TVariant(getBorrowRate = sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), getSupplyRate = sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserveFactorMantissa = sp.TNat, reserves = sp.TNat).layout((("borrows", "cash"), ("cb", ("reserveFactorMantissa", "reserves"))))).layout(("getBorrowRate", "getSupplyRate"))
tprivates = { }
tviews = { }

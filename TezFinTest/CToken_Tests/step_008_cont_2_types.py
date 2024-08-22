import smartpy as sp

tstorage = sp.TRecord(borrowRate = sp.TNat, supplyRate = sp.TNat).layout(("borrowRate", "supplyRate"))
tparameter = sp.TVariant(getBorrowRate = sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), getSupplyRate = sp.TRecord(borrows = sp.TNat, cash = sp.TNat, cb = sp.TContract(sp.TNat), reserves = sp.TNat).layout((("borrows", "cash"), ("cb", "reserves"))), setBorrowRate = sp.TNat, setSupplyRate = sp.TNat).layout((("getBorrowRate", "getSupplyRate"), ("setBorrowRate", "setSupplyRate")))
tprivates = { }
tviews = { }

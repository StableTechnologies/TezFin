import smartpy as sp

tstorage = sp.TRecord(comptroller = sp.TAddress, test_account_snapshot = sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa")))).layout(("comptroller", "test_account_snapshot"))
tparameter = sp.TVariant(accrueInterest = sp.TUnit, getAccountSnapshot = sp.TPair(sp.TAddress, sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))), setAccountSnapshot = sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))), setComptroller = sp.TAddress).layout((("accrueInterest", "getAccountSnapshot"), ("setAccountSnapshot", "setComptroller")))
tglobals = { }
tviews = { }

import smartpy as sp

tstorage = sp.TRecord(admin = sp.TAddress, alias = sp.TBigMap(sp.TString, sp.TString), oracle = sp.TAddress, overrides = sp.TBigMap(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)), pendingAdmin = sp.TOption(sp.TAddress)).layout((("admin", "alias"), ("oracle", ("overrides", "pendingAdmin"))))
tparameter = sp.TVariant(accept_admin = sp.TUnit, addAlias = sp.TList(sp.TRecord(alias = sp.TString, asset = sp.TString).layout(("alias", "asset"))), removeAlias = sp.TString, removeAsset = sp.TString, setPrice = sp.TList(sp.TRecord(asset = sp.TString, price = sp.TNat).layout(("asset", "price"))), set_oracle = sp.TAddress, set_pending_admin = sp.TAddress).layout((("accept_admin", ("addAlias", "removeAlias")), (("removeAsset", "setPrice"), ("set_oracle", "set_pending_admin"))))
tprivates = { }
tviews = { "getPrice": (sp.TString, sp.TPair(sp.TTimestamp, sp.TNat)) }
import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(comptroller = sp.TAddress, test_account_snapshot = sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa")))).layout(("comptroller", "test_account_snapshot")))
    self.init(comptroller = sp.address('KT10'),
              test_account_snapshot = sp.record(account = sp.address('tz1WxrQuZ4CK1MBUa2GqUWK1yJ4J6EtG1Gwi'), borrowBalance = 0, cTokenBalance = 10, exchangeRateMantissa = 1000000000000000000))

  @sp.entry_point
  def accrueInterest(self, params):
    sp.set_type(params, sp.TUnit)

  @sp.entry_point
  def getAccountSnapshot(self, params):
    sp.set_type(sp.fst(params), sp.TAddress)
    __s2 = sp.local("__s2", self.data.test_account_snapshot)
    sp.set_type(sp.snd(params), sp.TContract(sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa")))))
    sp.transfer(__s2.value, sp.tez(0), sp.snd(params))

  @sp.entry_point
  def setAccountSnapshot(self, params):
    sp.set_type(params, sp.TRecord(account = sp.TAddress, borrowBalance = sp.TNat, cTokenBalance = sp.TNat, exchangeRateMantissa = sp.TNat).layout((("account", "borrowBalance"), ("cTokenBalance", "exchangeRateMantissa"))))
    self.data.test_account_snapshot = params

  @sp.entry_point
  def setComptroller(self, params):
    sp.set_type(params, sp.TAddress)
    self.data.comptroller = params
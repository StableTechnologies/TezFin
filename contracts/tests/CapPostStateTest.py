import json

import smartpy as sp

CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")
CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
IRM = sp.io.import_script_from_url(
    "file:contracts/tests/mock/InterestRateModelMock.py")


class CapTestComptroller(CMPT.Comptroller):
    def __init__(self, administrator_):
        CMPT.Comptroller.__init__(
            self,
            administrator_=administrator_,
            oracleAddress_=sp.address("KT10"),
            closeFactorMantissa_=sp.nat(0),
            liquidationIncentiveMantissa_=sp.nat(0))

    @sp.entry_point
    def setMarketPriceForTest(self, cToken):
        sp.set_type(cToken, sp.TAddress)
        self.data.markets[cToken].price.mantissa = sp.nat(int(1e18))
        self.data.markets[cToken].updateLevel = sp.level

    @sp.entry_point
    def setLiquidityForTest(self, params):
        sp.set_type(params, sp.TRecord(account=sp.TAddress, liquidity=sp.TInt))
        self.data.account_liquidity[params.account] = sp.record(
            liquidity=params.liquidity,
            updateLevel=sp.level,
            valid=sp.bool(True))


class CapTestCToken(CToken.CToken):
    def __init__(self, comptroller_, interestRateModel_, administrator_,
                 initialExchangeRateMantissa_):
        CToken.CToken.__init__(
            self,
            comptroller_,
            interestRateModel_,
            initialExchangeRateMantissa_,
            administrator_,
            sp.big_map({
                "": sp.utils.bytes_of_string("tezos-storage:data"),
                "data": sp.utils.bytes_of_string(json.dumps({"name": "cap test"}))
            }),
            {
                "name": sp.utils.bytes_of_string("Cap test token"),
                "symbol": sp.utils.bytes_of_string("CAP"),
                "decimals": sp.utils.bytes_of_string("18")
            },
            cash=sp.nat(0))

    def getCashImpl(self):
        return self.data.cash

    def doTransferIn(self, from_, amount):
        self.data.cash += amount

    def doTransferOut(self, to_, amount, isContract=False):
        self.data.cash = sp.as_nat(self.data.cash - amount)


@sp.add_test(name="Cap_Post_State_Boundaries")
def test():
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    admin = sp.test_account("cap admin")
    supplier = sp.test_account("cap supplier")
    borrower = sp.test_account("cap borrower")

    irm = IRM.InterestRateModelMock(
        borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm
    comptroller = CapTestComptroller(administrator_=admin.address)
    scenario += comptroller
    cToken = CapTestCToken(
        comptroller_=comptroller.address,
        interestRateModel_=irm.address,
        administrator_=admin.address,
        initialExchangeRateMantissa_=sp.nat(int(1e18)))
    scenario += cToken

    scenario += comptroller.supportMarket(sp.record(
        cToken=cToken.address, name="CAP", priceExp=sp.nat(1))).run(
            sender=admin, level=1)
    scenario += comptroller.setMintPaused(sp.record(
        cToken=cToken.address, state=False)).run(sender=admin, level=1)
    scenario += comptroller.setBorrowPaused(sp.record(
        cToken=cToken.address, state=False)).run(sender=admin, level=1)
    scenario += comptroller.setMarketCaps(sp.record(
        cToken=cToken.address, supplyCap=sp.nat(200),
        borrowCap=sp.nat(100))).run(sender=admin, level=1)
    scenario += cToken.accrueInterest().run(sender=supplier, level=1)

    scenario.h2("Supply cap uses the post-mint total exactly once")
    scenario += cToken.mint(sp.nat(80)).run(sender=supplier, level=1)
    scenario += cToken.mint(sp.nat(120)).run(sender=supplier, level=1)
    scenario.verify(cToken.data.totalSupply == sp.nat(200))
    scenario += cToken.mint(sp.nat(1)).run(
        sender=supplier, level=1, valid=False,
        exception=CMPT.EC.CMPT_SUPPLY_CAP_EXCEEDED)
    scenario.verify(cToken.data.totalSupply == sp.nat(200))

    scenario.h2("Borrow cap uses the post-borrow total exactly once")
    scenario += comptroller.setMarketPriceForTest(cToken.address).run(level=1)
    scenario += comptroller.setLiquidityForTest(sp.record(
        account=borrower.address, liquidity=sp.int(10**30))).run(level=1)
    scenario += cToken.borrow(sp.nat(40)).run(sender=borrower, level=1)
    scenario += comptroller.setLiquidityForTest(sp.record(
        account=borrower.address, liquidity=sp.int(10**30))).run(level=1)
    scenario += cToken.borrow(sp.nat(60)).run(sender=borrower, level=1)
    scenario.verify(cToken.data.totalBorrows == sp.nat(100))
    scenario += comptroller.setLiquidityForTest(sp.record(
        account=borrower.address, liquidity=sp.int(10**30))).run(level=1)
    scenario += cToken.borrow(sp.nat(1)).run(
        sender=borrower, level=1, valid=False,
        exception=CMPT.EC.CMPT_BORROW_CAP_EXCEEDED)
    scenario.verify(cToken.data.totalBorrows == sp.nat(100))


@sp.add_test(name="Supply_Cap_Exchange_Rate_Rounding")
def exchange_rate_rounding_test():
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    admin = sp.test_account("rounding admin")
    supplier = sp.test_account("rounding supplier")
    irm = IRM.InterestRateModelMock(
        borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm
    comptroller = CapTestComptroller(administrator_=admin.address)
    scenario += comptroller
    cToken = CapTestCToken(
        comptroller_=comptroller.address,
        interestRateModel_=irm.address,
        administrator_=admin.address,
        initialExchangeRateMantissa_=sp.nat(1500000000000000000))
    scenario += cToken

    scenario += comptroller.supportMarket(sp.record(
        cToken=cToken.address, name="ROUND", priceExp=sp.nat(1))).run(
            sender=admin, level=1)
    scenario += comptroller.setMintPaused(sp.record(
        cToken=cToken.address, state=False)).run(sender=admin, level=1)
    scenario += comptroller.setMarketCaps(sp.record(
        cToken=cToken.address, supplyCap=sp.nat(2),
        borrowCap=sp.nat(0))).run(sender=admin, level=1)
    scenario += cToken.accrueInterest().run(sender=supplier, level=1)

    scenario += cToken.mint(sp.nat(2)).run(sender=supplier, level=1)
    scenario.verify(cToken.data.totalSupply == sp.nat(1))
    scenario.verify(cToken.data.cash == sp.nat(2))
    scenario += cToken.mint(sp.nat(2)).run(
        sender=supplier, level=1, valid=False,
        exception=CMPT.EC.CMPT_SUPPLY_CAP_EXCEEDED)

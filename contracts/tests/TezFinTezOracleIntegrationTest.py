import json

import smartpy as sp

CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")
CMPTI = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")
CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
CTMock = sp.io.import_script_from_url("file:contracts/tests/mock/CTokenMock.py")
IRM = sp.io.import_script_from_url(
    "file:contracts/tests/mock/InterestRateModelMock.py")
TezFinOracle = sp.io.import_script_from_url(
    "file:contracts/TezFinOracle.py").TezFinOracle
TezOracleHarness = sp.io.import_script_from_url(
    "file:contracts/tests/mock/TezOracleHarness.py").TezOracleHarness


class PriceConsumer(sp.Contract):
    def __init__(self, oracle):
        self.init(oracle=oracle)

    @sp.entry_point
    def verifyPrice(self, params):
        sp.set_type(params, sp.TRecord(
            asset=sp.TString,
            expectedPrice=sp.TNat,
            expectedTimestamp=sp.TTimestamp,
        ))
        price = sp.view(
            "getPrice",
            self.data.oracle,
            params.asset,
            t=sp.TPair(sp.TTimestamp, sp.TNat),
        ).open_some("invalid oracle price view")
        sp.verify(sp.fst(price) == params.expectedTimestamp, "TIMESTAMP_MISMATCH")
        sp.verify(sp.snd(price) == params.expectedPrice, "PRICE_MISMATCH")

    @sp.entry_point
    def verifyUpstreamTuple(self, params):
        sp.set_type(params, sp.TRecord(
            asset=sp.TString,
            expectedPrice=sp.TNat,
            expectedTimestamp=sp.TTimestamp,
        ))
        price = sp.view(
            "get_price_with_timestamp",
            self.data.oracle,
            params.asset,
            t=sp.TPair(sp.TNat, sp.TTimestamp),
        ).open_some("invalid upstream tuple view")
        sp.verify(sp.fst(price) == params.expectedPrice, "PRICE_MISMATCH")
        sp.verify(sp.snd(price) == params.expectedTimestamp, "TIMESTAMP_MISMATCH")

    @sp.entry_point
    def verifyValidatedPrice(self, params):
        sp.set_type(params, sp.TRecord(
            asset=sp.TString,
            cToken=sp.TAddress,
            previousPrice=sp.TNat,
            previousTimestamp=sp.TTimestamp,
            expectedPrice=sp.TNat,
        ))
        price = sp.view(
            "getValidatedPrice",
            self.data.oracle,
            sp.record(
                comptroller=sp.self_address,
                cToken=params.cToken,
                requestedAsset=params.asset,
                previousPrice=params.previousPrice,
                previousTimestamp=params.previousTimestamp,
            ),
            t=sp.TPair(sp.TTimestamp, sp.TNat),
        ).open_some("invalid validated oracle view")
        sp.verify(sp.snd(price) == params.expectedPrice, "PRICE_MISMATCH")


class IntegrationMarket(CTMock.CTokenMock):
    def __init__(self, snapshot):
        CTMock.CTokenMock.__init__(self, test_account_snapshot_=snapshot)
        self.update_initial_storage(borrowBalance=sp.nat(100))

    @sp.onchain_view()
    def borrowBalanceStoredView(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(sp.pair(self.data.borrowBalance, sp.level))

    @sp.onchain_view()
    def exchangeRateStoredView(self, unused):
        sp.set_type(unused, sp.TUnit)
        sp.result(sp.pair(sp.nat(int(1e18)), sp.level))


class IntegrationCToken(CToken.CToken):
    def __init__(self, comptroller, interestRateModel, administrator):
        CToken.CToken.__init__(
            self,
            comptroller,
            interestRateModel,
            sp.nat(int(1e18)),
            administrator,
            sp.big_map({
                "": sp.utils.bytes_of_string("tezos-storage:data"),
                "data": sp.utils.bytes_of_string(json.dumps({
                    "name": "TezOracle integration market",
                })),
            }),
            {
                "name": sp.utils.bytes_of_string("TezOracle integration market"),
                "symbol": sp.utils.bytes_of_string("iXTZ"),
                "decimals": sp.utils.bytes_of_string("6"),
            },
            cash=sp.nat(100000),
        )

    def getCashImpl(self):
        return self.data.cash

    def doTransferIn(self, from_, amount):
        self.data.cash += amount

    def doTransferOut(self, to_, amount, isContract=False):
        self.data.cash = sp.as_nat(self.data.cash - amount)


def publish(oracle, asset, price, timestamp, level, valid=True):
    return oracle.submit(sp.record(
        asset_id=asset,
        price=sp.nat(price),
        observation_time=sp.timestamp(timestamp),
    )).run(level=level, valid=valid)


def configureConsumer(scenario, wrapper, consumer, market):
    scenario += wrapper.configureMaxPriceAge(sp.int(300)).run(sender=consumer.address)
    scenario += wrapper.configurePriceBounds(sp.record(
        cToken=market,
        minPrice=sp.nat(100000),
        maxPrice=sp.nat(1000000),
        maxChangeBps=sp.nat(2000),
    )).run(sender=consumer.address)


@sp.add_test(name="TezFin_TezOracle_Interface_And_Fail_Closed")
def testInterfaceAndFailures():
    scenario = sp.test_scenario()
    admin = sp.test_account("admin")
    upstream = TezOracleHarness(activation_delay_levels=1)
    scenario += upstream
    wrapper = TezFinOracle(admin.address, upstream.address)
    scenario += wrapper
    consumer = PriceConsumer(wrapper.address)
    scenario += consumer
    market = sp.address("KT10")
    configureConsumer(scenario, wrapper, consumer, market)

    # Missing and immature pending prices fail closed.
    scenario += consumer.verifyPrice(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=10, now=sp.timestamp(1010), valid=False)
    scenario += publish(upstream, "XTZ_USD", 750000, 1000, 10)
    scenario += consumer.verifyPrice(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=10, now=sp.timestamp(1010), valid=False)

    # The exact upstream (nat, timestamp) tuple is reordered for TezFin.
    scenario += consumer.verifyPrice(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=11, now=sp.timestamp(1010))
    scenario += consumer.verifyPrice(
        asset="OXTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=11, now=sp.timestamp(1010))
    scenario += consumer.verifyUpstreamTuple(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=11, now=sp.timestamp(1010))
    scenario += upstream.promote("XTZ_USD").run(level=11)
    scenario += consumer.verifyPrice(
        asset="UNKNOWN-USD", expectedPrice=1,
        expectedTimestamp=sp.timestamp(1),
    ).run(level=11, now=sp.timestamp(1010), valid=False, exception="ASSET_ID")

    # BTC/tzBTC and USDt/USDtz remain distinct canonical upstream assets.
    scenario += publish(upstream, "BTC_USD", 65000000000, 1100, 11)
    scenario += publish(upstream, "TZBTC_USD", 64000000000, 1101, 11)
    scenario += publish(upstream, "USDT_USD", 1000000, 1102, 11)
    scenario += publish(upstream, "USDTZ_USD", 990000, 1103, 11)
    scenario += consumer.verifyPrice(
        asset="BTC-USD", expectedPrice=65000000000,
        expectedTimestamp=sp.timestamp(1100),
    ).run(level=12, now=sp.timestamp(1110))
    scenario += consumer.verifyPrice(
        asset="TZBTC-USD", expectedPrice=64000000000,
        expectedTimestamp=sp.timestamp(1101),
    ).run(level=12, now=sp.timestamp(1110))
    scenario += consumer.verifyPrice(
        asset="USDT-USD", expectedPrice=1000000,
        expectedTimestamp=sp.timestamp(1102),
    ).run(level=12, now=sp.timestamp(1110))
    scenario += consumer.verifyPrice(
        asset="USD-USD", expectedPrice=990000,
        expectedTimestamp=sp.timestamp(1103),
    ).run(level=12, now=sp.timestamp(1110))

    # Global and per-asset pauses propagate through both wrapper views.
    scenario += upstream.pause().run(level=13)
    scenario += consumer.verifyPrice(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=13, now=sp.timestamp(1010), valid=False)
    scenario += upstream.propose_unpause().run(level=13)
    scenario += upstream.activate_unpause().run(
        level=13, valid=False, exception="DELAY")
    scenario += upstream.activate_unpause().run(level=14)
    scenario += upstream.pause_asset("XTZ_USD").run(level=14)
    scenario += consumer.verifyPrice(
        asset="XTZ-USD", expectedPrice=750000,
        expectedTimestamp=sp.timestamp(1000),
    ).run(level=14, now=sp.timestamp(1010), valid=False)
    scenario += upstream.propose_asset_unpause("XTZ_USD").run(level=14)
    scenario += upstream.activate_asset_unpause("XTZ_USD").run(level=15)

    # Consumer freshness and bounds remain mandatory after upstream acceptance.
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(0), previousTimestamp=sp.timestamp(0),
        expectedPrice=sp.nat(750000),
    ).run(level=15, now=sp.timestamp(1401), valid=False,
          exception="STALE_ASSET_PRICE")
    scenario += upstream.clear_price("XTZ_USD").run(level=15)
    scenario += publish(upstream, "XTZ_USD", 99999, 1500, 15)
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(0), previousTimestamp=sp.timestamp(0),
        expectedPrice=sp.nat(99999),
    ).run(level=16, now=sp.timestamp(1510), valid=False,
          exception="ASSET_PRICE_OUT_OF_BOUNDS")

    scenario += upstream.clear_price("XTZ_USD").run(level=17)
    scenario += publish(upstream, "XTZ_USD", 750000, 2000, 17)
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(0), previousTimestamp=sp.timestamp(0),
        expectedPrice=sp.nat(750000),
    ).run(level=18, now=sp.timestamp(1999), valid=False,
          exception="FUTURE_ASSET_PRICE")

    scenario += upstream.clear_price("XTZ_USD").run(level=19)
    scenario += publish(upstream, "XTZ_USD", 750000, 0, 19)
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(0), previousTimestamp=sp.timestamp(0),
        expectedPrice=sp.nat(750000),
    ).run(level=20, now=sp.timestamp(2000), valid=False,
          exception="INVALID_ASSET_PRICE_TIMESTAMP")

    scenario += upstream.clear_price("XTZ_USD").run(level=21)
    scenario += publish(upstream, "XTZ_USD", 750000, 2100, 21)
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(750000), previousTimestamp=sp.timestamp(2200),
        expectedPrice=sp.nat(750000),
    ).run(level=22, now=sp.timestamp(2110), valid=False,
          exception="ASSET_PRICE_TIMESTAMP_ROLLBACK")
    scenario += consumer.verifyValidatedPrice(
        asset="XTZ-USD", cToken=market,
        previousPrice=sp.nat(500000), previousTimestamp=sp.timestamp(2000),
        expectedPrice=sp.nat(750000),
    ).run(level=22, now=sp.timestamp(2110), valid=False,
          exception="ASSET_PRICE_CHANGE_TOO_LARGE")


class IntegrationComptroller(CMPT.Comptroller):
    def __init__(self, admin, oracle):
        CMPT.Comptroller.__init__(
            self,
            administrator_=admin,
            oracleAddress_=oracle,
            closeFactorMantissa_=sp.nat(int(5e17)),
            liquidationIncentiveMantissa_=sp.nat(int(11e17)),
            maxAssetsPerUser_=5,
        )

    @sp.entry_point
    def setLiquidityForTest(self, params):
        sp.set_type(params, sp.TRecord(account=sp.TAddress, liquidity=sp.TInt))
        self.data.account_liquidity[params.account] = sp.record(
            liquidity=params.liquidity,
            updateLevel=sp.level,
            valid=True,
        )


def setupProtocol(scenario):
    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    upstream = TezOracleHarness(activation_delay_levels=1)
    scenario += upstream
    wrapper = TezFinOracle(admin.address, upstream.address)
    scenario += wrapper
    comptroller = IntegrationComptroller(admin.address, wrapper.address)
    scenario += comptroller
    market = IntegrationMarket(sp.record(
        account=alice.address,
        cTokenBalance=sp.nat(1000),
        borrowBalance=sp.nat(100),
        exchangeRateMantissa=sp.nat(int(1e18)),
    ))
    scenario += market
    scenario += market.setComptroller(comptroller.address)
    scenario += comptroller.supportMarket(sp.record(
        cToken=market.address, name="XTZ", priceExp=sp.nat(10 ** 12),
    )).run(sender=admin)
    scenario += comptroller.setMarketCaps(sp.record(
        cToken=market.address, supplyCap=sp.nat(10 ** 30),
        borrowCap=sp.nat(10 ** 30),
    )).run(sender=admin)
    scenario += comptroller.setMintPaused(
        sp.record(cToken=market.address, state=False)).run(sender=admin)
    scenario += comptroller.setBorrowPaused(
        sp.record(cToken=market.address, state=False)).run(sender=admin)
    scenario += comptroller.setRedeemPaused(
        sp.record(cToken=market.address, state=False)).run(sender=admin)
    scenario += comptroller.setLiquidatePaused(
        sp.record(cToken=market.address, state=False)).run(sender=admin)
    scenario += comptroller.setTransferPaused(False).run(sender=admin)
    scenario += comptroller.setPriceOracleAndTimeDiff(sp.record(
        priceOracle=wrapper.address, timeDiff=sp.int(300),
    )).run(sender=admin)
    scenario += comptroller.setPriceBounds(sp.record(
        cToken=market.address, minPrice=sp.nat(100000),
        maxPrice=sp.nat(1000000), maxChangeBps=sp.nat(2000),
    )).run(sender=admin)
    return admin, alice, bob, upstream, wrapper, comptroller, market


@sp.add_test(name="TezFin_TezOracle_Actions_And_Recovery")
def testActionsAndRecovery():
    scenario = sp.test_scenario()
    admin, alice, bob, upstream, wrapper, comptroller, market = setupProtocol(scenario)

    scenario += publish(upstream, "XTZ_USD", 750000, 2000, 20)
    scenario += comptroller.enterMarkets([market.address]).run(
        sender=alice, level=21, now=sp.timestamp(2010))
    scenario += comptroller.setLiquidityForTest(sp.record(
        account=alice.address, liquidity=sp.int(-1000000),
    )).run(level=21)

    # Pause must stop every price-dependent gate, including same-level cached prices.
    scenario += upstream.pause().run(level=21)
    scenario += comptroller.mintAllowed(sp.record(
        cToken=market.address, minter=alice.address, mintAmount=sp.nat(1),
    )).run(sender=market.address, level=21, now=sp.timestamp(2010), valid=False)
    scenario += comptroller.borrowAllowed(sp.record(
        cToken=market.address, borrower=alice.address, borrowAmount=sp.nat(1),
    )).run(sender=market.address, level=21, now=sp.timestamp(2010), valid=False)
    scenario += comptroller.transferAllowed(sp.record(
        cToken=market.address, src=alice.address, dst=bob.address,
        transferTokens=sp.nat(1),
    )).run(sender=market.address, level=21, now=sp.timestamp(2010), valid=False)
    scenario += comptroller.enterMarkets([market.address]).run(
        sender=bob, level=21, now=sp.timestamp(2010), valid=False)
    scenario += comptroller.exitMarket(market.address).run(
        sender=alice, level=21, now=sp.timestamp(2010), valid=False)
    scenario += comptroller.liquidateBorrowAllowed(sp.record(
        cTokenBorrowed=market.address,
        cTokenCollateral=market.address,
        borrower=alice.address,
        liquidator=bob.address,
        repayAmount=sp.nat(1),
    )).run(sender=market.address, level=21, now=sp.timestamp(2010), valid=False)

    # Repayment is a recovery action and deliberately has no oracle dependency.
    scenario += comptroller.repayBorrowAllowed(sp.record(
        cToken=market.address, payer=alice.address,
        borrower=alice.address, repayAmount=sp.nat(1),
    )).run(sender=market.address, level=21, now=sp.timestamp(2010))

    # A quarantined pre-incident pending quote cannot reopen actions.
    scenario += upstream.propose_unpause().run(level=21)
    scenario += upstream.activate_unpause().run(level=22)
    scenario += upstream.clear_price("XTZ_USD").run(level=22)
    scenario += publish(upstream, "XTZ_USD", 760000, 2020, 22)
    scenario += upstream.pause().run(level=22)
    scenario += upstream.propose_unpause().run(level=22)
    scenario += upstream.activate_unpause().run(level=23)
    scenario += comptroller.mintAllowed(sp.record(
        cToken=market.address, minter=alice.address, mintAmount=sp.nat(1),
    )).run(sender=market.address, level=23, now=sp.timestamp(2030), valid=False)

    # A fresh post-incident quote is still unusable in its acceptance level.
    scenario += publish(upstream, "XTZ_USD", 760000, 2030, 23)
    scenario += comptroller.mintAllowed(sp.record(
        cToken=market.address, minter=alice.address, mintAmount=sp.nat(1),
    )).run(sender=market.address, level=23, now=sp.timestamp(2030), valid=False)

    # Only the fresh mature quote restores price-dependent actions.
    scenario += comptroller.mintAllowed(sp.record(
        cToken=market.address, minter=alice.address, mintAmount=sp.nat(1),
    )).run(sender=market.address, level=24, now=sp.timestamp(2040))


@sp.add_test(name="TezFin_TezOracle_Exact_CToken_Paths")
def testExactCTokenPaths():
    scenario = sp.test_scenario()
    admin = sp.test_account("exact admin")
    borrower = sp.test_account("exact borrower")
    liquidator = sp.test_account("exact liquidator")
    upstream = TezOracleHarness(activation_delay_levels=1)
    scenario += upstream
    wrapper = TezFinOracle(admin.address, upstream.address)
    scenario += wrapper
    comptroller = IntegrationComptroller(admin.address, wrapper.address)
    scenario += comptroller
    irm = IRM.InterestRateModelMock(
        borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm
    market = IntegrationCToken(
        comptroller.address, irm.address, admin.address)
    scenario += market

    scenario += comptroller.supportMarket(sp.record(
        cToken=market.address, name="XTZ", priceExp=sp.nat(10 ** 12),
    )).run(sender=admin, level=30)
    scenario += comptroller.setMarketCaps(sp.record(
        cToken=market.address, supplyCap=sp.nat(10 ** 30),
        borrowCap=sp.nat(10 ** 30),
    )).run(sender=admin, level=30)
    scenario += comptroller.setMintPaused(
        sp.record(cToken=market.address, state=False)).run(
            sender=admin, level=30)
    scenario += comptroller.setBorrowPaused(
        sp.record(cToken=market.address, state=False)).run(
            sender=admin, level=30)
    scenario += comptroller.setRedeemPaused(
        sp.record(cToken=market.address, state=False)).run(
            sender=admin, level=30)
    scenario += comptroller.setLiquidatePaused(
        sp.record(cToken=market.address, state=False)).run(
            sender=admin, level=30)
    scenario += comptroller.setTransferPaused(False).run(
        sender=admin, level=30)
    scenario += comptroller.setPriceOracleAndTimeDiff(sp.record(
        priceOracle=wrapper.address, timeDiff=sp.int(300),
    )).run(sender=admin, level=30)
    scenario += comptroller.setPriceBounds(sp.record(
        cToken=market.address, minPrice=sp.nat(100000),
        maxPrice=sp.nat(1000000), maxChangeBps=sp.nat(2000),
    )).run(sender=admin, level=30)

    scenario += publish(upstream, "XTZ_USD", 750000, 3000, 30)
    scenario += market.accrueInterest().run(
        sender=borrower, level=31, now=sp.timestamp(3010))
    scenario += market.mint(sp.nat(1000)).run(
        sender=borrower, level=31, now=sp.timestamp(3010))
    scenario += comptroller.enterMarkets([market.address]).run(
        sender=borrower, level=31, now=sp.timestamp(3010))
    scenario += market.accrueInterest().run(
        sender=borrower, level=32, now=sp.timestamp(3020))
    scenario += comptroller.setLiquidityForTest(sp.record(
        account=borrower.address, liquidity=sp.int(10 ** 30),
    )).run(level=32)
    scenario += market.borrow(sp.nat(100)).run(
        sender=borrower, level=32, now=sp.timestamp(3020))
    scenario.verify(market.data.borrows[borrower.address].principal == 100)

    # Force a liquidatable position while retaining cTokens to seize.
    scenario += comptroller.setCollateralFactor(sp.record(
        cToken=market.address, newCollateralFactor=sp.nat(0),
    )).run(sender=admin, level=32)
    balanceBefore = market.data.ledger[borrower.address].balance
    supplyBefore = market.data.totalSupply
    borrowsBefore = market.data.totalBorrows
    scenario += upstream.pause().run(level=32)

    scenario += market.mint(sp.nat(1)).run(
        sender=borrower, level=32, now=sp.timestamp(3020), valid=False)
    scenario.verify(market.data.totalSupply == supplyBefore)
    scenario += market.borrow(sp.nat(1)).run(
        sender=borrower, level=32, now=sp.timestamp(3020), valid=False)
    scenario.verify(market.data.totalBorrows == borrowsBefore)
    scenario += market.transfer(sp.record(
        from_=borrower.address, to_=liquidator.address, value=sp.nat(1),
    )).run(sender=borrower, level=32, now=sp.timestamp(3020), valid=False)
    scenario.verify(market.data.ledger[borrower.address].balance == balanceBefore)
    scenario += market.liquidateBorrow(sp.record(
        borrower=borrower.address,
        cTokenCollateral=market.address,
        repayAmount=sp.nat(1),
    )).run(sender=liquidator, level=32, now=sp.timestamp(3020), valid=False)
    scenario.verify(market.data.borrows[borrower.address].principal == 100)

    # The full CToken repayment path remains available during oracle failure.
    scenario += market.repayBorrow(sp.nat(1)).run(
        sender=borrower, level=32, now=sp.timestamp(3020))
    scenario.verify(market.data.borrows[borrower.address].principal == 99)

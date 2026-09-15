import smartpy as sp

OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")
TezFinOracle = sp.io.import_script_from_url(
    "file:contracts/TezFinOracle.py").TezFinOracle

# Fixed protocol/deployment parameters, pinned in TezFinBuild/deploy_result/deploy.shadownet.json
PYTH_CORE = "0x2880aB155794e7179c9eE2e38200202908C17B43"
PYTH_MAX_AGE_WORD = sp.bytes("0x" + (60).to_bytes(32, "big").hex())
BTC_FEED_ID = sp.bytes(
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43")
XTZ_FEED_ID = sp.bytes(
    "0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03")
USDT_FEED_ID = sp.bytes(
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b")


class View_consumer(sp.Contract):
    def __init__(self, contract):
        self.contract = contract
        self.init(resp=sp.none)

    @sp.entry_point
    def setAssetPrice(self, params):
        sp.set_type(params, OracleInterface.TSetPriceParam)
        pricePair = sp.compute(sp.snd(params))
        price = sp.compute(sp.snd(pricePair))
        resp = self.data.resp.open_some()
        sp.verify(resp == price, "PRICE_MISTMATCH")

    @sp.entry_point
    def getPrice(self, asset, resp):
        oracle_data = sp.compute(sp.view("getPrice", self.contract, asset+"-USD",
                                 t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some("invalid oracle view call"))
        price = sp.compute(sp.snd(oracle_data))
        sp.verify(resp == price, "PRICE_MISTMATCH")

    @sp.entry_point
    def comparePriceViews(self, asset):
        """
            Asserts getPrice and get_price_with_timestamp agree on the same (price, timestamp)
            for the same asset, just with the tuple order swapped
        """
        sp.set_type(asset, sp.TString)
        viaGetPrice = sp.compute(sp.view("getPrice", self.contract, asset,
                                 t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some("invalid oracle view call"))
        viaLegacyView = sp.compute(sp.view("get_price_with_timestamp", self.contract, asset,
                                   t=sp.TPair(sp.TNat, sp.TTimestamp)).open_some("invalid oracle view call"))
        sp.verify(sp.fst(viaGetPrice) == sp.snd(viaLegacyView), "TIMESTAMP_MISMATCH")
        sp.verify(sp.snd(viaGetPrice) == sp.fst(viaLegacyView), "PRICE_MISTMATCH")

    @sp.entry_point
    def verifyPrice(self, params):
        sp.set_type(params, sp.TRecord(asset=sp.TString, price=sp.TNat,
                                      timestamp=sp.TTimestamp))
        oracle_data = sp.view("getPrice", self.contract, params.asset,
                              t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some(
                                  "invalid oracle view call")
        sp.verify(sp.fst(oracle_data) == params.timestamp, "TIMESTAMP_MISMATCH")
        sp.verify(sp.snd(oracle_data) == params.price, "PRICE_MISTMATCH")

    @sp.entry_point
    def verifyValidatedPrice(self, params):
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, asset=sp.TString,
            previousPrice=sp.TNat, previousTimestamp=sp.TTimestamp,
            expectedPrice=sp.TNat))
        oracle_data = sp.view(
            "getValidatedPrice", self.contract,
            sp.record(comptroller=sp.self_address, cToken=params.cToken,
                      requestedAsset=params.asset,
                      previousPrice=params.previousPrice,
                      previousTimestamp=params.previousTimestamp),
            t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some(
                "invalid validated oracle view call")
        sp.verify(sp.snd(oracle_data) == params.expectedPrice,
                  "PRICE_MISTMATCH")


@sp.add_test(name="tezfin_oracle")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Tezfin Oracle")
    scenario.table_of_contents()
    # sp.test_account generates ED25519 key-pairs deterministically:
    admin = sp.test_account("Administrator")
    alice = sp.test_account("Alice")
    # Let's display the accounts:
    scenario.h2("Accounts")
    scenario.show([admin, alice])
    scenario.h2("Tezfin Oracle")
    tezfinOracle = TezFinOracle(admin.address, admin.address)
    scenario += tezfinOracle

    scenario.h2("Overrides / aliases (resolved before any Pyth lookup)")
    tezfinOracle.setPrice([sp.record(asset="ETHUSDT", price=13425)]
                         ).run(sender=alice, valid=False, now=sp.timestamp(16534534))
    tezfinOracle.setPrice([sp.record(asset="ETH-USD", price=13425), sp.record(
        asset="BTC-USD", price=2342354345)]).run(sender=admin, now=sp.timestamp(16534534))
    tezfinOracle.setPrice([sp.record(asset="FINUSDT", price=1000000)]
                         ).run(sender=admin, now=sp.timestamp(16534534))
    tezfinOracle.removeAsset("FIN-USD").run(sender=admin)
    tezfinOracle.addAlias([sp.record(
        asset="XTZ-USD", alias="WTZ-USD"), sp.record(
        asset="XTZ-USD", alias="RRXTZ-USD"), sp.record(asset="XTZ-USD", alias="oXTZ-USD")]).run(sender=admin, now=sp.timestamp(16534534))
    scenario.h2("Consumer Contract")
    consumer = View_consumer(tezfinOracle.address)
    scenario += consumer
    market = sp.address("KT10")
    tezfinOracle.configureMaxPriceAge(sp.int(300)).run(sender=consumer.address)
    tezfinOracle.configurePriceBounds(sp.record(
        cToken=market, minPrice=sp.nat(10000), maxPrice=sp.nat(20000),
        maxChangeBps=sp.nat(2000))).run(sender=consumer.address)
    scenario.h3("Verify override price")
    consumer.getPrice(asset="ETH", resp=13425)
    consumer.getPrice(asset="BTC", resp=2342354345)
    consumer.verifyPrice(asset="FINUSDT", price=1000000,
                        timestamp=sp.timestamp(16534534)).run(
                            now=sp.timestamp(16599999))
    consumer.verifyValidatedPrice(
        cToken=market, asset="ETH-USD", previousPrice=sp.nat(0),
        previousTimestamp=sp.timestamp(0), expectedPrice=sp.nat(13425)).run(
            now=sp.timestamp(16534534))
    consumer.verifyValidatedPrice(
        cToken=market, asset="ETH-USD", previousPrice=sp.nat(10000),
        previousTimestamp=sp.timestamp(16534534),
        expectedPrice=sp.nat(13425)).run(
            now=sp.timestamp(16534534), valid=False,
            exception="ASSET_PRICE_CHANGE_TOO_LARGE")
    consumer.verifyValidatedPrice(
        cToken=sp.address("KT11"), asset="ETH-USD",
        previousPrice=sp.nat(0), previousTimestamp=sp.timestamp(0),
        expectedPrice=sp.nat(13425)).run(
            now=sp.timestamp(16534534), valid=False,
            exception="PRICE_BOUNDS_NOT_CONFIGURED")

    scenario.h2("Pyth / NAC upstream lookup (getPrice Etap 2)")
    scenario.h3("Admin guard on Pyth configuration entrypoints")
    tezfinOracle.setPythCore(PYTH_CORE).run(
        sender=alice, valid=False, exception="NOT_ADMIN")
    tezfinOracle.setPythMaxAge(PYTH_MAX_AGE_WORD).run(
        sender=alice, valid=False, exception="NOT_ADMIN")
    tezfinOracle.setFeedIds([sp.record(asset="XTZ", feedId=XTZ_FEED_ID, targetDecimals=sp.nat(6))]
                           ).run(sender=alice, valid=False, exception="NOT_ADMIN")
    tezfinOracle.removeFeedId("XTZ").run(
        sender=alice, valid=False, exception="NOT_ADMIN")

    scenario.h3("Input validation on Pyth configuration entrypoints")
    tezfinOracle.setPythMaxAge(sp.bytes("0x00")).run(
        sender=admin, valid=False, exception="INVALID_PYTH_MAX_AGE_WORD")
    tezfinOracle.setPythMaxAge(sp.bytes("0x" + (0).to_bytes(32, "big").hex())).run(
        sender=admin, valid=False, exception="INVALID_PYTH_MAX_AGE_RANGE")
    tezfinOracle.setPythMaxAge(sp.bytes("0x" + (3601).to_bytes(32, "big").hex())).run(
        sender=admin, valid=False, exception="INVALID_PYTH_MAX_AGE_RANGE")
    tezfinOracle.setFeedIds([sp.record(asset="XTZ", feedId=sp.bytes("0x00"), targetDecimals=sp.nat(6))]
                           ).run(sender=admin, valid=False, exception="INVALID_PYTH_FEED_ID")
    tezfinOracle.setFeedIds([sp.record(asset="XTZ", feedId=XTZ_FEED_ID, targetDecimals=sp.nat(31))]
                           ).run(sender=admin, valid=False, exception="INVALID_TARGET_DECIMALS")

    scenario.h3("setPythCore rejects malformed EVM addresses")
    tezfinOracle.setPythCore("not-an-address").run(
        sender=admin, valid=False, exception="INVALID_PYTH_CORE_ADDRESS_LENGTH")
    tezfinOracle.setPythCore("0x" + "a" * 41).run(
        sender=admin, valid=False, exception="INVALID_PYTH_CORE_ADDRESS_LENGTH")
    tezfinOracle.setPythCore("00" + "a" * 40).run(
        sender=admin, valid=False, exception="INVALID_PYTH_CORE_ADDRESS_PREFIX")
    tezfinOracle.setPythCore("0x" + "g" * 40).run(
        sender=admin, valid=False, exception="INVALID_PYTH_CORE_ADDRESS_HEX")

    scenario.h3("getPrice fails closed before a feed id is pinned for the asset")
    consumer.getPrice(asset="XTZ", resp=0).run(
        valid=False, exception="UNSUPPORTED_PYTH_ASSET")

    scenario.h3("get_price_with_timestamp shares the same fail-closed asset lookup")
    consumer.comparePriceViews("XTZ-USD").run(
        valid=False, exception="UNSUPPORTED_PYTH_ASSET")

    scenario.h3("Pin Pyth core address and native feed ids")
    tezfinOracle.setFeedIds([
        sp.record(asset="BTC", feedId=BTC_FEED_ID, targetDecimals=sp.nat(8)),
        sp.record(asset="XTZ", feedId=XTZ_FEED_ID, targetDecimals=sp.nat(6)),
        sp.record(asset="USDT", feedId=USDT_FEED_ID, targetDecimals=sp.nat(6)),
    ]).run(sender=admin)

    scenario.h3("getPrice fails closed before the Pyth core address is configured")
    consumer.getPrice(asset="XTZ", resp=0).run(
        valid=False, exception="PYTH_CORE_NOT_CONFIGURED")

    tezfinOracle.setPythCore(PYTH_CORE).run(sender=admin)
    tezfinOracle.setPythMaxAge(PYTH_MAX_AGE_WORD).run(sender=admin)

    scenario.h3("getPrice reaches the NAC staticcall_evm view and fails closed there")
    # The SmartPy sandbox has no Etherlink gateway/Pyth Core contract at the pinned NAC
    # address, so the interpreter raises "Missing contract for view" instead of the
    # Michelson `None` that a real stale/reverting Pyth response would produce -- but in
    # both cases getPrice aborts instead of returning stale/previous data (fail-closed).
    consumer.getPrice(asset="XTZ", resp=0).run(valid=False)
    consumer.getPrice(asset="WTZ", resp=0).run(valid=False)
    consumer.getPrice(asset="OXTZ", resp=0).run(valid=False)
    consumer.getPrice(asset="RRXTZ", resp=0).run(valid=False)
    # L2 proxy assets resolve to native feeds before the NAC call:
    # tzBTC -> BTC and USDtz/USDt -> USDT. The sandbox has no gateway, so the
    # subsequent staticcall fails, but these must not fail as unsupported assets.
    consumer.getPrice(asset="tzBTC", resp=0).run(valid=False)
    consumer.getPrice(asset="USDtz", resp=0).run(valid=False)
    consumer.getPrice(asset="USDt", resp=0).run(valid=False)

    scenario.h3("get_price_with_timestamp reaches the same staticcall_evm and also fails closed")
    consumer.comparePriceViews("XTZ-USD").run(valid=False)
    consumer.comparePriceViews("WTZ-USD").run(valid=False)

    scenario.h3("Unpinned asset still fails closed with UNSUPPORTED_PYTH_ASSET")
    consumer.getPrice(asset="ETH2", resp=0).run(
        valid=False, exception="UNSUPPORTED_PYTH_ASSET")

    scenario.h3("get_price_with_timestamp agrees with getPrice for override assets")
    consumer.comparePriceViews("ETH-USD")
    consumer.comparePriceViews("BTC-USD")

    scenario.h3("removeFeedId reverts back to UNSUPPORTED_PYTH_ASSET")
    tezfinOracle.removeFeedId("USDT").run(sender=admin)
    consumer.getPrice(asset="USDT", resp=0).run(
        valid=False, exception="UNSUPPORTED_PYTH_ASSET")

    scenario.h2("Staged activation order")
    # originate -> setPythCore -> setPythMaxAge -> setFeedIds already ran above (global oracle
    # config); a fresh comptroller identity still needs its own configurePriceBounds and
    # configureMaxPriceAge before getValidatedPrice can serve a market.
    freshMarket = sp.address("KT1FreshMarket11111111111111111111111")
    freshConsumer = View_consumer(tezfinOracle.address)
    scenario += freshConsumer
    freshConsumer.verifyValidatedPrice(
        cToken=freshMarket, asset="XTZ-USD", previousPrice=sp.nat(0),
        previousTimestamp=sp.timestamp(0), expectedPrice=sp.nat(0)).run(
            valid=False, exception="PRICE_BOUNDS_NOT_CONFIGURED")
    tezfinOracle.configurePriceBounds(sp.record(
        cToken=freshMarket, minPrice=sp.nat(1), maxPrice=sp.nat(2**60),
        maxChangeBps=sp.nat(10000))).run(sender=freshConsumer.address)
    freshConsumer.verifyValidatedPrice(
        cToken=freshMarket, asset="XTZ-USD", previousPrice=sp.nat(0),
        previousTimestamp=sp.timestamp(0), expectedPrice=sp.nat(0)).run(
            valid=False, exception="MAX_PRICE_AGE_NOT_CONFIGURED")
    tezfinOracle.configureMaxPriceAge(sp.int(300)).run(sender=freshConsumer.address)
    # Bounds and max age are now configured; the only remaining failure is the actual Pyth
    # read (no gateway/Pyth Core in the sandbox), i.e. the market is ready to "enable" once a
    # real Pyth Core is reachable.
    freshConsumer.verifyValidatedPrice(
        cToken=freshMarket, asset="XTZ-USD", previousPrice=sp.nat(0),
        previousTimestamp=sp.timestamp(0), expectedPrice=sp.nat(0)).run(valid=False)


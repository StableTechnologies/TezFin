import smartpy as sp

OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")
TezFinOracle = sp.io.import_script_from_url(
    "file:contracts/TezFinOracle.py").TezFinOracle


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
    scenario.h2("Harbinger")
    harbinger = TezFinOracle(admin.address, admin.address)
    scenario += harbinger
    scenario.h2("Tezfin Oracle")
    tezfinOracle = TezFinOracle(admin.address, harbinger.address)
    scenario += tezfinOracle
    harbinger.setPrice([sp.record(asset="ETHUSDT", price=13425)]
                       ).run(sender=alice, valid=False, now=sp.timestamp(16534534))
    harbinger.setPrice([sp.record(asset="ETHUSDT", price=13425), sp.record(
        asset="BTCUSDT", price=2342354345)]).run(sender=admin, now=sp.timestamp(16534534))
    harbinger.setPrice([sp.record(asset="XTZUSDT", price=203434)]
                       ).run(sender=admin, now=sp.timestamp(16534534))
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
    scenario.h3("Verify Price")
    consumer.getPrice(asset="ETH", resp=13425)
    consumer.getPrice(asset="BTC", resp=2342354345)
    consumer.getPrice(asset="XTZ", resp=203434)
    consumer.getPrice(asset="WTZ", resp=203434)
    consumer.getPrice(asset="OXTZ", resp=203434)
    consumer.getPrice(asset="RRXTZ", resp=203434)
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
    consumer.getPrice(asset="USD", resp=1000000).run(valid=False)
    consumer.getPrice(asset="XTZ", resp=43000000).run(valid=False)
    consumer.getPrice(asset="ETH", resp=13425)
    consumer.getPrice(asset="BTC", resp=2342354345)
    consumer.getPrice(asset="XTZ", resp=203434)
    consumer.getPrice(asset="USD", resp=1000000).run(valid=False)
    consumer.getPrice(asset="XTZ", resp=43000000).run(valid=False)

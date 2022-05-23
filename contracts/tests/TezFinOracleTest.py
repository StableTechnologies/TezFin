import smartpy as sp

OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")
TezFinOracle = sp.io.import_script_from_url("file:contracts/TezFinOracle.py").TezFinOracle

class View_consumer(sp.Contract):
    def __init__(self, contract):
        self.contract = contract
        self.init(resp = sp.none)

    @sp.entry_point
    def get(self, asset, resp):
        self.data.resp = sp.some(resp)
        handle = sp.contract(OracleInterface.TGetPriceParam, self.contract, entry_point="get").open_some()
        priceParams = (asset + "-USD", sp.self_entry_point("setAssetPrice"))
        sp.transfer(priceParams, sp.mutez(0), handle)

    @sp.entry_point
    def setAssetPrice(self, params):
        sp.set_type(params, OracleInterface.TSetPriceParam)
        pricePair = sp.compute(sp.snd(params))
        price = sp.compute(sp.snd(pricePair))
        resp = self.data.resp.open_some()
        sp.verify(resp==price, "PRICE_MISTMATCH")

    @sp.entry_point
    def getPrice(self, asset, resp):
        oracle_data = sp.compute(sp.view("getPrice", self.contract, asset+"-USD", t = sp.TPair(sp.TTimestamp,sp.TNat)).open_some("invalid oracle view call"))
        price = sp.compute(sp.snd(oracle_data))
        sp.verify(resp==price,"PRICE_MISTMATCH")

@sp.add_test(name = "tezfin_oracle")
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
    harbinger = TezFinOracle(admin.address,admin.address)
    scenario+=harbinger
    scenario.h2("Tezfin Oracle")
    tezfinOracle = TezFinOracle(admin.address,harbinger.address)
    scenario+=tezfinOracle
    harbinger.setPrice([sp.record(asset="ETH-USD",price=13425)]).run(sender=alice,valid=False,now=sp.timestamp(16534534))
    harbinger.setPrice([sp.record(asset="ETH-USD",price=13425)]).run(sender=admin,now=sp.timestamp(16534534))
    harbinger.setPrice([sp.record(asset="BTC-USD",price=2342354345)]).run(sender=admin,now=sp.timestamp(16534534))
    harbinger.setPrice([sp.record(asset="XTZ-USD",price=203434)]).run(sender=admin,now=sp.timestamp(16534534))
    tezfinOracle.setPrice([sp.record(asset="FIN-USD",price=1000000)]).run(sender=admin,now=sp.timestamp(16534534))
    tezfinOracle.removeAsset("FIN-USD").run(sender=admin)
    scenario.h2("Consumer Contract")
    consumer = View_consumer(tezfinOracle.address)
    scenario += consumer
    scenario.h3("Verify Price")
    consumer.get(asset="ETH",resp=13425)
    consumer.get(asset="BTC",resp=2342354345)
    consumer.get(asset="XTZ",resp=203434)
    consumer.get(asset="USD",resp=1000000)
    consumer.get(asset="USD",resp=43000000).run(valid=False)
    consumer.get(asset="XTZ",resp=43000000).run(valid=False)
    consumer.getPrice(asset="ETH",resp=13425)
    consumer.getPrice(asset="BTC",resp=2342354345)
    consumer.getPrice(asset="XTZ",resp=203434)
    consumer.getPrice(asset="USD",resp=1000000)
    consumer.getPrice(asset="USD",resp=43000000).run(valid=False)
    consumer.getPrice(asset="XTZ",resp=43000000).run(valid=False)
    
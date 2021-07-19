import smartpy as sp

OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")

class PriceOracle(OracleInterface.OracleInterface):
    def __init__(self, **extra_storage):
        self.init(prices = sp.map(tkey = sp.TString, tvalue = sp.TNat), **extra_storage)
        
    @sp.entry_point
    def setPrice(self, params):
        sp.set_type(params, sp.TRecord(asset = sp.TString, price = sp.TNat))
        self.data.prices[params.asset] = params.price
        
    @sp.entry_point
    def get(self, requestPair):
        sp.set_type(requestPair, OracleInterface.TGetPriceParam)

        requestedAsset = sp.compute(sp.fst(requestPair))
        callback = sp.compute(sp.snd(requestPair))

        price = sp.local('price', sp.nat(0))
        sp.if self.data.prices.contains(requestedAsset):
            price.value = self.data.prices[requestedAsset]
        
        callbackParam = (requestedAsset, (sp.timestamp(0), price.value))
        sp.transfer(callbackParam, sp.mutez(0), callback)


def compile():
    if "templates" not in __name__:
        sp.add_compilation_target("PriceOracle", PriceOracle(contractName = sp.string("PriceOracle")))

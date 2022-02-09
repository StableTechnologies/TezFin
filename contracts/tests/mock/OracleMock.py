import smartpy as sp

OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")

class OracleMock(OracleInterface.OracleInterface):
    def __init__(self):
        self.init(price = sp.nat(0))
        
    @sp.entry_point
    def setPrice(self, price):
        sp.set_type(price, sp.TNat)
        self.data.price = price
        
    @sp.entry_point
    def get(self, requestPair):
        sp.set_type(requestPair, OracleInterface.TGetPriceParam)

        # Destructure the arguments.
        requestedAsset = sp.compute(sp.fst(requestPair))
        callback = sp.compute(sp.snd(requestPair))
        
        callbackParam = (requestedAsset, (sp.timestamp(0), self.data.price))
        sp.transfer(callbackParam, sp.mutez(0), callback)

    @sp.onchain_view()
    def getPrice(self, assetCode):
        sp.set_type(assetCode, sp.TString)
        sp.result((sp.timestamp(0), self.data.price))

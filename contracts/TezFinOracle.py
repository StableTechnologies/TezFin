import smartpy as sp
import time

OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")

class TezFinOracle(OracleInterface.OracleInterface):
    def __init__(self, admin, oracle):
        self.init(
            overrides = sp.big_map(l={"USD-USD":(sp.timestamp(int(time.time())),sp.as_nat(1000000))},tkey=sp.TString, tvalue=sp.TPair(sp.TTimestamp, sp.TNat)),
            oracle = oracle,
            admin = admin
        )

    def is_admin(self, address):
        return address == self.data.admin

    @sp.entry_point
    def set_oracle(self, address):
        sp.set_type(address, sp.TAddress)
        sp.verify(self.is_admin(sp.sender), message = "NOT_ADMIN")
        self.data.oracle = address

    @sp.entry_point
    def set_admin(self, address):
        sp.set_type(address, sp.TAddress)
        sp.verify(self.is_admin(sp.sender), message = "NOT_ADMIN")
        self.data.admin = address

    @sp.entry_point
    def setPrice(self, asset, price):
        sp.verify(self.is_admin(sp.sender), message = "NOT_ADMIN")
        self.data.overrides[asset] = (sp.now, price)
        
    @sp.entry_point
    def get(self, requestPair):
        sp.set_type(requestPair, OracleInterface.TGetPriceParam)

        # Destructure the arguments.
        requestedAsset = sp.compute(sp.fst(requestPair))
        callback = sp.compute(sp.snd(requestPair))
        
        sp.if self.data.overrides.contains(requestedAsset):
            callbackParam = (requestedAsset, self.data.overrides[requestedAsset])
            sp.transfer(callbackParam, sp.mutez(0), callback)
        sp.else:
            oracle_data = sp.view("getPrice", self.data.oracle, requestedAsset, t = sp.TPair(sp.TTimestamp,sp.TNat)).open_some("invalid oracle view call")
            callbackParam = (requestedAsset, oracle_data)
            sp.transfer(callbackParam, sp.mutez(0), callback)

    @sp.onchain_view()
    def getPrice(self, requestedAsset):
        sp.set_type(requestedAsset, sp.TString)
        sp.if self.data.overrides.contains(requestedAsset):
            sp.result(self.data.overrides[requestedAsset])
        sp.else:
            oracle_data = sp.view("getPrice", self.data.oracle, requestedAsset, t = sp.TPair(sp.TTimestamp,sp.TNat)).open_some("invalid oracle view call")
            sp.result(oracle_data)
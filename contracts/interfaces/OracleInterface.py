# Price oracle intraface
# Describes interface of price oracle supported by Comptroller
# Assuming that price oracle is implemented by third party

import smartpy as sp

TSetPriceParam = sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat))
TGetPriceParam = sp.TPair(sp.TString, sp.TContract(TSetPriceParam))


class OracleInterface(sp.Contract):
    @sp.entry_point
    def get(self, requestPair):
        pass

    @sp.onchain_view()
    def getPrice(self, requestedAsset):
        pass

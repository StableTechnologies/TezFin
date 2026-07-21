# Price oracle intraface
# Describes interface of price oracle supported by Comptroller
# Assuming that price oracle is implemented by third party

import smartpy as sp

TSetPriceParam = sp.TPair(sp.TString, sp.TPair(sp.TTimestamp, sp.TNat))
TGetPriceParam = sp.TPair(sp.TString, sp.TContract(TSetPriceParam))
TPriceBounds = sp.TRecord(cToken=sp.TAddress, minPrice=sp.TNat,
                          maxPrice=sp.TNat, maxChangeBps=sp.TNat)
TValidatedPriceRequest = sp.TRecord(
    comptroller=sp.TAddress,
    cToken=sp.TAddress,
    requestedAsset=sp.TString,
    previousPrice=sp.TNat,
    previousTimestamp=sp.TTimestamp)


class OracleInterface(sp.Contract):
    @sp.onchain_view()
    def getPrice(self, requestedAsset):
        pass

    @sp.onchain_view()
    def getValidatedPrice(self, params):
        pass

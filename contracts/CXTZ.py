import smartpy as sp

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")

"""
    CXTZ: CToken that wraps XTZ 
"""
class CXTZ(CToken.CToken):
    def __init__(self, comptroller_, interestRateModel_, administrator_):
        decimalsUnderlying = sp.nat(int(1e6))
        initialExchangeRateMantissa = sp.nat(int(1e18))
        CToken.CToken.__init__(self, decimalsUnderlying, comptroller_, interestRateModel_, initialExchangeRateMantissa, administrator_)

    def getCashImpl(self):
        # TODO: test in regards to https://forum.tezosagora.org/t/problems-with-balance/2194/3
        return sp.utils.mutez_to_nat(sp.balance)

    def doTransferOut(self, to_, amount):
        sp.send(to_, sp.utils.nat_to_mutez(amount))

    def doTransferIn(self, from_, amount):
        sp.verify(sp.utils.mutez_to_nat(sp.amount) == amount)

    def getMintTokens(self, mintAmount):
        return self.getActualAmount(mintAmount, True, mintAmount) # add adjustment by mintAmount due to balance being updated from the start of transaction

    def verifySweepMutez(self):
        sp.verify(False, "Mutez sweep is not allowed for CXTZ")

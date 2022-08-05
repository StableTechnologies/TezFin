import smartpy as sp

CTErrors = sp.io.import_script_from_url(
    "file:contracts/errors/CTokenErrors.py")
EC = CTErrors.ErrorCodes

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")

"""
    CXTZ: CToken that wraps XTZ 
"""


class CXTZ(CToken.CToken):
    def __init__(self, scale_, scaleUnderlying_, comptroller_, interestRateModel_, administrator_):
        initialExchangeRateMantissa = sp.nat(int(1e18))
        CToken.CToken.__init__(self, scale_, scaleUnderlying_, comptroller_, interestRateModel_,
                               initialExchangeRateMantissa, administrator_)

    def getCashImpl(self):
        # TODO: test in regards to https://forum.tezosagora.org/t/problems-with-balance/2194/3
        return sp.utils.mutez_to_nat(sp.balance)

    def doTransferOut(self, to_, amount, isContract=False):
        sp.if isContract:
            sp.transfer(sp.unit, sp.utils.nat_to_mutez(amount), sp.contract(
                sp.TUnit, to_, "receive").open_some(message="bad contract destination"))
        sp.else:
            sp.send(to_, sp.utils.nat_to_mutez(amount))

    def doTransferIn(self, from_, amount):
        sp.if sp.utils.mutez_to_nat(sp.amount) > amount:
            sp.send(from_, sp.utils.nat_to_mutez(sp.as_nat(sp.utils.mutez_to_nat(sp.amount) - amount)))
        sp.else:
            sp.verify(sp.utils.mutez_to_nat(sp.amount)
                    == amount, EC.CT_INVALID_MUTEZ)

    def getMintTokens(self, mintAmount):
        # add adjustment by mintAmount due to balance being updated from the start of transaction
        return self.getActualAmount(mintAmount, True, mintAmount)

    def verifySweepMutez(self):
        sp.verify(False, EC.CT_SWEEP_XTZ)

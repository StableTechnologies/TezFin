import smartpy as sp

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")


class CFA12(CToken.CToken):
    def __init__(self, decimalsUnderlying_, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, fa1_2_TokenAddress_, **extra_storage):
        CToken.CToken.__init__(self,
                               decimalsUnderlying_,
                               comptroller_, 
                               interestRateModel_,
                               initialExchangeRateMantissa_, 
                               administrator_,
                               fa1_2_TokenAddress = fa1_2_TokenAddress_,
                               currentCash = sp.nat(0),
                               **extra_storage)

    def getCashImpl(self):
        return self.data.currentCash

    def updateCash(self):
        cashSum = sp.compute(self.data.currentCash + self.data.totalSupply)
        sp.if cashSum > 0: # prevent transaction failing if CToken is not listed in underlying fa12 yet
            self.activateOp(CToken.OP.CTokenOperations.GET_CASH)
            handle = sp.contract(sp.TPair(sp.TAddress, sp.TContract(sp.TNat)), self.data.fa1_2_TokenAddress, "getBalance").open_some()
            sp.transfer(sp.pair(sp.self_address, sp.self_entry_point("setCash")), sp.mutez(0), handle)

    @sp.entry_point
    def setCash(self, value):
        sp.set_type(value, sp.TNat)
        self.verifyAndFinishActiveOp(CToken.OP.CTokenOperations.GET_CASH)
        sp.verify(sp.sender == self.data.fa1_2_TokenAddress, "Only underlying token can set cash")
        self.data.currentCash = value

    def doTransferIn(self, from_, amount):
        self.transferFA12(from_, sp.self_address, amount, self.data.fa1_2_TokenAddress)

    def doTransferOut(self, to_, amount):
        self.transferFA12(sp.self_address, to_, amount, self.data.fa1_2_TokenAddress)

    def verifySweepFA12(self, tokenAddress):
        sp.verify(tokenAddress != self.data.fa1_2_TokenAddress, "Sweep is not allowed for the underlying token")

import smartpy as sp

CTErrors = sp.io.import_script_from_url(
    "file:contracts/errors/CTokenErrors.py")
EC = CTErrors.ErrorCodes

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")

TSetCashParams = sp.TList(
    sp.TRecord(
        balance=sp.TNat,
        request=sp.TRecord(
            owner=sp.TAddress,
            token_id=sp.TNat
        ).layout(("owner", "token_id"))
    ).layout(("request", "balance"))
)
TBalanceOfParams = sp.TRecord(
    callback=sp.TContract(TSetCashParams),
    requests=sp.TList(
        sp.TRecord(
            owner=sp.TAddress,
            token_id=sp.TNat
        ).layout(("owner", "token_id"))
    )
).layout(("requests", "callback"))


class CFA2(CToken.CToken):
    def __init__(self, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, metadata_, token_metadata_, fa2_TokenAddress_, tokenId_, **extra_storage):
        CToken.CToken.__init__(self,
                               comptroller_,
                               interestRateModel_,
                               initialExchangeRateMantissa_,
                               administrator_,
                               metadata_,
                               token_metadata_,
                               fa2_TokenAddress=fa2_TokenAddress_,
                               tokenId=tokenId_,
                               currentCash=sp.nat(0),
                               **extra_storage)

    def getCashImpl(self):
        return self.data.currentCash

    def updateCash(self):
        cashSum = sp.compute(self.data.currentCash +
                             self.data.totalSupply + self.data.totalReserves)
        # prevent transaction failing if CToken is not listed in underlying fa2 yet
        with sp.if_(cashSum > 0):
            self.activateOp(CToken.OP.CTokenOperations.GET_CASH)
            handle = sp.contract(
                TBalanceOfParams, self.data.fa2_TokenAddress, "balance_of").open_some()
            data = sp.record(
                callback=sp.self_entry_point("setCash"),
                requests=sp.list([
                    sp.record(owner=sp.self_address,
                              token_id=self.data.tokenId)
                ])
            )
            sp.transfer(data, sp.mutez(0), handle)

    @sp.entry_point(lazify=True)
    def setCash(self, params):
        sp.set_type(params, TSetCashParams)
        self.verifyAndFinishActiveOp(CToken.OP.CTokenOperations.GET_CASH)
        sp.verify(sp.sender == self.data.fa2_TokenAddress,
                  EC.CT_INVALID_CASH_SENDER)
        sp.verify(sp.len(params) == 1, EC.CT_INVALID_CASH_DATA)
        sp.for cash in params:
            sp.verify(cash.request.token_id ==
                      self.data.tokenId, EC.CT_INVALID_CASH_DATA)
            sp.verify(cash.request.owner == sp.self_address,
                      EC.CT_INVALID_CASH_DATA)
            self.data.currentCash = cash.balance

    def doTransferIn(self, from_, amount):
        self.transferFA2(from_, sp.self_address, amount,
                         self.data.fa2_TokenAddress, self.data.tokenId)

    def doTransferOut(self, to_, amount, isContract=False):
        self.transferFA2(sp.self_address, to_, amount,
                         self.data.fa2_TokenAddress, self.data.tokenId)

    def verifySweepFA2(self, tokenAddress, id):
        isNotUnderlying = (tokenAddress != self.data.fa2_TokenAddress) | (
            id != self.data.tokenId)
        sp.verify(isNotUnderlying, EC.CT_SWEEP_UNDERLYING)

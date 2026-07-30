import smartpy as sp

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")

class CTokenMock(sp.Contract):
    def __init__(self, test_account_snapshot_):
        self.init(test_account_snapshot = test_account_snapshot_,
                  snapshot_available=sp.bool(True), comptroller=sp.address("KT10"),
                  totalSupplyUnderlying=sp.nat(0), totalBorrows=sp.nat(0))

    @sp.entry_point
    def setAccountSnapshot(self, params):
        sp.set_type(params, CTI.TAccountSnapshot)
        self.data.test_account_snapshot = params

    @sp.entry_point
    def setSnapshotAvailable(self, params):
        sp.set_type(params, sp.TBool)
        self.data.snapshot_available = params

    @sp.entry_point
    def setMarketTotals(self, params):
        sp.set_type(params, sp.TRecord(supply=sp.TNat, borrows=sp.TNat))
        self.data.totalSupplyUnderlying = params.supply
        self.data.totalBorrows = params.borrows

    @sp.utils.view(CTI.TAccountSnapshot)
    def getAccountSnapshot(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(self.data.test_account_snapshot)

    @sp.onchain_view()
    def getAccountSnapshotView(self, account):
        sp.set_type(account, sp.TAddress)
        sp.if self.data.snapshot_available:
            sp.result(sp.some(self.data.test_account_snapshot))
        sp.else:
            sp.result(sp.none)

    @sp.entry_point
    def accrueInterest(self, params):
        sp.set_type(params, sp.TUnit)

    @sp.onchain_view()
    def marketTotals(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(sp.pair(self.data.totalSupplyUnderlying,
                          self.data.totalBorrows))

    @sp.entry_point
    def setComptroller(self, params):
        sp.set_type(params, sp.TAddress)
        self.data.comptroller = params

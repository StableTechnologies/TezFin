import smartpy as sp

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")

class CTokenMock(sp.Contract):
    def __init__(self, test_account_snapshot_, accrualBlockNumber_=0, borrowBalance_=0):
        self.init(
            test_account_snapshot=test_account_snapshot_,
            comptroller=sp.address("KT10"),
            accrualBlockNumber=sp.nat(accrualBlockNumber_),
            borrowBalance=sp.nat(borrowBalance_),
        )

    @sp.entry_point
    def setAccountSnapshot(self, params):
        sp.set_type(params, CTI.TAccountSnapshot)
        self.data.test_account_snapshot = params

    @sp.entry_point
    def setAccrualBlockNumber(self, level):
        sp.set_type(level, sp.TNat)
        self.data.accrualBlockNumber = level

    @sp.entry_point
    def setBorrowBalance(self, balance):
        sp.set_type(balance, sp.TNat)
        self.data.borrowBalance = balance

    @sp.utils.view(CTI.TAccountSnapshot)
    def getAccountSnapshot(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(self.data.test_account_snapshot)

    @sp.onchain_view()
    def getAccountSnapshotView(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(sp.some(self.data.test_account_snapshot))

    @sp.onchain_view()
    def accrualBlockNumber(self, unused):
        sp.set_type(unused, sp.TUnit)
        sp.result(self.data.accrualBlockNumber)

    @sp.onchain_view()
    def borrowBalanceStoredView(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(sp.pair(self.data.borrowBalance, self.data.accrualBlockNumber))

    @sp.onchain_view()
    def comptroller(self, unused):
        sp.set_type(unused, sp.TUnit)
        sp.result(self.data.comptroller)

    @sp.entry_point
    def accrueInterest(self, params):
        sp.set_type(params, sp.TUnit)

    @sp.entry_point
    def setComptroller(self, params):
        sp.set_type(params, sp.TAddress)
        self.data.comptroller = params

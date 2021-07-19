import smartpy as sp

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")

class CTokenMock(sp.Contract):
    def __init__(self, test_account_snapshot_):
        self.init(test_account_snapshot = test_account_snapshot_, comptroller=sp.address("KT10"))

    @sp.entry_point
    def setAccountSnapshot(self, params):
        sp.set_type(params, CTI.TAccountSnapshot)
        self.data.test_account_snapshot = params

    @sp.utils.view(CTI.TAccountSnapshot)
    def getAccountSnapshot(self, account):
        sp.set_type(account, sp.TAddress)
        sp.result(self.data.test_account_snapshot)

    @sp.entry_point
    def accrueInterest(self, params):
        sp.set_type(params, sp.TUnit)

    @sp.entry_point
    def setComptroller(self, params):
        sp.set_type(params, sp.TAddress)
        self.data.comptroller = params

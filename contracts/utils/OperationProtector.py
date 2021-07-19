import smartpy as sp

OPErrors = sp.io.import_script_from_url("file:contracts/errors/OperationProtectorErrors.py")
EC = OPErrors.ErrorCodes

class CTokenOperations:
    GENERIC = sp.nat(0)
    MINT = sp.nat(1)
    REDEEM = sp.nat(2)
    BORROW = sp.nat(3)
    REPAY = sp.nat(4)
    LIQUIDATE = sp.nat(5)
    BORROW_RATE = sp.nat(6)
    SUPPLY_RATE = sp.nat(7)
    ACCRUE = sp.nat(8)
    INTEREST_MODEL = sp.nat(9)
    RESERVE_FACTOR = sp.nat(10)
    ADD_RESERVES = sp.nat(11)
    REDUCE_RESERVES = sp.nat(12)
    GET_CASH = sp.nat(13)
    TRANSFER = sp.nat(14)

class ComptrollerOperations:
    GENERIC = sp.nat(0)
    EXIT_MARKET = sp.nat(1)
    UPDATE_PRICE = sp.nat(2)
    GET_LIQUIDITY = sp.nat(3)

class OperationProtector(sp.Contract):
    def activateNewOp(self, op):
        self.verifyNoActiveOp()
        self.activateOp(op)

    def verifyNoActiveOp(self):
        sp.verify(sp.len(self.data.activeOperations) == 0, EC.OP_IN_PROGRESS)

    def verifyActiveOp(self, op):
        sp.verify(self.data.activeOperations.contains(op), EC.OP_NOT_ACTIVE)

    def activateOp(self, op):
        self.data.activeOperations.add(op)

    def finishOp(self, op):
        self.data.activeOperations.remove(op)

    def verifyAndFinishActiveOp(self, op):
        self.verifyActiveOp(op)
        self.finishOp(op)

    @sp.entry_point(lazify = True)
    def hardResetOp(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyAdministrator()
        self.data.activeOperations = sp.set([])

    def verifyAdministrator(self): # override
        pass

import smartpy as sp

IRMInterface = sp.io.import_script_from_url("file:contracts/interfaces/InterestRateModelInterface.py")


class InterestRateModelMock(IRMInterface.InterestRateModelInterface):
    def __init__(self, borrowRate_, supplyRate_, **extra_storage):
        self.init(
            borrowRate=borrowRate_, 
            supplyRate=supplyRate_,
            **extra_storage
        )

    @sp.entry_point
    def getBorrowRate(self, params):
        sp.set_type(params, IRMInterface.TBorrowRateParams)
        sp.transfer(self.data.borrowRate, sp.mutez(0), params.cb)

    @sp.entry_point
    def getSupplyRate(self, params):
        sp.set_type(params, IRMInterface.TBorrowRateParams)
        sp.transfer(self.data.supplyRate, sp.mutez(0), params.cb)

    @sp.entry_point
    def setBorrowRate(self, params):
        sp.set_type(params, sp.TNat)
        self.data.borrowRate = params

    @sp.entry_point
    def setSupplyRate(self, params):
        sp.set_type(params, sp.TNat)
        self.data.supplyRate = params

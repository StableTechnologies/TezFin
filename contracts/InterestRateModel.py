import smartpy as sp

IRMErrors = sp.io.import_script_from_url("file:contracts/errors/InterestRateModelErrors.py")
EC = IRMErrors.ErrorCodes

IRMInterface = sp.io.import_script_from_url("file:contracts/interfaces/InterestRateModelInterface.py")


class InterestRateModel(IRMInterface.InterestRateModelInterface):
    def __init__(self, multiplierPerBlock_, baseRatePerBlock_,scale_, **extra_storage):
        self.init(
            scale=scale_, #must match order of reserveFactorMantissa
            multiplierPerBlock=multiplierPerBlock_, # The multiplier of utilization rate that gives the slope of the interest rate
            baseRatePerBlock=baseRatePerBlock_, # The base interest rate which is the y-intercept when utilization rate is 0
            **extra_storage
        )


    """    
        Calculates the current borrow interest rate per block

        params: TBorrowRateParams

        return: The borrow rate per block (as a percentage)
    """
    @sp.entry_point
    def getBorrowRate(self, params):
        sp.set_type(params, IRMInterface.TBorrowRateParams)
        utRate = self.utilizationRate(params.cash, params.borrows, params.reserves)
        result = self.calculateBorrowRate(utRate)
        sp.transfer(result, sp.mutez(0), params.cb)

    """ 
        Calculates the current supply interest rate per block

        params: TSupplyRateParams

        return: The supply rate per block (as a percentage)
    """
    @sp.entry_point
    def getSupplyRate(self, params):
        sp.set_type(params, IRMInterface.TSupplyRateParams)
        oneMinusReserveFactor = sp.as_nat(self.data.scale - params.reserveFactorMantissa)
        utRate = self.utilizationRate(params.cash, params.borrows, params.reserves)
        borrowRate = self.calculateBorrowRate(utRate)
        rateToPool = borrowRate * oneMinusReserveFactor // self.data.scale
        result = utRate * rateToPool // self.data.scale
        sp.transfer(result, sp.mutez(0), params.cb)


    def utilizationRate(self, cash, borrows, reserves):
        ur = sp.local('ur', sp.nat(0))
        sp.if borrows > sp.nat(0):
            divisor = sp.compute(sp.as_nat(cash + borrows - reserves))
            sp.verify(divisor > 0, EC.IRM_INSUFFICIENT_CASH)
            ur.value = borrows * self.data.scale // divisor
        return ur.value


    def calculateBorrowRate(self, utRate):
        return sp.compute(utRate * self.data.multiplierPerBlock // self.data.scale + self.data.baseRatePerBlock)

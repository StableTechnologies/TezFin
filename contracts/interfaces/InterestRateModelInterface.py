# InterestRateModel Interface
# Calculates borrow and supply rate per block for CToken instance

import smartpy as sp


TCallback = sp.TContract(sp.TNat)

"""
TBorrowRateParams:
    cash: The total amount of cash the market has
    borrows: The total amount of borrows the market has outstanding
    reserves: The total amount of reserves the market has
"""
TBorrowRateParams = sp.TRecord(
    cash=sp.TNat, borrows=sp.TNat, reserves=sp.TNat, cb=TCallback)

"""
TSupplyRateParams:
    cash: The total amount of cash the market has
    borrows: The total amount of borrows the market has outstanding
    reserves: The total amount of reserves the market has
    reserveFactorMantissa: The current reserve factor the market has
"""
TSupplyRateParams = sp.TRecord(cash=sp.TNat, borrows=sp.TNat,
                               reserves=sp.TNat, reserveFactorMantissa=sp.TNat, cb=TCallback)


class InterestRateModelInterface(sp.Contract):

    """    
        Calculates the current borrow interest rate per block

        params: TBorrowRateParams

        return: The borrow rate per block (as a percentage)
    """
    @sp.entry_point
    def getBorrowRate(self, params):
        pass

    """ 
        Calculates the current supply interest rate per block

        params: TSupplyRateParams

        return: The supply rate per block (as a percentage)
    """
    @sp.entry_point
    def getSupplyRate(self, params):
        pass
    
    
    """ 
        changes admin of interest rate model contract

        params: new admin

        return: nothing
    """
    
    @sp.entry_point
    def updateAdmin(self, newAdmin):
        sp.set_type(newAdmin, sp.TAddress)
        pass

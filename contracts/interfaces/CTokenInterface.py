# CToken Interface
# Money market of underlying asset. Can be treated as FA1.2 token

import smartpy as sp


"""
TBorrowSnapshot: Container for borrow balance information
    principal: Total balance (with accrued interest), after applying the most recent balance-changing action
    interestIndex: Global borrowIndex as of the most recent balance-changing action
"""
TBorrowSnapshot = sp.TRecord(principal=sp.TNat, interestIndex=sp.TNat)

"""
TAccountSnapshot: Container for account balance information
    cTokenBalance: Token balance of the account
    borrowBalance: Borrow balance of the account
    exchangeRateMantissa: Exchange rate mantissa
"""
TAccountSnapshot = sp.TRecord(cTokenBalance=sp.TNat, borrowBalance=sp.TNat, exchangeRateMantissa=sp.TNat)

class CTokenInterface(sp.Contract):

    """    
        Sender supplies assets into the market and receives cTokens in exchange

        dev: Accrues interest if the operation succeeds, unless reverted

        params: TNat - The amount of the underlying asset to supply
    """
    @sp.entry_point
    def mint(self, params):
        pass
    

    """    
        Sender redeems cTokens in exchange for the underlying asset

        dev: Accrues interest if the operation succeeds, unless reverted

        params: TNat - The number of cTokens to redeem into underlying
    """
    @sp.entry_point
    def redeem(self, params):
        pass
    

    """    
        Sender redeems cTokens in exchange for a specified amount of underlying asset

        dev: Accrues interest if the operation succeeds, unless reverted

        params: TNat - The amount of underlying to redeem
    """
    @sp.entry_point
    def redeemUnderlying(self, params):
        pass
    

    """    
        Sender borrows assets from the protocol to their own address

        params: TNat - The amount of the underlying asset to borrow
    """
    @sp.entry_point
    def borrow(self, params):
        pass
    

    """    
        Sender repays their own borrow

        params: TNat - The amount to repay
    """
    @sp.entry_point
    def repayBorrow(self, params):
        pass
    

    """    
        Sender repays a borrow belonging to borrower

        params: TRecord
            borrower: TAddress - The account with the debt being payed off
            repayAmount: TNat - The amount to repa
    """
    @sp.entry_point
    def repayBorrowBehalf(self, params):
        pass
    

    """    
        The sender liquidates the borrowers collateral.
        The collateral seized is transferred to the liquidator.

        params: TRecord
            borrower: TAddress - The borrower of this cToken to be liquidated
            cTokenCollateral: TAddress - Contract address of the market in which to seize collateral from the borrower
            repayAmount: TNat - The amount of the underlying borrowed asset to repay
    """
    @sp.entry_point
    def liquidateBorrow(self, params):
        pass


    """    
        Transfer `value` tokens from `from_` to `to_`

        params: TRecord
            from_: TAddress - The address of the source account
            to_: TAddress - The address of the destination account
            value: TNat - The number of tokens to transfer
    """
    @sp.entry_point
    def transfer(self, params):
        pass


    """    
        Approve `spender` to transfer up to `amount` from `sp.sender`

        params: TRecord
            spender: TAddress - The address of the account which may transfer tokens
            value: TNat - The number of tokens that are approved
    """
    @sp.entry_point
    def approve(self, params):
        pass


    """    
        Get the current allowance from `owner` for `spender`

        params: TRecord
            owner: TAddress - The address of the account which owns the tokens to be spent
            spender: TAddress - The address of the account which may transfer tokens

        return: The number of tokens allowed to be spent
    """
    @sp.utils.view(sp.TNat)
    def getAllowance(self, params):
        pass


    """    
        Get the CToken balance of the account specified in `params`

        params: TAddress - The address of the account to query

        return: The number of tokens owned by `params`
    """
    @sp.utils.view(sp.TNat)
    def getBalance(self, params):
        pass


    """    
        Get the underlying balance of the account specified in `params`

        dev: This function does not accrue interest before calculating the balance
        dev: Do accrueInterest() before this function to get the up-to-date balance

        params: TAddress - The address of the account to query

        return: The amount of underlying owned by `params`
    """
    @sp.utils.view(sp.TNat)
    def getBalanceOfUnderlying(self, params):
        pass


    """    
        Get total supply of the CToken

        params: TUnit

        return: The total supply of the CToken
    """
    @sp.utils.view(sp.TNat)
    def getTotalSupply(self, params):
        pass


    """    
        Get a snapshot of the account's balances, and the cached exchange rate

        dev: This is used by comptroller to more efficiently perform liquidity checks.

        params: TAddress - The address of the account to snapshot

        return: TAccountSnapshot - account balance information
    """
    @sp.utils.view(TAccountSnapshot)
    def getAccountSnapshot(self, params):
        pass


    """    
        Updates storage value of the current per-block borrow interest rate for this cToken, scaled by 1e18

        params: TUnit
    """
    @sp.entry_point
    def updateBorrowRatePerBlock(self, params):
        pass


    """    
        Updates storage value of the current per-block supply interest rate for this cToken, scaled by 1e18

        params: TUnit
    """
    @sp.entry_point
    def updateSupplyRatePerBlock(self, params):
        pass


    """    
        Return the borrow balance of account based on stored data

        params: TAddress - The address whose balance should be calculated

        return: The calculated balance
    """
    @sp.utils.view(sp.TNat)
    def borrowBalanceStored(self, params):
        pass


    """    
        Calculates the exchange rate from the underlying to the CToken

        dev: This function does not accrue interest before calculating the exchange rate
        dev: Do accrueInterest() before this function to get the up-to-date exchange rate

        params: TUnit

        return: Calculated exchange rate scaled by 1e18
    """
    @sp.utils.view(sp.TNat)
    def exchangeRateStored(self, params):
        pass


    """    
        Get cash balance of this cToken in the underlying asset

        params: TUnit

        return: The quantity of underlying asset owned by this contract
    """
    @sp.utils.view(sp.TNat)
    def getCash(self, params):
        pass


    """    
        Applies accrued interest to total borrows and reserves.

        dev: This calculates interest accrued from the last checkpointed block
             up to the current block and writes new checkpoint to storage.

        params: TUnit
    """
    @sp.entry_point
    def accrueInterest(self, params):
        pass


    """    
        Transfers collateral tokens (this market) to the liquidator.

        dev: Will fail unless called by Comptroller during the process of liquidation.

        params: TRecord
            liquidator: TAddress - The account receiving seized collateral
            borrower: TAddress - The account having collateral seized
            seizeTokens: TNat - The number of cTokens to seize
    """
    @sp.entry_point
    def seize(self, params):
        pass


        
    # Admin Functions
    """    
        Sets a new pending governance for the market

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance contract
    """
    @sp.entry_point
    def setPendingGovernance(self, pendingAdminAddress):
        pass


    """    
        Accept a new governance for the market

        dev: Governance function to set a new governance

        unusedArg: TUnit
    """
    @sp.entry_point
    def acceptGovernance(self, unusedArg):
        pass


    """    
        Remove pending governance for the market

        dev: Governance function to set a remove pending governance

        unusedArg: TUnit
    """
    @sp.entry_point
    def removePendingGovernance(self, unusedArg):
        pass


    """    
        Sets a new comptroller for the market

        dev: Governance function to set a new comptroller

        comptrollerAddress: TAddress - The address of the new comptroller contract
    """
    @sp.entry_point
    def setComptroller(self, comptrollerAddress):
        pass


    """    
        Accrues interest and updates the interest rate model using _setInterestRateModelFresh

        dev: Governance function to accrue interest and update the interest rate model

        interestRateModelAddress: TAddress - The address of the new interest rate model contract
    """
    @sp.entry_point
    def setInterestRateModel(self, interestRateModelAddress):
        pass
    

    """    
        accrues interest and sets a new reserve factor for the protocol

        dev: Governance function to accrue interest and set a new reserve factor

        newReserveFactor: TNat - New reserve factor value
    """
    @sp.entry_point
    def setReserveFactor(self, newReserveFactor):
        pass
    

    """    
        Accrues interest and adds reserves by transferring from admin

        amount: TNat - Amount of reserves to add
    """
    @sp.entry_point
    def addReserves(self, amount):
        pass
    

    """    
        Accrues interest and reduces reserves by transferring to admin

        amount: TNat - Amount of reduction to reserves
    """
    @sp.entry_point
    def reduceReserves(self, amount):
        pass

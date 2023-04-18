# Governance Interface
# Performs control of the protocol

import smartpy as sp


class GovernanceInterface(sp.Contract):
    """    
        Sets a new pending governance for the governor

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance
    """
    @sp.entry_point
    def setPendingGovernance(self, pendingAdminAddress):
        pass

    """    
        Accept a new governance for the Governor

        params: TUnit
    """
    @sp.entry_point
    def acceptGovernance(self, unusedArg):
        pass

    """    
        Sets a new pending governance for the specified Comptroller or CToken address

        params: TRecord
            contractAddress: TAddress - The address of Comptroller or CToken contract
            governance: TAddress - The address of the new Governance contract
    """
    @sp.entry_point
    def setContractGovernance(self, params):
        pass

    """    
        Accept a new governance for the specified Comptroller or CToken address

        contractAddress: TAddress - The address of Comptroller or CToken contract
    """
    @sp.entry_point
    def acceptContractGovernance(self, contractAddress):
        pass

    # CToken functions

    """    
        Sets a new comptroller for the market

        params: TRecord
            cToken: TAddress - The address of CToken contract
            comptroller: TAddress - The address of the new comptroller contract
    """
    @sp.entry_point
    def setComptroller(self, params):
        pass

    """    
        Accrues interest and updates the interest rate model

        params: TRecord
            cToken: TAddress - The address of CToken contract
            interestRateModel: TAddress - The address of the new interest rate model contract
    """
    @sp.entry_point
    def setInterestRateModel(self, params):
        pass

    """    
        accrues interest and sets a new reserve factor for the protocol

        params: TRecord
            cToken: TAddress - The address of CToken contract
            newReserveFactor: TNat - New reserve factor value
    """
    @sp.entry_point
    def setReserveFactor(self, params):
        pass

    """    
        Accrues interest and reduces reserves by transferring to admin

        params: TRecord
            cToken: TAddress - The address of CToken contract
            amount: TNat - Amount of reduction to reserves
    """
    @sp.entry_point
    def reduceReserves(self, params):
        pass

    # Comptroller functions

    """
        Sets a new price oracle and time diff for the comptroller

        params: TAddress, TInt - The address of the new price oracle contract and max time diff
    """
    @sp.entry_point(lazify=True)
    def setPriceOracleAndTimeDiff(self, params):
        pass

    """    
        Sets the closeFactor used when liquidating borrows

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            closeFactor: TNat - New close factor, scaled by 1e18
    """
    @sp.entry_point
    def setCloseFactor(self, params):
        pass

    """    
        Sets the collateralFactor for a market

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            collateralFactor: TRecord 
                cToken: TAddress - The market to set the factor on
                newCollateralFactor: TNat - The new collateral factor, scaled by 1e18
    """
    @sp.entry_point
    def setCollateralFactor(self, params):
        pass

    """    
        Sets liquidationIncentive

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            liquidationIncentive: TNat - New liquidationIncentive scaled by 1e18
    """
    @sp.entry_point
    def setLiquidationIncentive(self, params):
        pass

    """    
        Add the market to the markets mapping and set it as listed

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            market: TRecord
                cToken: TAddress - The address of the market (token) to list
                name: TString - The market name in price oracle
    """
    @sp.entry_point
    def supportMarket(self, params):
        pass

    """    
        Disable the supported market

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            cToken: TAddress - The address of the market (token) to disable
    """
    @sp.entry_point
    def disableMarket(self, params):
        pass

    """    
        Pause or activate the mint of given CToken

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            tokenState: TRecord
                cToken: TAddress - The address of the market to change the mint pause state
                state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setMintPaused(self, params):
        pass

    """    
        Pause or activate the borrow of given CToken

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            tokenState: TRecord
                cToken: TAddress - The address of the market to change the borrow pause state
                state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setBorrowPaused(self, params):
        pass

    """    
        Pause or activate the transfer of CTokens

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setTransferPaused(self, params):
        pass

        """    
        # Set the number of blocks since the last accrue interest update is valid

        params: TRecord
            cToken: TAddress - The address of CToken contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setAccrualIntPeriodRelevance(self, params):
        pass

    """    
        # Set the number of blocks since the last update until the price is considered valid

        params: TRecord
            comptroller: TAddress - The address of comptroller contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setPricePeriodRelevance(self, params):
        pass

    """    
        # Set the number of blocks since the last update until the liquidity is considered valid

        params: TRecord
            comptroller: TAddress - The address of comptroller contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setLiquidityPeriodRelevance(self, params):
        pass

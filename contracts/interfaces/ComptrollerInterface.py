# Comptroller Interface
# The risk model contract, which validates permissible user actions

import smartpy as sp


TMintAllowedParams = sp.TRecord(cToken=sp.TAddress, minter=sp.TAddress, mintAmount=sp.TNat).layout(("cToken", ("minter", "mintAmount")))
TBorrowAllowedParams = sp.TRecord(cToken=sp.TAddress, borrower=sp.TAddress, borrowAmount=sp.TNat).layout(("cToken", ("borrower", "borrowAmount")))
TRedeemAllowedParams = sp.TRecord(cToken=sp.TAddress, redeemer=sp.TAddress, redeemAmount=sp.TNat).layout(("cToken", ("redeemer", "redeemAmount")))
TRepayBorrowAllowedParams = sp.TRecord(cToken=sp.TAddress, payer=sp.TAddress, borrower=sp.TAddress, repayAmount=sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount"))))
TSeizeAllowedParams = sp.TRecord(cTokenCollateral=sp.TAddress,
                                 cTokenBorrowed=sp.TAddress, 
                                 liquidator=sp.TAddress, 
                                 borrower=sp.TAddress, 
                                 seizeTokens=sp.TNat
                                ).layout(("cTokenCollateral", (("cTokenBorrowed", "liquidator"), ("borrower", "seizeTokens"))))
TLiquidateBorrowAllowedParams = sp.TRecord(cToken=sp.TAddress,
                                 cTokenCollateral=sp.TAddress, 
                                 liquidator=sp.TAddress, 
                                 borrower=sp.TAddress, 
                                 repayAmount=sp.TNat
                                ).layout(("cToken", (("cTokenCollateral", "liquidator"), ("borrower", "repayAmount"))))
TTransferAllowedParams = sp.TRecord(cToken=sp.TAddress, src=sp.TAddress, dst=sp.TAddress, transferTokens=sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens")))

class ComptrollerInterface(sp.Contract):

    """    
        Add assets to be included in account liquidity calculation

        params: TList(TAddress) - The list of addresses of the cToken markets to be enabled
    """
    @sp.entry_point
    def enterMarkets(self, params):
        pass


    """    
        Removes asset from sender's account liquidity calculation

        dev: Sender must not have an outstanding borrow balance in the asset,
             or be providing necessary collateral for an outstanding borrow

        params: TAddress - The address of the asset to be removed
    """
    @sp.entry_point
    def exitMarket(self, params):
        pass


    """    
        Checks if the account should be allowed to mint tokens in the given market

        params: TRecord
            cToken: TAddress - The market to verify the mint against
            minter: TAddress - The account which would get the minted tokens
            mintAmount: TNat - The amount of underlying being supplied to the market in exchange for tokens
    """
    @sp.entry_point
    def mintAllowed(self, params):
        pass


    """    
        Checks if the account should be allowed to redeem tokens in the given market

        params: TRecord
            cToken: TAddress - The market to verify the redeem against
            redeemer: TAddress - The account which would redeem the tokens
            redeemTokens: TNat - The number of cTokens to exchange for the underlying asset in the market
    """
    @sp.entry_point
    def redeemAllowed(self, params):
        pass


    """    
        Checks if the account should be allowed to borrow the underlying asset of the given market

        params: TRecord
            cToken: TAddress - The market to verify the borrow against
            borrower: TAddress - The account which would borrow the tokens
            borrowAmount: TNat - The amount of underlying the account would borrow
    """
    @sp.entry_point
    def borrowAllowed(self, params):
        pass


    """    
        Checks if the account should be allowed to repay a borrow in the given market

        params: TRecord
            cToken: TAddress - The market to verify the repay against
            payer: TAddress - The account which would repay the asset
            borrower: TAddress - The account which would borrowed the asset
            repayAmount: TNat - The amount of the underlying asset the account would repay
    """
    @sp.entry_point
    def repayBorrowAllowed(self, params):
        pass


    """    
        Checks if the liquidation should be allowed to occur

        params: TRecord
            cTokenBorrowed: TAddress - Asset which was borrowed by the borrower
            cTokenCollateral: TAddress - Asset which was used as collateral and will be seized
            liquidator: TAddress - The address repaying the borrow and seizing the collateral
            borrower: TAddress - The address of the borrower
            repayAmount: TNat - The amount of underlying being repaid
    """
    @sp.entry_point
    def liquidateBorrowAllowed(self, params):
        pass


    """    
        Checks if the seizing of assets should be allowed to occur

        params: TRecord
            cTokenCollateral: TAddress - Asset which was used as collateral and will be seized
            cTokenBorrowed: TAddress - Asset which was borrowed by the borrower
            liquidator: TAddress - The address repaying the borrow and seizing the collateral
            borrower: TAddress - The address of the borrower
            seizeTokens: TNat - The number of collateral tokens to seize
    """
    @sp.entry_point
    def seizeAllowed(self, params):
        pass


    """    
        Checks if the account should be allowed to transfer tokens in the given market

        params: TRecord
            cToken: TAddress - The market to verify the transfer against
            src: TAddress - The account which sources the tokens
            dst: TAddress - The account which receives the tokens
            transferTokens: TNat - The number of cTokens to transfer
    """
    @sp.entry_point
    def transferAllowed(self, params):
        pass


    """    
        Calculate number of tokens of collateral asset to seize given an underlying amount

        dev: Used in liquidation
             Checks id sieze is allowed and performs seize for cTokenCollateral

        params: TRecord
            cTokenBorrowed: TAddress - The address of the borrowed cToken
            cTokenCollateral: TAddress - The address of the collateral cToken
            actualRepayAmount: TNat - The amount of cTokenBorrowed underlying to convert into cTokenCollateral tokens
    """
    @sp.entry_point
    def liquidateSeizeTokens(self, params):
        pass


    """    
        Determine what the account liquidity would be if the given amounts were redeemed/borrowed

        dev: With redeemTokens = 0 and borrowAmount = 0 shows current account liquidity

        params: TRecord
            cTokenModify: TAddress - The market to hypothetically redeem/borrow in
            account: TAddress - The account to determine liquidity for
            redeemTokens: TNat - The number of tokens to hypothetically redeem
            borrowAmount: TNat - The amount of underlying to hypothetically borrow
    """
    @sp.entry_point
    def getHypotheticalAccountLiquidity(self, params):
        pass



    # Admin functions

    """    
        Sets a new governance for the comptroller

        dev: Governance function to set a new governance

        params: TAddress - The address of the new Governance contract
    """
    @sp.entry_point
    def setGovernance(self, params):
        pass

    """    
        Sets a new price oracle for the comptroller

        dev: Governance function to set a new price oracle

        params: TAddress - The address of the new price oracle contract
    """
    @sp.entry_point
    def setPriceOracle(self, params):
        pass


    """    
        Sets the closeFactor used when liquidating borrows

        dev: Governance function to set closeFactor

        params: TNat - New close factor, scaled by 1e18
    """
    @sp.entry_point
    def setCloseFactor(self, params):
        pass


    """    
        Sets the collateralFactor for a market

        dev: Governance function to set per-market collateralFactor

        params: TRecord
            cToken: TAddress - The market to set the factor on
            newCollateralFactor: TNat - The new collateral factor, scaled by 1e18
    """
    @sp.entry_point
    def setCollateralFactor(self, params):
        pass


    """    
        Sets liquidationIncentive

        dev: Governance function to set liquidationIncentive

        params: TNat - New liquidationIncentive scaled by 1e18
    """
    @sp.entry_point
    def setLiquidationIncentive(self, params):
        pass


    """    
        Add the market to the markets mapping and set it as listed

        dev: Governance function to set isListed and add support for the market

        params: TAddress - The address of the market (token) to list
    """
    @sp.entry_point
    def supportMarket(self, params):
        pass


    """    
        Disable the supported market

        dev: Governance function to set isDisabled for the supported market

        params: TAddress - The address of the market (token) to disable
    """
    @sp.entry_point
    def disableMarket(self, params):
        pass


    """    
        Set the given borrow cap for the given cToken market. Borrowing that brings total borrows to or above borrow cap will revert.

        dev: Governance function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.

        params: TRecord
            cToken: TAddress - The address of the market (token) to change the borrow caps for
            newBorrowCap: TNat - The new borrow cap value in underlying to be set. A value of 0 corresponds to unlimited borrowing.
    """
    @sp.entry_point
    def setMarketBorrowCap(self, params):
        pass


    """    
        Pause or activate the mint of given CToken

        dev: Governance function to pause or activate the mint of given CToken

        params: TRecord
            cToken: TAddress - The address of the market to change the mint pause state
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setMintPaused(self, params):
        pass


    """    
        Pause or activate the borrow of given CToken

        dev: Governance function to pause or activate the borrow of given CToken

        params: TRecord
            cToken: TAddress - The address of the market to change the borrow pause state
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setBorrowPaused(self, params):
        pass


    """    
        Pause or activate the transfer of CTokens

        dev: Governance function to pause or activate the transfer of CTokens

        params: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setTransferPaused(self, params):
        pass


    """    
        Pause or activate the seize of CTokens

        dev: Governance function to pause or activate the seize of CTokens

        params: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setSeizePaused(self, params):
        pass


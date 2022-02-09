# Comptroller Interface
# The risk model contract, which validates permissible user actions

import smartpy as sp


TMintAllowedParams = sp.TRecord(cToken=sp.TAddress, minter=sp.TAddress, mintAmount=sp.TNat).layout(("cToken", ("minter", "mintAmount")))
TBorrowAllowedParams = sp.TRecord(cToken=sp.TAddress, borrower=sp.TAddress, borrowAmount=sp.TNat).layout(("cToken", ("borrower", "borrowAmount")))
TRedeemAllowedParams = sp.TRecord(cToken=sp.TAddress, redeemer=sp.TAddress, redeemAmount=sp.TNat).layout(("cToken", ("redeemer", "redeemAmount")))
TRepayBorrowAllowedParams = sp.TRecord(cToken=sp.TAddress, payer=sp.TAddress, borrower=sp.TAddress, repayAmount=sp.TNat).layout(("cToken", ("payer", ("borrower", "repayAmount"))))
TTransferAllowedParams = sp.TRecord(cToken=sp.TAddress, src=sp.TAddress, dst=sp.TAddress, transferTokens=sp.TNat).layout((("cToken", "src"), ("dst", "transferTokens")))
TAccountLiquidityParams = sp.TRecord(cTokenModify=sp.TAddress,
                             account=sp.TAddress,
                             redeemTokens=sp.TNat,
                             borrowAmount=sp.TNat
                            ).layout(("account", ("cTokenModify", ("redeemTokens", "borrowAmount"))))
TGetAccountLiquidityParams = sp.TRecord(data=TAccountLiquidityParams, callback=sp.TContract(sp.TInt))

class ComptrollerInterface(sp.Contract):

    """    
        Add assets to be included in account liquidity calculation

        cTokens: TList(TAddress) - The list of addresses of the cToken markets to be enabled
    """
    @sp.entry_point
    def enterMarkets(self, cTokens):
        pass


    """    
        Removes asset from sender's account liquidity calculation

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within 5 blocks prior to this call

        dev: Sender must not have an outstanding borrow balance in the asset,
             or be providing necessary collateral for an outstanding borrow

        cToken: TAddress - The address of the asset to be removed
    """
    @sp.entry_point
    def exitMarket(self, cToken):
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

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within 5 blocks prior to this call

        params: TRecord
            cToken: TAddress - The market to verify the redeem against
            redeemer: TAddress - The account which would redeem the tokens
            redeemAmount: TNat - The number of cTokens to exchange for the underlying asset in the market
    """
    @sp.entry_point
    def redeemAllowed(self, params):
        pass


    """    
        Checks if the account should be allowed to borrow the underlying asset of the given market

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within 5 blocks prior to this call

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
        Checks if the account should be allowed to transfer tokens in the given market

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within 5 blocks prior to this call

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
        Update price of the given asset

        asset: TAddress - CToken market address
    """
    @sp.entry_point
    def updateAssetPrice(self, asset):
        pass


    """
        Updates stored liquidity for the given account

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the account
            accrueInterest() should be executed within 5 blocks prior to this call, for all markets entered by the account

        dev: should be called before entry points that works with account liquidity

        account: TAddress - The account to calculate liquidity for
    """
    @sp.entry_point
    def updateAccountLiquidity(self, account):
        pass


    """    
        Determine what the account liquidity would be if the given amounts were redeemed/borrowed

        requirements:
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user

        dev: With redeemTokens = 0 and borrowAmount = 0 shows current account liquidity

        params: TRecord
            data: TAccountLiquidityParams
                cTokenModify: TAddress - The market to hypothetically redeem/borrow in
                account: TAddress - The account to determine liquidity for
                redeemTokens: TNat - The number of tokens to hypothetically redeem
                borrowAmount: TNat - The amount of underlying to hypothetically borrow
            callback: TContract(TInt) - callback to send result to

        return: TInt - the account liquidity. Shows shortfall when return value < 0
    """
    @sp.entry_point
    def getHypoAccountLiquidity(self, params):
        pass


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

        params: TUnit
    """
    @sp.entry_point
    def acceptGovernance(self, unusedArg):
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

        params: TRecord
            cToken: TAddress - The address of the market (token) to list
            name: TString - The market name in price oracle
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

        state: TBool, where True - pause, False - activate
    """
    @sp.entry_point
    def setTransferPaused(self, state):
        pass

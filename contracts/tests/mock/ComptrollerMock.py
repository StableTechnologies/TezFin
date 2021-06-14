import smartpy as sp

CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")


class ComptrollerMock(CMPTInterface.ComptrollerInterface):
    def __init__(self, **extra_storage):
        self.init(
            mint_allowed = sp.bool(True),
            borrow_allowed = sp.bool(True),
            redeem_allowed = sp.bool(True),
            repay_borrow_allowed = sp.bool(True),
            seize_allowed = sp.bool(True),
            liquidate_borrow_allowed = sp.bool(True),
            **extra_storage
        )

    @sp.entry_point
    def enterMarkets(self, params):
        sp.set_type(params, sp.TUnit)

    @sp.entry_point
    def exitMarket(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def mintAllowed(self, params):
        sp.set_type(params, CMPTInterface.TMintAllowedParams)
        sp.verify(self.data.mint_allowed)
        
    @sp.entry_point
    def setMintAllowed(self, params):
        self.data.mint_allowed = params
        
    @sp.entry_point
    def redeemAllowed(self, params):
        sp.set_type(params, CMPTInterface.TRedeemAllowedParams)
        sp.verify(self.data.redeem_allowed)
        
    @sp.entry_point
    def setRedeemAllowed(self, params):
        self.data.redeem_allowed = params
        
    @sp.entry_point
    def borrowAllowed(self, params):
        sp.set_type(params, CMPTInterface.TBorrowAllowedParams)
        sp.verify(self.data.borrow_allowed)
        
    @sp.entry_point
    def setBorrowAllowed(self, params):
        self.data.borrow_allowed = params
        
    @sp.entry_point
    def repayBorrowAllowed(self, params):
        sp.set_type(params, CMPTInterface.TRepayBorrowAllowedParams)
        sp.verify(self.data.repay_borrow_allowed)
        
    @sp.entry_point
    def setRepayBorrowAllowed(self, params):
        self.data.repay_borrow_allowed = params
        
    @sp.entry_point
    def liquidateBorrowAllowed(self, params):
        sp.set_type(params, CMPTInterface.TLiquidateBorrowAllowedParams)
        sp.verify(self.data.liquidate_borrow_allowed)
        
    @sp.entry_point
    def setLiquidateBorrowAllowed(self, params):
        self.data.liquidate_borrow_allowed = params
        
    @sp.entry_point
    def seizeAllowed(self, params):
        sp.set_type(params, CMPTInterface.TSeizeAllowedParams)
        sp.verify(self.data.seize_allowed)
        
    @sp.entry_point
    def setSeizeAllowed(self, params):
        self.data.seize_allowed = params
        
    @sp.entry_point
    def testSeize(self, params):
        c = sp.contract(sp.TRecord(liquidator=sp.TAddress, borrower=sp.TAddress, seizeTokens=sp.TNat), params.cToken, entry_point="seize").open_some()
        sp.transfer(params.data, sp.mutez(0), c)
        
    @sp.entry_point
    def transferAllowed(self, params):
        sp.set_type(params, CMPTInterface.TTransferAllowedParams)
        
    @sp.entry_point
    def liquidateSeizeTokens(self, params):
        sp.set_type(params, CMPTInterface.TLiquidateBorrowAllowedParams)
        c = sp.contract(sp.TRecord(liquidator=sp.TAddress, borrower=sp.TAddress, seizeTokens=sp.TNat), params.cToken, entry_point="seize").open_some()
        sp.transfer(sp.record(liquidator=params.liquidator, borrower=params.borrower, seizeTokens=sp.nat(0)), sp.mutez(0), c)
        
    @sp.entry_point
    def getHypotheticalAccountLiquidity(self, params):
        sp.set_type(params, sp.TUnit)


    # Admin functions
    
    @sp.entry_point
    def setGovernance(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setPriceOracle(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setCloseFactor(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setCollateralFactor(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setLiquidationIncentive(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def supportMarket(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def disableMarket(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setMarketBorrowCap(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setMintPaused(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setBorrowPaused(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setTransferPaused(self, params):
        sp.set_type(params, sp.TUnit)
        
    @sp.entry_point
    def setSeizePaused(self, params):
        sp.set_type(params, sp.TUnit)


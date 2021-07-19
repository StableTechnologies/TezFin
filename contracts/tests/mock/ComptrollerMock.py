import smartpy as sp

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")


class ComptrollerMock(CMPTInterface.ComptrollerInterface):
    def __init__(self, **extra_storage):
        self.init(
            mint_allowed = sp.bool(True),
            borrow_allowed = sp.bool(True),
            redeem_allowed = sp.bool(True),
            repay_borrow_allowed = sp.bool(True),
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
    def transferAllowed(self, params):
        sp.set_type(params, CMPTInterface.TTransferAllowedParams)

    @sp.entry_point
    def updateAssetPrice(self, asset):
        sp.set_type(asset, sp.TAddress)

    @sp.entry_point
    def updateAccountLiquidity(self, account):
        sp.set_type(account, sp.TAddress)

    @sp.entry_point
    def getHypoAccountLiquidity(self, params):
        sp.set_type(params, sp.TUnit)


    # Admin functions
    @sp.entry_point
    def setPricePeriodRelevance(self, blockNumber):
        sp.set_type(blockNumber, sp.TNat)

    @sp.entry_point
    def setLiquidityPeriodRelevance(self, blockNumber):
        sp.set_type(blockNumber, sp.TNat)

    @sp.entry_point
    def setPendingGovernance(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)

    @sp.entry_point
    def acceptGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TAddress)
        
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

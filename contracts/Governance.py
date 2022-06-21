import smartpy as sp

GOVErrors = sp.io.import_script_from_url(
    "file:contracts/errors/GovernanceErrors.py")
EC = GOVErrors.ErrorCodes

GOVI = sp.io.import_script_from_url(
    "file:contracts/interfaces/GovernanceInterface.py")
SweepTokens = sp.io.import_script_from_url(
    "file:contracts/utils/SweepTokens.py")
CToken = sp.io.import_script_from_url("file:contracts/CToken.py")


class Governance(GOVI.GovernanceInterface, SweepTokens.SweepTokens):
    def __init__(self, administrator_):
        self.init(administrator=administrator_, pendingAdministrator=sp.none)

    @sp.entry_point(lazify=True)
    def receive(self, unused):
        sp.set_type(unused, sp.TUnit)

    """    
        Sets a new pending governance for the governor

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance
    """
    @sp.entry_point(lazify=True)
    def setPendingGovernance(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.some(pendingAdminAddress)

    """    
        Accept a new governance for the Governor

        params: TUnit
    """
    @sp.entry_point(lazify=True)
    def acceptGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator.open_some(
            EC.GOV_NOT_SET_PENDING_ADMIN), EC.GOV_NOT_PENDING_ADMIN)
        self.data.administrator = self.data.pendingAdministrator.open_some()
        self.data.pendingAdministrator = sp.none

    """    
        Sets a new pending governance for the specified Comptroller or CToken address

        params: TRecord
            contractAddress: TAddress - The address of Comptroller or CToken contract
            governance: TAddress - The address of the new Governance contract
    """
    @sp.entry_point
    def setContractGovernance(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            contractAddress=sp.TAddress, governance=sp.TAddress))
        contract = sp.contract(
            sp.TAddress, params.contractAddress, "setPendingGovernance").open_some()
        sp.transfer(params.governance, sp.mutez(0), contract)

    """    
        Accept a new governance for the specified Comptroller or CToken address

        contractAddress: TAddress - The address of Comptroller or CToken contract
    """
    @sp.entry_point
    def acceptContractGovernance(self, contractAddress):
        self.verifyAdministrator()
        sp.set_type(contractAddress, sp.TAddress)
        contract = sp.contract(sp.TUnit, contractAddress,
                               "acceptGovernance").open_some()
        sp.transfer(sp.unit, sp.mutez(0), contract)

    """    
        # Set the number of blocks since the last accrue interest update is valid

        params: TRecord
            cToken: TAddress - The address of CToken contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setAccrualIntPeriodRelevance(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, blockNumber=sp.TNat))
        contract = sp.contract(sp.TNat, params.cToken,
                               "setAccrualIntPeriodRelevance").open_some()
        sp.transfer(params.blockNumber, sp.mutez(0), contract)

    """    
        # Set the number of blocks since the last update until the price is considered valid

        params: TRecord
            comptroller: TAddress - The address of comptroller contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setPricePeriodRelevance(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, blockNumber=sp.TNat))
        contract = sp.contract(sp.TNat, params.comptroller,
                               "setPricePeriodRelevance").open_some()
        sp.transfer(params.blockNumber, sp.mutez(0), contract)

    """    
        # Set the number of blocks since the last update until the liquidity is considered valid

        params: TRecord
            comptroller: TAddress - The address of comptroller contract
            blockNumber: TNat
    """
    @sp.entry_point
    def setLiquidityPeriodRelevance(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, blockNumber=sp.TNat))
        contract = sp.contract(sp.TNat, params.comptroller,
                               "setLiquidityPeriodRelevance").open_some()
        sp.transfer(params.blockNumber, sp.mutez(0), contract)

    # CToken functions

    """    
        Sets a new comptroller for the market

        params: TRecord
            cToken: TAddress - The address of CToken contract
            comptroller: TAddress - The address of the new comptroller contract
    """
    @sp.entry_point
    def setComptroller(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, comptroller=sp.TAddress))
        contract = sp.contract(sp.TAddress, params.cToken,
                               "setComptroller").open_some()
        sp.transfer(params.comptroller, sp.mutez(0), contract)

    """    
        Accrues interest and updates the interest rate model

        params: TRecord
            cToken: TAddress - The address of CToken contract
            interestRateModel: TAddress - The address of the new interest rate model contract
    """
    @sp.entry_point
    def setInterestRateModel(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, interestRateModel=sp.TAddress))
        contract = sp.contract(sp.TAddress, params.cToken,
                               "setInterestRateModel").open_some()
        sp.transfer(params.interestRateModel, sp.mutez(0), contract)

    """    
        accrues interest and sets a new reserve factor for the protocol

        params: TRecord
            cToken: TAddress - The address of CToken contract
            newReserveFactor: TNat - New reserve factor value
    """
    @sp.entry_point
    def setReserveFactor(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, newReserveFactor=sp.TNat))
        contract = sp.contract(sp.TNat, params.cToken,
                               "setReserveFactor").open_some()
        sp.transfer(params.newReserveFactor, sp.mutez(0), contract)
        
    """    
        accrues interest and sets a new alpha-hyperparameter for the protocol

        params: TRecord
            cToken: TAddress - The address of CToken contract
            newAlpha: TNat - New reserve factor value
    """
    @sp.entry_point
    def setAlpha(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, newAlpha=sp.TNat))
        contract = sp.contract(sp.TNat, params.cToken,
                               "updateAlpha").open_some()
        sp.transfer(params.newAlpha, sp.mutez(0), contract)


    """    
        Accrues interest and reduces reserves by transferring to admin

        params: TRecord
            cToken: TAddress - The address of CToken contract
            amount: TNat - Amount of reduction to reserves
    """
    @sp.entry_point
    def reduceReserves(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, amount=sp.TNat))
        contract = sp.contract(sp.TNat, params.cToken,
                               "reduceReserves").open_some()
        sp.transfer(params.amount, sp.mutez(0), contract)

    # Comptroller functions

    """    
        Sets a new price oracle for the comptroller

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            priceOracle: TAddress - The address of the new price oracle contract
    """
    @sp.entry_point
    def setPriceOracle(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, priceOracle=sp.TAddress))
        contract = sp.contract(
            sp.TAddress, params.comptroller, "setPriceOracle").open_some()
        sp.transfer(params.priceOracle, sp.mutez(0), contract)

    """    
        Sets the closeFactor used when liquidating borrows

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            closeFactor: TNat - New close factor, scaled by 1e18
    """
    @sp.entry_point
    def setCloseFactor(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, closeFactor=sp.TNat))
        contract = sp.contract(sp.TNat, params.comptroller,
                               "setCloseFactor").open_some()
        sp.transfer(params.closeFactor, sp.mutez(0), contract)

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
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(comptroller=sp.TAddress, collateralFactor=sp.TRecord(
            cToken=sp.TAddress,  newCollateralFactor=sp.TNat)))
        contract = sp.contract(sp.TRecord(cToken=sp.TAddress, newCollateralFactor=sp.TNat),
                               params.comptroller, "setCollateralFactor").open_some()
        sp.transfer(params.collateralFactor, sp.mutez(0), contract)

    """    
        Sets liquidationIncentive

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            liquidationIncentive: TNat - New liquidationIncentive scaled by 1e18
    """
    @sp.entry_point
    def setLiquidationIncentive(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, liquidationIncentive=sp.TNat))
        contract = sp.contract(sp.TNat, params.comptroller,
                               "setLiquidationIncentive").open_some()
        sp.transfer(params.liquidationIncentive, sp.mutez(0), contract)

    """    
        Add the market to the markets mapping and set it as listed

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            market: TRecord
                cToken: TAddress - The address of the market (token) to list
                name: TString - The market name in price oracle
                priceExp: TNat - exponent needed to normalize the token prices to 10^18 (eth:0, btc: 10, usd: 12)
    """
    @sp.entry_point
    def supportMarket(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(comptroller=sp.TAddress, market=sp.TRecord(
            cToken=sp.TAddress, name=sp.TString, priceExp=sp.TNat)))
        contract = sp.contract(sp.TRecord(cToken=sp.TAddress, name=sp.TString,
                               priceExp=sp.TNat), params.comptroller, "supportMarket").open_some()
        sp.transfer(params.market, sp.mutez(0), contract)

    """    
        Disable the supported market

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            cToken: TAddress - The address of the market (token) to disable
    """
    @sp.entry_point
    def disableMarket(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, cToken=sp.TAddress))
        contract = sp.contract(
            sp.TAddress, params.comptroller, "disableMarket").open_some()
        sp.transfer(params.cToken, sp.mutez(0), contract)

    """    
        Set the given borrow cap for the given cToken market. Borrowing that brings total borrows to or above borrow cap will revert.

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            borrowCap: TRecord
                cToken: TAddress - The address of the market (token) to change the borrow caps for
                newBorrowCap: TNat - The new borrow cap value in underlying to be set. A value of 0 corresponds to unlimited borrowing.
            
    """
    @sp.entry_point
    def setMarketBorrowCap(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(comptroller=sp.TAddress, borrowCap=sp.TRecord(
            cToken=sp.TAddress, newBorrowCap=sp.TNat)))
        contract = sp.contract(sp.TRecord(cToken=sp.TAddress, newBorrowCap=sp.TNat),
                               params.comptroller, "setMarketBorrowCap").open_some()
        sp.transfer(params.borrowCap, sp.mutez(0), contract)

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
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(comptroller=sp.TAddress,
                    tokenState=sp.TRecord(cToken=sp.TAddress, state=sp.TBool)))
        contract = sp.contract(sp.TRecord(
            cToken=sp.TAddress, state=sp.TBool), params.comptroller, "setMintPaused").open_some()
        sp.transfer(params.tokenState, sp.mutez(0), contract)

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
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(comptroller=sp.TAddress,
                    tokenState=sp.TRecord(cToken=sp.TAddress, state=sp.TBool)))
        contract = sp.contract(sp.TRecord(
            cToken=sp.TAddress, state=sp.TBool), params.comptroller, "setBorrowPaused").open_some()
        sp.transfer(params.tokenState, sp.mutez(0), contract)

    """    
        Pause or activate the transfer of CTokens

        params: TRecord
            comptroller: TAddress - The address of Comptroller contract
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point
    def setTransferPaused(self, params):
        self.verifyAdministrator()
        sp.set_type(params, sp.TRecord(
            comptroller=sp.TAddress, state=sp.TBool))
        contract = sp.contract(sp.TBool, params.comptroller,
                               "setTransferPaused").open_some()
        sp.transfer(params.state, sp.mutez(0), contract)

    # Helpers

    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, EC.GOV_NOT_ADMIN)

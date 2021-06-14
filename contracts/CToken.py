import smartpy as sp

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
IRMI = sp.io.import_script_from_url("file:contracts/interfaces/InterestRateModelInterface.py")
CMPI = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")
Exponential = sp.io.import_script_from_url("file:contracts/utils/Exponential.py")
SweepTokens = sp.io.import_script_from_url("file:contracts/utils/SweepTokens.py")
OP = sp.io.import_script_from_url("file:contracts/utils/OperationProtector.py")


class CToken(CTI.CTokenInterface, Exponential.Exponential, SweepTokens.SweepTokens, OP.OperationProtector):
    def __init__(self, decimalsUnderlying_, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, **extra_storage):
        Exponential.Exponential.__init__(
            self,
            balances = sp.big_map(tkey = sp.TAddress, tvalue = sp.TRecord(
                approvals = sp.TMap(sp.TAddress, sp.TNat), # Approved token transfer amounts on behalf of others
                accountBorrows = CTI.TBorrowSnapshot, # Mapping of account addresses to outstanding borrow balances
                balance = sp.TNat)), # Official record of token balances for each account
            totalSupply = sp.nat(0), # Total number of tokens in circulation
            decimalsUnderlying = decimalsUnderlying_, # decimals for the underlying asset
            borrowRateMaxMantissa = sp.nat(int(5e12)), # Maximum borrow rate that can ever be applied (.0005% / block)
            reserveFactorMaxMantissa = sp.nat(int(1e18)), # Maximum fraction of interest that can be set aside for reserves
            comptroller = comptroller_, # Contract which oversees inter-cToken operations
            interestRateModel = interestRateModel_, # Model which tells what the current interest rate should be
            initialExchangeRateMantissa = initialExchangeRateMantissa_, # Initial exchange rate used when minting the first CTokens
            reserveFactorMantissa = sp.nat(0), # Fraction of interest currently set aside for reserves
            accrualBlockNumber = sp.nat(0), # Block number that interest was last accrued at
            borrowIndex = sp.nat(int(1e18)), # Accumulator of the total earned interest rate since the opening of the market
            totalBorrows = sp.nat(0), # Total amount of outstanding borrows of the underlying in this market
            totalReserves = sp.nat(0), # Total amount of reserves of the underlying held in this market
            borrowRatePerBlock = sp.nat(0), # Current per-block borrow interest rate
            supplyRatePerBlock = sp.nat(0), # Current per-block supply interest rate
            administrator = administrator_, # Administrator`s address for this contract
            pendingAdministrator = self.undefinedAddress(), # Pending administrator`s address for this contract
            activeOperations = sp.set(t=sp.TNat), # Set of currently active operations to protect execution flow
            **extra_storage
        )

    """    
        Sender supplies assets into the market and receives cTokens in exchange

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The amount of the underlying asset to supply
    """
    @sp.entry_point
    def mint(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.MINT)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(minter=sp.sender, mintAmount=params), sp.amount, sp.self_entry_point("mintInternal"))

    @sp.entry_point
    def mintInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.MINT)
        self.verifyMintAllowed(params.minter, params.mintAmount)
        self.verifyBlockNumber()
        self.addAddressIfNecessary(params.minter)
        self.doTransferIn(params.minter, params.mintAmount)
        mintTokens = self.getMintTokens(params.mintAmount)
        self.data.totalSupply += mintTokens
        self.data.balances[params.minter].balance += mintTokens

    def verifyMintAllowed(self, minter_, mintAmount_):
        c = sp.contract(CMPI.TMintAllowedParams, self.data.comptroller, entry_point="mintAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, minter=minter_, mintAmount=mintAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    def getMintTokens(self, mintAmount):
        return self.getActualAmount(mintAmount, True, sp.nat(0))

    def doTransferIn(self, from_, amount):  # override
        pass
    

    """    
        Sender redeems cTokens in exchange for the underlying asset

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The number of cTokens to redeem into underlying
    """
    @sp.entry_point
    def redeem(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.REDEEM)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(redeemer=sp.sender, redeemAmount=params, isUnderlying=False), sp.mutez(0), sp.self_entry_point("redeemInternal"))
    

    """    
        Sender redeems cTokens in exchange for a specified amount of underlying asset

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The amount of underlying to redeem
    """
    @sp.entry_point
    def redeemUnderlying(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.REDEEM)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(redeemer=sp.sender, redeemAmount=params, isUnderlying=True), sp.amount, sp.self_entry_point("redeemInternal"))

    @sp.entry_point
    def redeemInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.REDEEM)
        redeemAmount = self.getRedeemAmount(params.redeemAmount, params.isUnderlying)
        redeemTokens = self.getRedeemTokens(params.redeemAmount, params.isUnderlying)
        self.verifyRedeemAllowed(params.redeemer, redeemTokens)
        self.checkCash(redeemAmount)
        self.data.totalSupply = sp.as_nat(self.data.totalSupply - redeemTokens, "Insufficient supply")
        self.data.balances[params.redeemer].balance = sp.as_nat(self.data.balances[params.redeemer].balance - redeemTokens, "Insufficient balance")
        self.doTransferOut(params.redeemer, redeemAmount)

    def verifyRedeemAllowed(self, redeemer_, redeemAmount_):
        c = sp.contract(CMPI.TRedeemAllowedParams, self.data.comptroller, entry_point="redeemAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, redeemer=redeemer_, redeemAmount=redeemAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    def doTransferOut(self, to_, amount): # override 
        pass
    

    """    
        Sender borrows assets from the protocol to their own address

        params: TNat - The amount of the underlying asset to borrow
    """
    @sp.entry_point
    def borrow(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.BORROW)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(borrower=sp.sender, borrowAmount=params), sp.amount, sp.self_entry_point("borrowInternal"))

    @sp.entry_point
    def borrowInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.BORROW)
        self.addAddressIfNecessary(params.borrower)
        self.verifyBorrowAllowed(params.borrower, params.borrowAmount)
        self.checkCash(params.borrowAmount)
        self.doTransferOut(params.borrower, params.borrowAmount)
        accountBorrows = self.getBorrowBalance(params.borrower) + params.borrowAmount
        self.data.balances[params.borrower].accountBorrows.principal = accountBorrows
        self.data.balances[params.borrower].accountBorrows.interestIndex = self.data.borrowIndex
        self.data.totalBorrows += accountBorrows

    def verifyBorrowAllowed(self, borrower_, borrowAmount_):
        c = sp.contract(CMPI.TBorrowAllowedParams, self.data.comptroller, entry_point="borrowAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, borrower=borrower_, borrowAmount=borrowAmount_)
        sp.transfer(transferData, sp.mutez(0), c)
    

    """    
        Sender repays their own borrow

        params: TNat - The amount to repay
    """
    @sp.entry_point
    def repayBorrow(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.REPAY)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(payer=sp.sender, borrower=sp.sender, repayAmount=params), sp.amount, sp.self_entry_point("repayBorrowInternal"))
    

    """    
        Sender repays a borrow belonging to borrower

        params: TRecord
            borrower: TAddress - The account with the debt being payed off
            repayAmount: TNat - The amount to repa
    """
    @sp.entry_point
    def repayBorrowBehalf(self, params):
        sp.set_type(params, sp.TRecord(borrower=sp.TAddress, repayAmount=sp.TNat))
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.REPAY)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(payer=sp.sender, borrower=params.borrower, repayAmount=params.repayAmount), sp.amount, sp.self_entry_point("repayBorrowInternal"))

    @sp.entry_point
    def repayBorrowInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.REPAY)
        self.addAddressIfNecessary(params.payer)
        self.verifyRepayBorrowAllowed(params.payer, params.borrower, params.repayAmount)
        self.verifyBlockNumber()
        accountBorrows = self.getBorrowBalance(params.borrower)
        repayAmount = sp.min(accountBorrows, params.repayAmount)
        self.doTransferIn(params.payer, repayAmount)
        self.data.balances[params.borrower].accountBorrows.principal = self.sub_nat_nat(accountBorrows, repayAmount)
        self.data.balances[params.borrower].accountBorrows.interestIndex = self.data.borrowIndex
        self.data.totalBorrows = self.sub_nat_nat(self.data.totalBorrows, repayAmount)

    def verifyRepayBorrowAllowed(self, payer_, borrower_, repayAmount_):
        c = sp.contract(CMPI.TRepayBorrowAllowedParams, self.data.comptroller, entry_point="repayBorrowAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, payer=payer_, borrower=borrower_, repayAmount=repayAmount_)
        sp.transfer(transferData, sp.mutez(0), c)
    

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
        sp.set_type(params, sp.TRecord(borrower=sp.TAddress, cTokenCollateral=sp.TAddress, repayAmount=sp.TNat))
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.LIQUIDATE)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        c = sp.contract(sp.TUnit, params.cTokenCollateral, entry_point="accrueInterest").open_some()
        sp.transfer(sp.unit, sp.mutez(0), c)
        liquidateParams = sp.record(liquidator=sp.sender, borrower=params.borrower, repayAmount=params.repayAmount, cTokenCollateral=params.cTokenCollateral)
        sp.transfer(liquidateParams, sp.amount, sp.self_entry_point("liquidateBorrowInternal"))

    @sp.entry_point
    def liquidateBorrowInternal(self, params):
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.LIQUIDATE)
        self.addAddressIfNecessary(params.liquidator)
        self.verifyLiquidateBorrowAllowed(params.liquidator, params.borrower, params.repayAmount, params.cTokenCollateral)
        self.verifyBlockNumber()
        sp.verify(params.liquidator != params.borrower, "Liquidator must be different from borrower")
        sp.verify(params.repayAmount > 0, "Repay amount is zero")
        self.activateOp(OP.CTokenOperations.REPAY)
        sp.transfer(sp.record(payer=params.liquidator, borrower=params.borrower, repayAmount=params.repayAmount), sp.amount, sp.self_entry_point("repayBorrowInternal"))
        sp.transfer(sp.record(cTokenCollateral=params.cTokenCollateral,
                              liquidator=params.liquidator,
                              borrower=params.borrower, 
                              oldPrincipal=self.data.balances[params.borrower].accountBorrows.principal), 
                    sp.mutez(0), sp.self_entry_point("liquidateSeizeTokens"))

    def verifyLiquidateBorrowAllowed(self, liquidator_, borrower_, repayAmount_, cTokenCollateral_):
        c = sp.contract(CMPI.TLiquidateBorrowAllowedParams, self.data.comptroller, entry_point="liquidateBorrowAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, cTokenCollateral=cTokenCollateral_, liquidator=liquidator_, borrower=borrower_, repayAmount=repayAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point
    def liquidateSeizeTokens(self, params):
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.LIQUIDATE)
        actualRepayAmount = sp.compute(sp.as_nat(params.oldPrincipal - self.data.balances[params.borrower].accountBorrows.principal))
        c = sp.contract(CMPI.TLiquidateBorrowAllowedParams, self.data.comptroller, entry_point="liquidateSeizeTokens").open_some()
        transferData = sp.record(cToken=sp.self_address,
                                 cTokenCollateral=params.cTokenCollateral, 
                                 liquidator=params.liquidator, 
                                 borrower=params.borrower, 
                                 repayAmount=actualRepayAmount)
        sp.transfer(transferData, sp.mutez(0), c)


    """    
        Transfer `value` tokens from `from_` to `to_`

        params: TRecord
            from_: TAddress - The address of the source account
            to_: TAddress - The address of the destination account
            value: TNat - The number of tokens to transfer
    """
    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
        sp.verify((params.from_ == sp.sender) |
                 (self.data.balances[params.from_].approvals[sp.sender] >= params.value))
        self.verifyTransferAllowed(params.from_, params.to_, params.value)
        self.addAddressIfNecessary(params.to_)
        sp.verify(self.data.balances[params.from_].balance >= params.value)
        self.data.balances[params.from_].balance = sp.as_nat(self.data.balances[params.from_].balance - params.value)
        self.data.balances[params.to_].balance += params.value
        sp.if (params.from_ != sp.sender):
            self.data.balances[params.from_].approvals[sp.sender] = sp.as_nat(self.data.balances[params.from_].approvals[sp.sender] - params.value)

    def verifyTransferAllowed(self, src_, dst_, transferTokens_):
        c = sp.contract(CMPI.TTransferAllowedParams, self.data.comptroller, entry_point="transferAllowed").open_some()
        transferData = sp.record(cToken=sp.self_address, src=src_, dst=dst_, transferTokens=transferTokens_)
        sp.transfer(transferData, sp.mutez(0), c)

    def addAddressIfNecessary(self, address):
        sp.if ~ self.data.balances.contains(address):
            self.data.balances[address] = sp.record(balance = 0, approvals = {}, accountBorrows = sp.record(principal = 0, interestIndex = 0))


    """    
        Approve `spender` to transfer up to `amount` from `sp.sender`

        params: TRecord
            spender: TAddress - The address of the account which may transfer tokens
            value: TNat - The number of tokens that are approved
    """
    @sp.entry_point
    def approve(self, params):
        sp.set_type(params, sp.TRecord(spender = sp.TAddress, value = sp.TNat).layout(("spender", "value")))
        self.verifyNotInternal()
        alreadyApproved = self.data.balances[sp.sender].approvals.get(params.spender, 0)
        sp.verify((alreadyApproved == 0) | (params.value == 0), "UnsafeAllowanceChange")
        self.data.balances[sp.sender].approvals[params.spender] = params.value


    """    
        Get the CToken balance of the account specified in `params`

        params: TAddress - The address of the account to query

        return: The number of tokens owned by `params`
    """
    @sp.utils.view(sp.TNat)
    def getBalance(self, params):
        sp.result(self.data.balances[params].balance)


    """    
        Get the underlying balance of the account specified in `params`

        dev: This function does not accrue interest before calculating the balance
        dev: Do accrueInterest() before this function to get the up-to-date balance

        params: TAddress - The address of the account to query

        return: The amount of underlying owned by `params`
    """
    @sp.utils.view(sp.TNat)
    def getBalanceOfUnderlying(self, params):
        sp.set_type(params, sp.TAddress)
        exchangeRate = self.makeExp(self.exchangeRateStoredImpl())
        balance = self.mulScalarTruncate(exchangeRate, self.data.balances[params].balance)
        sp.result(balance)


    """    
        Get total supply of the CToken

        params: TUnit

        return: The total supply of the CToken
    """
    @sp.utils.view(sp.TNat)
    def getTotalSupply(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.totalSupply)


    """    
        Get the current allowance from `owner` for `spender`

        params: TRecord
            owner: TAddress - The address of the account which owns the tokens to be spent
            spender: TAddress - The address of the account which may transfer tokens

        return: The number of tokens allowed to be spent
    """
    @sp.utils.view(sp.TNat)
    def getAllowance(self, params):
        sp.result(self.data.balances[params.owner].approvals[params.spender])


    """    
        Get a snapshot of the account's balances, and the cached exchange rate

        dev: This is used by comptroller to more efficiently perform liquidity checks.
        dev: Do accrueInterest() before this function to get the up-to-date balance

        params: TAddress - The address of the account to snapshot

        return: TAccountSnapshot - account balance information
    """
    @sp.utils.view(CTI.TAccountSnapshot)
    def getAccountSnapshot(self, params):
        accSnapshot = sp.record(
            cTokenBalance = self.data.balances[params].balance, 
            borrowBalance = self.getBorrowBalance(params),
            exchangeRateMantissa = self.exchangeRateStoredImpl()
        )
        sp.result(accSnapshot)


    """    
        Updates storage value of the current per-block borrow interest rate for this cToken, scaled by 1e18

        params: TUnit
    """
    @sp.entry_point
    def updateBorrowRatePerBlock(self, params):
        sp.set_type(params, sp.TUnit)
        self.activateNewOp(OP.CTokenOperations.BORROW_RATE)
        self.updateCash()
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("updateBorrowRatePerBlockInternal"))

    @sp.entry_point
    def updateBorrowRatePerBlockInternal(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.BORROW_RATE)
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel, entry_point="getBorrowRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves,
                                 cb=sp.self_entry_point("setBorrowRatePerBlock"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point
    def setBorrowRatePerBlock(self, value):
        sp.verify(sp.sender == self.data.interestRateModel)
        self.verifyAndFinishActiveOp(OP.CTokenOperations.BORROW_RATE)
        self.data.borrowRatePerBlock = value


    """    
        Updates storage value of the current per-block supply interest rate for this cToken, scaled by 1e18

        params: TUnit
    """
    @sp.entry_point
    def updateSupplyRatePerBlock(self, params):
        sp.set_type(params, sp.TUnit)
        self.activateNewOp(OP.CTokenOperations.SUPPLY_RATE)
        self.updateCash()
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("updateSupplyRatePerBlockInternal"))

    @sp.entry_point
    def updateSupplyRatePerBlockInternal(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.SUPPLY_RATE)
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel, entry_point="getSupplyRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves,
                                 cb=sp.self_entry_point("setSupplyRatePerBlock"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point
    def setSupplyRatePerBlock(self, value):
        sp.verify(sp.sender == self.data.interestRateModel)
        self.verifyAndFinishActiveOp(OP.CTokenOperations.SUPPLY_RATE)
        self.data.supplyRatePerBlock = value


    """    
        Return the borrow balance of account based on stored data

        dev: Do accrueInterest() before this function to get the up-to-date borrow balance

        params: TAddress - The address whose balance should be calculated

        return: The calculated balance
    """
    @sp.utils.view(sp.TNat)
    def borrowBalanceStored(self, params):
        sp.set_type(params, sp.TAddress)
        sp.result(self.getBorrowBalance(params))

    def getBorrowBalance(self, account):
        borrowSnapshot = sp.local('borrowSnapshot', self.data.balances[account].accountBorrows)
        borrowBalance = sp.local('borrowBalance', sp.nat(0))
        sp.if borrowSnapshot.value.principal > 0:
            principalTimesIndex = borrowSnapshot.value.principal * self.data.borrowIndex
            borrowBalance.value = principalTimesIndex // borrowSnapshot.value.interestIndex
        return borrowBalance.value


    """    
        Calculates the exchange rate from the underlying to the CToken

        dev: This function does not accrue interest before calculating the exchange rate
        dev: Do accrueInterest() before this function to get the up-to-date exchange rate

        params: TUnit

        return: Calculated exchange rate scaled by 1e18
    """
    @sp.utils.view(sp.TNat)
    def exchangeRateStored(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.exchangeRateStoredImpl())

    def exchangeRateStoredImpl(self):
        return self.exchangeRateAdjusted(sp.nat(0))

    def exchangeRateAdjusted(self, adjustment):
        excRate = sp.local('excRate', self.data.initialExchangeRateMantissa)
        sp.if self.data.totalSupply > 0:
            cash = self.sub_nat_nat(self.getCashImpl(), adjustment)
            cashPlusBorrowsMinusReserves = sp.as_nat(cash + self.data.totalBorrows - self.data.totalReserves)
            exchangeRate = self.div_exp_nat(self.toExp(cashPlusBorrowsMinusReserves), self.data.totalSupply)
            excRate.value = exchangeRate.mantissa
        return excRate.value


    """    
        Get cash balance of this cToken in the underlying asset

        dev: This function does not accrue interest before calculating cash balance
        dev: Do accrueInterest() before this function to get the up-to-date cash balance

        params: TUnit

        return: The quantity of underlying asset owned by this contract
    """
    @sp.utils.view(sp.TNat)
    def getCash(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.getCashImpl())

    """
        dev: Do updateCash() before this function to get the up-to-date cash balance
        dev: getCashImpl() should be called in new transaction after updateCash()

        return: The quantity of underlying asset owned by this contract including assets sent in current transaction
    """
    def getCashImpl(self): # override
        pass

    def updateCash(self): #override
        pass


    """    
        Applies accrued interest to total borrows and reserves.

        dev: This calculates interest accrued from the last checkpointed block
             up to the current block and writes new checkpoint to storage.

        params: TUnit
    """
    @sp.entry_point
    def accrueInterest(self, params):
        sp.set_type(params, sp.TUnit)
        self.updateCash()
        sp.if self.data.accrualBlockNumber == 0:
            self.data.accrualBlockNumber = sp.level
        sp.if sp.level != self.data.accrualBlockNumber:
            self.activateOp(OP.CTokenOperations.ACCRUE)
            sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterestInternal"))

    @sp.entry_point
    def accrueInterestInternal(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.ACCRUE)
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel, entry_point="getBorrowRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves,
                                 cb=sp.self_entry_point("doAccrueInterest"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point
    def doAccrueInterest(self, borrowRateMantissa):
        sp.set_type(borrowRateMantissa, sp.TNat)
        sp.verify(sp.sender == self.data.interestRateModel)
        self.verifyAndFinishActiveOp(OP.CTokenOperations.ACCRUE)
        sp.verify(borrowRateMantissa <= self.data.borrowRateMaxMantissa)
        cash = self.getCashImpl()
        blockDelta = sp.as_nat(sp.level - self.data.accrualBlockNumber)

        simpleInterestFactor = sp.compute(self.mul_exp_nat(self.makeExp(borrowRateMantissa), blockDelta))
        interestAccumulated = sp.compute(self.mulScalarTruncate(simpleInterestFactor, self.data.totalBorrows))
        self.data.totalBorrows = interestAccumulated + self.data.totalBorrows
        self.data.totalReserves = self.mulScalarTruncateAdd(sp.record(mantissa=self.data.reserveFactorMantissa),
                                                            interestAccumulated,
                                                            self.data.totalReserves)
        self.data.borrowIndex = self.mulScalarTruncateAdd(simpleInterestFactor, self.data.borrowIndex, self.data.borrowIndex)
        self.data.accrualBlockNumber = sp.level


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
        sp.set_type(params, sp.TRecord(liquidator=sp.TAddress, borrower=sp.TAddress, seizeTokens=sp.TNat))
        self.verifyAndFinishActiveOp(OP.CTokenOperations.LIQUIDATE)
        sp.verify(sp.sender == self.data.comptroller, "Seize is allowed only to comptroller")
        sp.verify(params.liquidator != params.borrower, "Liquidator must be different from borrower")
        self.data.balances[params.borrower].balance = self.sub_nat_nat(self.data.balances[params.borrower].balance, params.seizeTokens)
        self.data.balances[params.liquidator].balance += params.seizeTokens


 # Admin Functions
    """    
        Sets a new pending governance for the market

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance contract
    """
    @sp.entry_point
    def setPendingGovernance(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = pendingAdminAddress


    """    
        Accept a new governance for the market

        dev: Governance function to set a new governance

        params: TUnit
    """
    @sp.entry_point
    def acceptGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator, "Sender of this function must have same address as pendingAdministrator")
        self.data.administrator = self.data.pendingAdministrator
        self.data.pendingAdministrator = self.undefinedAddress()


    """    
        Remove pending governance for the market

        dev: Governance function to set a remove pending governance

        params: TUnit
    """
    @sp.entry_point
    def removePendingGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        self.verifyAdministrator()
        self.data.pendingAdministrator = self.undefinedAddress()


    """    
        Sets a new comptroller for the market

        dev: Governance function to set a new comptroller

        comptrollerAddress: TAddress - The address of the new comptroller contract
    """
    @sp.entry_point
    def setComptroller(self, comptrollerAddress):
        sp.set_type(comptrollerAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.comptroller = comptrollerAddress


    """    
        Accrues interest and updates the interest rate model using _setInterestRateModelFresh

        dev: Governance function to accrue interest and update the interest rate model

        interestRateModelAddress: TAddress - The address of the new interest rate model contract
    """
    @sp.entry_point
    def setInterestRateModel(self, interestRateModelAddress):
        sp.set_type(interestRateModelAddress, sp.TAddress)
        self.verifyAdministrator()
        self.activateNewOp(OP.CTokenOperations.INTEREST_MODEL)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(interestRateModelAddress, sp.mutez(0), sp.self_entry_point("setInterestRateModelInternal"))
    
    @sp.entry_point
    def setInterestRateModelInternal(self, interestRateModelAddress):
        sp.set_type(interestRateModelAddress, sp.TAddress)
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.INTEREST_MODEL)
        self.data.interestRateModel = interestRateModelAddress


    """    
        accrues interest and sets a new reserve factor for the protocol

        dev: Governance function to accrue interest and set a new reserve factor

        newReserveFactor: TNat - New reserve factor value
    """
    @sp.entry_point
    def setReserveFactor(self, newReserveFactor):
        sp.set_type(newReserveFactor, sp.TNat)
        self.verifyAdministrator()
        self.activateNewOp(OP.CTokenOperations.RESERVE_FACTOR)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(newReserveFactor, sp.mutez(0), sp.self_entry_point("setReserveFactorInternal"))


    @sp.entry_point
    def setReserveFactorInternal(self, newReserveFactor):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.RESERVE_FACTOR)
        self.verifyBlockNumber()
        sp.verify(newReserveFactor <= self.data.reserveFactorMaxMantissa, "Check newReserveFactorMantissa ≤ maxReserveFactorMantissa is not passed")
        self.data.reserveFactorMantissa = newReserveFactor


    """    
        Accrues interest and adds reserves by transferring from admin

        amount: TNat - Amount of reserves to add
    """
    @sp.entry_point
    def addReserves(self, amount):
        sp.set_type(amount, sp.TNat)
        self.verifyNotInternal()
        self.activateNewOp(OP.CTokenOperations.ADD_RESERVES)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(originalSender = sp.sender, addAmount = amount), sp.amount, sp.self_entry_point("addReservesInternal"))    

    @sp.entry_point
    def addReservesInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.ADD_RESERVES)
        self.verifyBlockNumber()
        self.doTransferIn(params.originalSender, params.addAmount)
        self.data.totalReserves += params.addAmount


    """    
        Accrues interest and reduces reserves by transferring to admin

        amount: TNat - Amount of reduction to reserves
    """
    @sp.entry_point
    def reduceReserves(self, amount):
        sp.set_type(amount, sp.TNat)
        self.verifyAdministrator()
        self.activateNewOp(OP.CTokenOperations.REDUCE_RESERVES)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("accrueInterest"))
        sp.transfer(amount, sp.amount, sp.self_entry_point("reduceReservesInternal")) 

    @sp.entry_point
    def reduceReservesInternal(self, amount):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.REDUCE_RESERVES)
        self.checkCash(amount)
        sp.verify(amount <= self.data.totalReserves, "reduce reserves validation failed, reduceAmount > totalReserves")

        # Store reserves[n+1] = reserves[n] - reduceAmount
        self.data.totalReserves = self.sub_nat_nat(self.data.totalReserves, amount)
        self.doTransferOut(self.data.administrator, amount)

    # Helpers
    def undefinedAddress(self):
        return sp.address("KT10")

    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, "This is governance function, sender must be administrator")

    def checkCash(self, amount):
        self.verifyBlockNumber()
        sp.verify(self.getCashImpl() >= amount, "Protocol has insufficient cash")

    def verifyBlockNumber(self):
        sp.verify(self.data.accrualBlockNumber == sp.level, "Market's block number should be equal to current block number")

    def verifyInternal(self):
        sp.verify(sp.sender == sp.self_address, "Internal function")

    def verifyNotInternal(self):
        sp.verify(sp.sender != sp.self_address, "The function should not be used as an internal callback")

    def getActualAmount(self, amount, isUnderlying, adjustment):
        exchangeRate = self.exchangeRateAdjusted(adjustment)
        actual_amount = sp.local("amount", sp.nat(0))
        sp.if isUnderlying:
            actual_amount.value = sp.compute(self.div_nat_exp(amount, self.makeExp(exchangeRate)))
        sp.else:
            actual_amount.value = sp.compute(self.mulScalarTruncate(self.makeExp(exchangeRate), amount))
        return actual_amount.value

    def getRedeemAmount(self, amount, isUnderlying):
        redeem_amount = sp.local("redeem_amount", sp.nat(0))
        sp.if isUnderlying:
            redeem_amount.value = amount
        sp.else:
            redeem_amount.value = self.getActualAmount(amount, False, sp.nat(0))
        return redeem_amount.value

    def getRedeemTokens(self, amount, isUnderlying):
        redeem_tokens = sp.local("redeem_tokens", sp.nat(0))
        sp.if isUnderlying:
            redeem_tokens.value = self.getActualAmount(amount, True, sp.nat(0))
        sp.else:
            redeem_tokens.value = amount
        return redeem_tokens.value

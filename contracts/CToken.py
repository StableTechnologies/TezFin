import smartpy as sp

CTErrors = sp.io.import_script_from_url(
    "file:contracts/errors/CTokenErrors.py")
EC = CTErrors.ErrorCodes

CTI = sp.io.import_script_from_url(
    "file:contracts/interfaces/CTokenInterface.py")
IRMI = sp.io.import_script_from_url(
    "file:contracts/interfaces/InterestRateModelInterface.py")
CMPI = sp.io.import_script_from_url(
    "file:contracts/interfaces/ComptrollerInterface.py")
Exponential = sp.io.import_script_from_url(
    "file:contracts/utils/Exponential.py")
SweepTokens = sp.io.import_script_from_url(
    "file:contracts/utils/SweepTokens.py")
OP = sp.io.import_script_from_url("file:contracts/utils/OperationProtector.py")


class CToken(CTI.CTokenInterface, Exponential.Exponential, SweepTokens.SweepTokens, OP.OperationProtector):
    """
        Parameters
        ----------
        scale_ :  CToken's scale.
        underlyingScale_ : Underlying's scale.
    """
    def __init__(self, scale_, underlyingScale_, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, **extra_storage):
        Exponential.Exponential.__init__(
            self,
            balances=sp.big_map(tkey=sp.TAddress, tvalue=sp.TRecord(
                # Approved token transfer amounts on behalf of others
                approvals=sp.TMap(sp.TAddress, sp.TNat),
                # Mapping of account addresses to outstanding borrow balances
                accountBorrows=CTI.TBorrowSnapshot,
                balance=sp.TNat)),  # Official record of token balances for each account
            totalSupply=sp.nat(0),  # Total number of tokens in circulation
            # Maximum borrow rate that can ever be applied (.00000008% / block)
            borrowRateMaxMantissa=sp.nat(int(80000000000)),
            # Maximum fraction of interest that can be set aside for reserves
            reserveFactorMaxMantissa=sp.nat(int(1e18)),
            comptroller=comptroller_,  # Contract which oversees inter-cToken operations
            # Model which tells what the current interest rate should be
            interestRateModel=interestRateModel_,
            # Initial exchange rate used when minting the first CTokens
            initialExchangeRateMantissa=initialExchangeRateMantissa_,
            # Fraction of interest currently set aside for reserves
            reserveFactorMantissa=sp.nat(50000000000000000), # 5%
            # protocol share for sezied asstes
            protocolSeizeShareMantissa=sp.nat(100000000000000), #0.01%
            # Block number that interest was last accrued at
            accrualBlockNumber=sp.nat(0),
            # Accumulator of the total earned interest rate since the opening of the market
            borrowIndex=sp.nat(int(1e18)),
            # Total amount of outstanding borrows of the underlying in this market
            totalBorrows=sp.nat(0),
            # Total amount of reserves of the underlying held in this market
            totalReserves=sp.nat(0),
            # Current per-block borrow interest rate
            borrowRatePerBlock=sp.nat(0),
            # Current per-block supply interest rate
            supplyRatePerBlock=sp.nat(0),
            administrator=administrator_,  # Administrator`s address for this contract
            pendingAdministrator=sp.none,  # Pending administrator`s address for this contract
            # Set of currently active operations to protect execution flow
            activeOperations=sp.set(t=sp.TNat),
            underlyingScale=underlyingScale_,
            scale=scale_,
            **extra_storage
        )

    """    
        Sender supplies assets into the market and receives cTokens in exchange

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The amount of the underlying asset to supply

        requirements: 
            accrueInterest() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def mint(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.verifyMintAllowed(sp.sender, params)
        self.mintInternal(sp.record(minter=sp.sender, mintAmount=params))

    def mintInternal(self, params):
        self.verifyAccruedInterestRelevance()
        self.doTransferIn(params.minter, params.mintAmount)
        mintTokens = self.getMintTokens(params.mintAmount)
        self.data.totalSupply += mintTokens
        self.data.balances[params.minter].balance += mintTokens

    def verifyMintAllowed(self, minter_, mintAmount_):
        self.addAddressIfNecessary(minter_)
        c = sp.contract(CMPI.TMintAllowedParams, self.data.comptroller,
                        entry_point="mintAllowed").open_some()
        transferData = sp.record(
            cToken=sp.self_address, minter=minter_, mintAmount=mintAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    def getMintTokens(self, mintAmount):
        return self.getActualAmount(mintAmount, True, sp.nat(0))

    def doTransferIn(self, from_, amount):  # override
        pass

    """    
        Sender redeems cTokens in exchange for the underlying asset

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The number of cTokens to redeem into underlying

        requirements:
            CToken:
                accrueInterest() should be executed within 5 blocks prior to this call
            comptroller:
                updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
                updateAccountLiquidity() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def redeem(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.verifyRedeemAllowed(sp.sender, params)
        self.redeemInternal(sp.record(redeemer=sp.sender,
                            redeemAmount=params, isUnderlying=False))

    """    
        Sender redeems cTokens in exchange for a specified amount of underlying asset

        dev: Accrues interest whether or not the operation succeeds, unless reverted

        params: TNat - The amount of underlying to redeem

        requirements:
            CToken:
                accrueInterest() should be executed within 5 blocks prior to this call
            comptroller:
                updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
                updateAccountLiquidity() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def redeemUnderlying(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.verifyRedeemAllowed(sp.sender, params)
        self.redeemInternal(sp.record(redeemer=sp.sender,
                            redeemAmount=params, isUnderlying=True))

    def redeemInternal(self, params):
        redeemAmount = self.getRedeemAmount(
            params.redeemAmount, params.isUnderlying)
        redeemTokens = self.getRedeemTokens(
            params.redeemAmount, params.isUnderlying)
        self.checkCash(redeemAmount)
        self.verifyAccruedInterestRelevance()
        self.data.totalSupply = sp.as_nat(
            self.data.totalSupply - redeemTokens, "Insufficient supply")
        self.data.balances[params.redeemer].balance = sp.as_nat(
            self.data.balances[params.redeemer].balance - redeemTokens, "Insufficient balance")
        self.doTransferOut(params.redeemer, redeemAmount)

    def verifyRedeemAllowed(self, redeemer_, redeemAmount_):
        c = sp.contract(CMPI.TRedeemAllowedParams, self.data.comptroller,
                        entry_point="redeemAllowed").open_some()
        transferData = sp.record(
            cToken=sp.self_address, redeemer=redeemer_, redeemAmount=redeemAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    def doTransferOut(self, to_, amount, isContract=False):  # override
        pass

    """    
        Sender borrows assets from the protocol to their own address

        params: TNat - The amount of the underlying asset to borrow

        requirements:
            cToken: 
                accrueInterest() should be executed within 5 blocks prior to this call
            comptroller:
                updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
                updateAccountLiquidity() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def borrow(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.verifyBorrowAllowed(sp.sender, params)
        self.borrowInternal(sp.record(borrower=sp.sender, borrowAmount=params))

    def borrowInternal(self, params):
        self.checkCash(params.borrowAmount)
        self.verifyAccruedInterestRelevance()
        self.doTransferOut(params.borrower, params.borrowAmount)
        accountBorrows = self.getBorrowBalance(
            params.borrower) + params.borrowAmount
        self.data.balances[params.borrower].accountBorrows.principal = accountBorrows
        self.data.balances[params.borrower].accountBorrows.interestIndex = self.data.borrowIndex
        self.data.totalBorrows += params.borrowAmount

    def verifyBorrowAllowed(self, borrower_, borrowAmount_):
        self.addAddressIfNecessary(borrower_)
        c = sp.contract(CMPI.TBorrowAllowedParams, self.data.comptroller,
                        entry_point="borrowAllowed").open_some()
        transferData = sp.record(
            cToken=sp.self_address, borrower=borrower_, borrowAmount=borrowAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    """    
        Sender repays their own borrow

        params: TNat - The amount to repay

        requirements: 
            accrueInterest() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def repayBorrow(self, params):
        sp.set_type(params, sp.TNat)
        self.verifyNotInternal()
        self.verifyRepayBorrowAllowed(sp.sender, sp.sender, params)
        self.repayBorrowInternal(
            sp.record(payer=sp.sender, borrower=sp.sender, repayAmount=params))

    """    
        Sender repays a borrow belonging to borrower

        params: TRecord
            borrower: TAddress - The account with the debt being payed off
            repayAmount: TNat - The amount to repay
        
        requirements:
            accrueInterest() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def repayBorrowBehalf(self, params):
        sp.set_type(params, sp.TRecord(
            borrower=sp.TAddress, repayAmount=sp.TNat))
        self.verifyNotInternal()
        self.verifyRepayBorrowAllowed(
            sp.sender, params.borrower, params.repayAmount)
        self.repayBorrowInternal(sp.record(
            payer=sp.sender, borrower=params.borrower, repayAmount=params.repayAmount))

    def repayBorrowInternal(self, params):
        self.verifyAccruedInterestRelevance()
        accountBorrows = self.getBorrowBalance(params.borrower)
        repayAmount = sp.min(accountBorrows, params.repayAmount)
        self.doTransferIn(params.payer, repayAmount)
        self.data.balances[params.borrower].accountBorrows.principal = self.sub_nat_nat(
            accountBorrows, repayAmount)
        self.data.balances[params.borrower].accountBorrows.interestIndex = self.data.borrowIndex
        self.data.totalBorrows = self.sub_nat_nat(
            self.data.totalBorrows, repayAmount)
        sp.if self.data.balances[params.borrower].accountBorrows.principal == 0:
            c = sp.contract(sp.TAddress, self.data.comptroller,
                            entry_point="removeFromLoans").open_some()
            sp.transfer(params.borrower, sp.mutez(0), c)

    def verifyRepayBorrowAllowed(self, payer_, borrower_, repayAmount_):
        self.addAddressIfNecessary(payer_)
        c = sp.contract(CMPI.TRepayBorrowAllowedParams, self.data.comptroller,
                        entry_point="repayBorrowAllowed").open_some()
        transferData = sp.record(
            cToken=sp.self_address, payer=payer_, borrower=borrower_, repayAmount=repayAmount_)
        sp.transfer(transferData, sp.mutez(0), c)

    """    
        Transfers collateral tokens (this market) to the liquidator.

        * @dev Will fail unless called by another cToken during the process of liquidation.
        *  Its absolutely critical to use msg.sender as the borrowed cToken and not a parameter.
        * @param liquidator The account receiving seized collateral
        * @param borrower The account having collateral seized
        * @param seizeTokens The number of cTokens to seize
    """
    @sp.entry_point
    def seize(self, params):
        sp.set_type(params, CTI.TSeize)
        self.seizeInternal(sp.sender, params.liquidator,
                           params.borrower, params.seizeTokens)

    def seizeInternal(self, seizerToken, liquidator, borrower, seizeTokens):
        self.addAddressIfNecessary(liquidator)
        seizeAllowed = sp.view("seizeAllowed", self.data.comptroller, sp.record(cTokenCollateral=sp.self_address, cTokenBorrowed=seizerToken),
                               t=sp.TBool).open_some("INVALID SEIZE ALLOWED VIEW")
        sp.verify(seizeAllowed, EC.CT_LIQUIDATE_SEIZE_COMPTROLLER_REJECTION)

        sp.verify(borrower != liquidator,
                  EC.CT_LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER)

        borrowerBalance = self.data.balances[borrower].balance
        liquidatorBalance = self.data.balances[liquidator].balance

        borrowerTokensNew = self.sub_nat_nat(borrowerBalance, seizeTokens)

        protocolSeizeTokens = sp.local("protocolSeizeTokens", self.mul_nat_exp(
            seizeTokens, self.makeExp(self.data.protocolSeizeShareMantissa)))

        liquidatorSeizeTokens = self.sub_nat_nat(
            seizeTokens, protocolSeizeTokens.value)

        exchangeRate = self.makeExp(self.exchangeRateStoredImpl())

        protocolSeizeAmount = self.mulScalarTruncate(
            exchangeRate, protocolSeizeTokens.value)

        totalReservesNew = self.add_nat_nat(self.data.totalReserves,
                                            protocolSeizeAmount)

        totalSupplyNew = self.sub_nat_nat(
            self.data.totalSupply, protocolSeizeTokens.value)

        liquidatorTokensNew = self.add_nat_nat(
            liquidatorBalance, liquidatorSeizeTokens)

        self.data.totalReserves = totalReservesNew
        self.data.totalSupply = totalSupplyNew
        self.data.balances[borrower].balance = borrowerTokensNew
        self.data.balances[liquidator].balance = liquidatorTokensNew

    """
        The sender liquidates the borrowers collateral.
        The collateral seized is transferred to the liquidator.
        @param borrower The borrower of this cToken to be liquidated
        @param cTokenCollateral The market in which to seize collateral from the borrower
        @param repayAmount The amount of the underlying borrowed asset to repay

        need to perform accrue interest before calling this
    """

    @sp.entry_point
    def liquidateBorrow(self, params):
        sp.set_type(params, CTI.TLiquidate)

        self.liquidateBorrowFresh(
            sp.sender, params.borrower, params.repayAmount, params.cTokenCollateral)

    def liquidateBorrowFresh(self, liquidator, borrower, repayAmount, cTokenCollateral):
        allowed = sp.view("liquidateBorrowAllowed", self.data.comptroller, sp.record(
            cTokenBorrowed=sp.self_address, cTokenCollateral=cTokenCollateral, borrower=borrower, liquidator=liquidator, repayAmount=repayAmount),
            t=sp.TBool).open_some("INVALID LIQUIDATE BORROW ALLOWED VIEW")
        sp.verify(allowed, EC.CT_LIQUIDATE_COMPTROLLER_REJECTION)

        self.verifyAccruedInterestRelevance()

        accrualBlockNumber = sp.view("accrualBlockNumber", cTokenCollateral, sp.unit,
                                     t=sp.TNat).open_some("INVALID ACCRUAL BLOCK NUMBER VIEW")

        sp.verify(sp.level == accrualBlockNumber, EC.CT_INTEREST_OLD)

        sp.verify(borrower != liquidator,
                  EC.CT_LIQUIDATE_LIQUIDATOR_IS_BORROWER)

        sp.verify(repayAmount > 0, EC.CT_LIQUIDATE_CLOSE_AMOUNT_IS_INVALID)

        self.repayBorrowInternal(
            sp.record(payer=liquidator, borrower=borrower, repayAmount=repayAmount))

        seizeTokens = sp.view("liquidateCalculateSeizeTokens", self.data.comptroller, sp.record(
            cTokenBorrowed=sp.self_address, cTokenCollateral=cTokenCollateral, actualRepayAmount=repayAmount),
            t=sp.TNat).open_some("INVALID LIQUIDATE CALC SEIZE TOKEN VIEW")

        borrowerBalance = sp.view("balanceOf", cTokenCollateral, borrower,
                                  t=sp.TNat).open_some("INVALID BALANCE OF VIEW")

        sp.verify(borrowerBalance >= seizeTokens, "LIQUIDATE_SEIZE_TOO_MUCH")

        destination = sp.contract(
            CTI.TSeize, cTokenCollateral, "seize").open_some()
        sp.transfer(sp.record(liquidator=liquidator, borrower=borrower,
                    seizeTokens=seizeTokens), sp.mutez(0), destination)

    """    
        Transfer `value` tokens from `from_` to `to_`

        params: TRecord
            from_: TAddress - The address of the source account
            to_: TAddress - The address of the destination account
            value: TNat - The number of tokens to transfer
        
        requirements:
            comptroller:
                updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
                updateAccountLiquidity() should be executed within 5 blocks prior to this call
    """
    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, sp.TRecord(from_=sp.TAddress, to_=sp.TAddress,
                    value=sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
        sp.verify((params.from_ == sp.sender) |
                  (self.data.balances[params.from_].approvals[sp.sender] >= params.value), EC.CT_TRANSFER_NOT_APPROVED)
        self.verifyTransferAllowed(params.from_, params.to_, params.value)
        self.transferInternal(sp.record(
            from_=params.from_, to_=params.to_, value=params.value, sender=sp.sender))

    def transferInternal(self, params):
        sp.set_type(params, sp.TRecord(from_=sp.TAddress,
                    to_=sp.TAddress, value=sp.TNat, sender=sp.TAddress))
        sp.verify(self.data.balances[params.from_].balance >=
                  params.value, EC.CT_INSUFFICIENT_BALANCE)
        self.data.balances[params.from_].balance = sp.as_nat(
            self.data.balances[params.from_].balance - params.value)
        self.data.balances[params.to_].balance += params.value
        sp.if (params.from_ != params.sender):
            self.data.balances[params.from_].approvals[params.sender] = sp.as_nat(
                self.data.balances[params.from_].approvals[params.sender] - params.value)

    def verifyTransferAllowed(self, src_, dst_, transferTokens_):
        self.addAddressIfNecessary(dst_)
        c = sp.contract(CMPI.TTransferAllowedParams, self.data.comptroller,
                        entry_point="transferAllowed").open_some()
        transferData = sp.record(
            cToken=sp.self_address, src=src_, dst=dst_, transferTokens=transferTokens_)
        sp.transfer(transferData, sp.mutez(0), c)

    def addAddressIfNecessary(self, address):
        sp.if ~ self.data.balances.contains(address):
            self.data.balances[address] = sp.record(balance=sp.nat(0), approvals={
            }, accountBorrows=sp.record(principal=sp.nat(0), interestIndex=sp.nat(0)))

    """    
        Approve `spender` to transfer up to `amount` from `sp.sender`

        params: TRecord
            spender: TAddress - The address of the account which may transfer tokens
            value: TNat - The number of tokens that are approved
    """
    @sp.entry_point(lazify=True)
    def approve(self, params):
        sp.set_type(params, sp.TRecord(spender=sp.TAddress,
                    value=sp.TNat).layout(("spender", "value")))
        self.verifyNotInternal()
        alreadyApproved = self.data.balances[sp.sender].approvals.get(
            params.spender, 0)
        sp.verify((alreadyApproved == 0) | (params.value == 0),
                  EC.CT_UNSAFE_ALLOWANCE_CHANGE)
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
        Get the CToken balance of the account specified in `params`

        params: TAddress - The address of the account to query

        return: The number of tokens owned by `params`
    """
    @sp.onchain_view()
    def balanceOf(self, params):
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
        balance = self.mulScalarTruncate(
            exchangeRate, self.data.balances[params].balance)
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
        accSnapshot = sp.compute(sp.record(
            account=params,
            cTokenBalance=sp.nat(0),
            borrowBalance=sp.nat(0),
            exchangeRateMantissa=sp.nat(0)
        ))
        sp.if self.data.balances.contains(params):
            self.verifyAccruedInterestRelevance()
            accSnapshot.cTokenBalance = self.data.balances[params].balance
            accSnapshot.borrowBalance = self.getBorrowBalance(params)
            accSnapshot.exchangeRateMantissa = self.exchangeRateStoredImpl()
        sp.result(accSnapshot)

    """    
        Get a snapshot of the account's balances, and the cached exchange rate

        dev: This is used by comptroller to more efficiently perform liquidity checks.
        dev: Do accrueInterest() before this function to get the up-to-date balance

        params: TAddress - The address of the account to snapshot

        return: TAccountSnapshot - account balance information
    """
    @sp.onchain_view()
    def getAccountSnapshotView(self, params):
        accSnapshot = sp.compute(sp.record(
            account=params,
            cTokenBalance=sp.nat(0),
            borrowBalance=sp.nat(0),
            exchangeRateMantissa=sp.nat(0)
        ))
        sp.if self.data.balances.contains(params):
            self.verifyAccruedInterestRelevance()
            accSnapshot.cTokenBalance = self.data.balances[params].balance
            accSnapshot.borrowBalance = self.getBorrowBalance(params)
            accSnapshot.exchangeRateMantissa = self.exchangeRateStoredImpl()
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
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point(
            "updateBorrowRateInternal"))

    @sp.entry_point
    def updateBorrowRateInternal(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.BORROW_RATE)
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel,
                        entry_point="getBorrowRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves,
                                 cb=sp.self_entry_point("setBorrowRatePerBlock"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point(lazify=True)
    def setBorrowRatePerBlock(self, value):
        self.verifyIRM()
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
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point(
            "updateSupplyRateInternal"))

    @sp.entry_point
    def updateSupplyRateInternal(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyInternal()
        self.verifyActiveOp(OP.CTokenOperations.SUPPLY_RATE)
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel,
                        entry_point="getSupplyRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves, 
                                 cb=sp.self_entry_point("setSupplyRatePerBlock"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point(lazify=True)
    def setSupplyRatePerBlock(self, value):
        supplyScale = sp.view("getScale",self.data.interestRateModel,
                                    sp.unit, 
                                    t=sp.TNat
                                    ).open_some("INVALID COMPTROLLER VIEW")
        supplyRatePerBlock = self.rescale(value,supplyScale,self.data.expScale)
        self.verifyIRM()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.SUPPLY_RATE)
        self.data.supplyRatePerBlock = supplyRatePerBlock

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

    """    
        Return the borrow balance of account based on stored data

        dev: Do accrueInterest() before this function to get the up-to-date borrow balance

        params: TAddress - The address whose balance should be calculated

        return: The calculated balance
    """
    @sp.onchain_view()
    def borrowBalanceStoredView(self, params):
        sp.set_type(params, sp.TAddress)
        sp.result(self.getBorrowBalance(params))

    def getBorrowBalance(self, account):
        borrowSnapshot = sp.local(
            'borrowSnapshot', self.data.balances[account].accountBorrows)
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

    """    
        Calculates the exchange rate from the underlying to the CToken

        dev: This function does not accrue interest before calculating the exchange rate
        dev: Do accrueInterest() before this function to get the up-to-date exchange rate

        params: TUnit

        return: Calculated exchange rate scaled by 1e18
    """
    @sp.onchain_view()
    def exchangeRateStoredView(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.exchangeRateStoredImpl())

    def exchangeRateStoredImpl(self):
        return self.exchangeRateAdjusted(sp.nat(0))

    def exchangeRateAdjusted(self, adjustment):
        excRate = sp.local('excRate', self.data.initialExchangeRateMantissa)
        sp.if self.data.totalSupply > 0:
            cash = self.sub_nat_nat(self.getCashImpl(), adjustment)
            cashPlusBorrowsMinusReserves = sp.as_nat(
                cash + self.data.totalBorrows - self.data.totalReserves)
            exchangeRate = self.div_exp_nat(self.toExp(
                cashPlusBorrowsMinusReserves), self.data.totalSupply)
            excRate.value = exchangeRate.mantissa
        return excRate.value

    @sp.onchain_view()
    def comptroller(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.comptroller)

    @sp.onchain_view()
    def accrualBlockNumber(self, params):
        sp.set_type(params, sp.TUnit)
        sp.result(self.data.accrualBlockNumber)

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

    def getCashImpl(self):  # override
        pass

    def updateCash(self):  # override
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
            self.accrueInterestInternal(params)

    def accrueInterestInternal(self, params):
        c = sp.contract(IRMI.TBorrowRateParams, self.data.interestRateModel,
                        entry_point="getBorrowRate").open_some()
        transferData = sp.record(cash=self.getCashImpl(),
                                 borrows=self.data.totalBorrows,
                                 reserves=self.data.totalReserves, 
                                 cb=sp.self_entry_point("doAccrueInterest"))
        sp.transfer(transferData, sp.mutez(0), c)

    @sp.entry_point(lazify=True)
    def doAccrueInterest(self, borrowRateMantissa):
        sp.set_type(borrowRateMantissa, sp.TNat)
        self.verifyIRM()
        borrowScale = sp.view("getScale",self.data.interestRateModel,
                                    sp.unit, 
                                    t=sp.TNat
                                    ).open_some("INVALID COMPTROLLER VIEW")
        borrowRateRescaled = self.rescale(borrowRateMantissa, borrowScale, self.data.scaleUnderlying)
        self.verifyAndFinishActiveOp(OP.CTokenOperations.ACCRUE)
        sp.verify(borrowRateRescaled <=
                  self.data.borrowRateMaxMantissa, EC.CT_INVALID_BORROW_RATE)
        cash = self.getCashImpl()
        blockDelta = sp.as_nat(sp.level - self.data.accrualBlockNumber)

        simpleInterestFactor = sp.compute(self.mul_exp_nat(
            self.makeExp(borrowRateRescaled), blockDelta))
        interestAccumulated = sp.compute(self.mulScalarTruncate(
            simpleInterestFactor, self.data.totalBorrows))
        self.data.totalBorrows = interestAccumulated + self.data.totalBorrows
        self.data.totalReserves = self.mulScalarTruncateAdd(sp.record(mantissa=self.data.reserveFactorMantissa),
                                                            interestAccumulated,
                                                            self.data.totalReserves)
        self.data.borrowIndex = self.mulScalarTruncateAdd(
            simpleInterestFactor, self.data.borrowIndex, self.data.borrowIndex)
        self.data.accrualBlockNumber = sp.level

 # Admin Functions

    """    
        Sets a new pending governance for the market

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance contract
    """
    @sp.entry_point(lazify=True)
    def setPendingGovernance(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.some(pendingAdminAddress)

    """    
        Sets a new protocol seize share mantissa

        params: TNat - protocol seize share mantissa
    """
    @sp.entry_point(lazify=True)
    def updateProtocolSeizeShare(self, protocolSeizeShareMantissa):
        sp.set_type(protocolSeizeShareMantissa, sp.TNat)
        self.verifyAdministrator()
        self.data.protocolSeizeShareMantissa = protocolSeizeShareMantissa

    """    
        Accept a new governance for the market

        dev: Governance function to set a new governance

        params: TUnit
    """
    @sp.entry_point(lazify=True)
    def acceptGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator.open_some(
            EC.CT_NOT_SET_PENDING_ADMIN), EC.CT_NOT_PENDING_ADMIN)
        self.data.administrator = self.data.pendingAdministrator.open_some()
        self.data.pendingAdministrator = sp.none

    """    
        Remove pending governance for the market

        dev: Governance function to set a remove pending governance

        params: TUnit
    """
    @sp.entry_point(lazify=True)
    def removePendingGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.none

    """    
        Sets a new comptroller for the market

        dev: Governance function to set a new comptroller

        comptrollerAddress: TAddress - The address of the new comptroller contract
    """
    @sp.entry_point(lazify=True)
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
        sp.transfer(sp.unit, sp.mutez(
            0), sp.self_entry_point("accrueInterest"))
        sp.transfer(interestRateModelAddress, sp.mutez(
            0), sp.self_entry_point("setInterestRateModelInternal"))

    @sp.entry_point(lazify=True)
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
        sp.transfer(sp.unit, sp.mutez(
            0), sp.self_entry_point("accrueInterest"))
        sp.transfer(newReserveFactor, sp.mutez(
            0), sp.self_entry_point("setReserveFactorInternal"))

    @sp.entry_point(lazify=True)
    def setReserveFactorInternal(self, newReserveFactor):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.RESERVE_FACTOR)
        self.verifyAccruedInterestRelevance()
        sp.verify(newReserveFactor <= self.data.reserveFactorMaxMantissa,
                  EC.CT_INVALID_RESERVE_FACTOR)
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
        sp.transfer(sp.unit, sp.mutez(
            0), sp.self_entry_point("accrueInterest"))
        sp.transfer(sp.record(originalSender=sp.sender, addAmount=amount),
                    sp.amount, sp.self_entry_point("addReservesInternal"))

    @sp.entry_point
    def addReservesInternal(self, params):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.ADD_RESERVES)
        self.verifyAccruedInterestRelevance()
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
        sp.transfer(sp.unit, sp.mutez(
            0), sp.self_entry_point("accrueInterest"))
        sp.transfer(amount, sp.amount, sp.self_entry_point(
            "reduceReservesInternal"))

    @sp.entry_point(lazify=True)
    def reduceReservesInternal(self, amount):
        self.verifyInternal()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.REDUCE_RESERVES)
        self.checkCash(amount)
        sp.verify(amount <= self.data.totalReserves, EC.CT_REDUCE_AMOUNT)

        # Store reserves[n+1] = reserves[n] - reduceAmount
        self.data.totalReserves = self.sub_nat_nat(
            self.data.totalReserves, amount)
        self.doTransferOut(self.data.administrator, amount, True)

    # Helpers
    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, EC.CT_NOT_ADMIN)

    def checkCash(self, amount):
        sp.verify(self.getCashImpl() >= amount, EC.CT_INSUFFICIENT_CASH)

    def verifyAccruedInterestRelevance(self):
        sp.verify(sp.level == self.data.accrualBlockNumber, EC.CT_INTEREST_OLD)

    def verifyInternal(self):
        sp.verify(sp.sender == sp.self_address, EC.CT_INTERNAL_FUNCTION)

    def verifyNotInternal(self):
        sp.verify(sp.sender != sp.self_address, EC.CT_INTERNAL_CALL)

    def verifyIRM(self):
        sp.verify(sp.sender == self.data.interestRateModel,
                  EC.CT_SENDER_NOT_IRM)

    def getActualAmount(self, amount, isUnderlying, adjustment):
        exchangeRate = self.exchangeRateAdjusted(adjustment)
        actual_amount = sp.local("amount", sp.nat(0))
        sp.if isUnderlying:
            actual_amount.value = sp.compute(
                self.div_nat_exp(amount, self.makeExp(exchangeRate)))
        sp.else:
            actual_amount.value = sp.compute(
                self.mulScalarTruncate(self.
                    makeExp(exchangeRate), amount))
        return actual_amount.value

    def getRedeemAmount(self, amount, isUnderlying):
        redeem_amount = sp.local("redeem_amount", sp.nat(0))
        sp.if isUnderlying:
            redeem_amount.value = amount
        sp.else:
            redeem_amount.value = self.getActualAmount(
                amount, False, sp.nat(0))
        return redeem_amount.value

    def getRedeemTokens(self, amount, isUnderlying):
        redeem_tokens = sp.local("redeem_tokens", sp.nat(0))
        sp.if isUnderlying:
            redeem_tokens.value = self.getActualAmount(amount, True, sp.nat(0))
        sp.else:
            redeem_tokens.value = amount
        return redeem_tokens.value

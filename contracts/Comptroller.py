import smartpy as sp

CMPTErrors = sp.io.import_script_from_url(
    "file:contracts/errors/ComptrollerErrors.py")
EC = CMPTErrors.ErrorCodes

CTI = sp.io.import_script_from_url(
    "file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/ComptrollerInterface.py")
OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")
Exponential = sp.io.import_script_from_url(
    "file:contracts/utils/Exponential.py")
OP = sp.io.import_script_from_url("file:contracts/utils/OperationProtector.py")

SweepTokens = sp.io.import_script_from_url(
    "file:contracts/utils/SweepTokens.py")

TMarket = sp.TRecord(isListed=sp.TBool,  # Whether or not this market is listed
                     # Multiplier representing the most one can borrow against their collateral in this market.
                     collateralFactor=Exponential.TExp,
                     # For instance, 0.9 to allow borrowing 90% of collateral value.
                     # Must be between 0 and 1, and stored as a mantissa.
                     mintPaused=sp.TBool,
                     borrowPaused=sp.TBool,
                     name=sp.TString,  # Asset name for price oracle
                     price=Exponential.TExp,  # The price of the asset
                     priceExp=sp.TNat,  # exponent needed to normalize the token prices to 10^18
                     updateLevel=sp.TNat,  # Block level of last price update
                     priceTimestamp=sp.TTimestamp  # timestamp when the price was posted to the oracle
                     )

TLiquidity = sp.TRecord(
    liquidity=sp.TInt,  # Current account liquidity. Negative value indicates shortfall
    updateLevel=sp.TNat,  # Block level of last update
    valid=sp.TBool  # Liquidity is valid only for one user action
)

DEFAULT_COLLATERAL_FACTOR = int(5e17)  # 50 %


class Comptroller(CMPTInterface.ComptrollerInterface, Exponential.Exponential, SweepTokens.SweepTokens, OP.OperationProtector):
    def __init__(self, administrator_, oracleAddress_, closeFactorMantissa_, liquidationIncentiveMantissa_, maxAssetsPerUser_=15, **extra_storage):
        Exponential.Exponential.__init__(
            self,
            administrator=administrator_,
            pendingAdministrator=sp.none,
            # Official mapping of cTokens -> Market metadata. Used e.g. to determine if a market is supported
            markets=sp.big_map(l={}, tkey=sp.TAddress, tvalue=TMarket),
            # The mapping of Market names -> CToken
            marketNameToAddress=sp.map(tkey=sp.TString, tvalue=sp.TAddress),
            transferPaused=sp.bool(True),
            # Per-account mapping of collaterals, capped by maxAssets
            collaterals=sp.big_map(
                l={}, tkey=sp.TAddress, tvalue=sp.TSet(sp.TAddress)),
            # Per-account mapping of loans, capped by maxAssets
            loans=sp.big_map(l={}, tkey=sp.TAddress,
                             tvalue=sp.TSet(sp.TAddress)),
            # Per-account mapping of current liquidity
            account_liquidity=sp.big_map(
                l={}, tkey=sp.TAddress, tvalue=TLiquidity),
            oracleAddress=oracleAddress_, # can only use harbinger or harbinger like oracle
            # Set of currently active operations to protect execution flow
            activeOperations=sp.set(t=sp.TNat),
            closeFactorMantissa=closeFactorMantissa_,
            liquidationIncentiveMantissa=liquidationIncentiveMantissa_,
            maxPriceTimeDifference = sp.int(86400),
            maxAssetsPerUser=maxAssetsPerUser_,
            **extra_storage
        )

    """
        Add assets to be included in account liquidity calculation

        cTokens: TList(TAddress) - The list of addresses of the cToken markets to be enabled
    """
    @sp.entry_point(lazify=True)
    def enterMarkets(self, cTokens):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(cTokens, sp.TList(sp.TAddress))
        currentAssetCount = sp.local("currentAssetCount", self.getUserUniqueAssetsCount(sp.sender))
        sp.for token in cTokens:
            sp.if self.isNewAssetForUser(sp.sender, token):
                sp.verify(currentAssetCount.value < self.data.maxAssetsPerUser, EC.CMPT_TOO_MANY_ASSETS)
                currentAssetCount.value += 1
            self.addToCollaterals(token, sp.sender)
        self.invalidateLiquidity(sp.sender)

    def addToCollaterals(self, cToken, lender):
        self.verifyMarketListed(cToken)
        sp.if self.data.collaterals.contains(lender):
            self.data.collaterals[lender].add(cToken)
        sp.else:
            self.data.collaterals[lender] = sp.set([cToken])

    """
        Removes asset from sender's account liquidity calculation

        requirements:
            updateAssetPrice() should be executed within the same block prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within the same block prior to this call

        dev: Sender must not have an outstanding borrow balance in the asset,
             or be providing necessary collateral for an outstanding borrow

        cToken: TAddress - The address of the asset to be removed
    """
    @sp.entry_point
    def exitMarket(self, cToken):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(cToken, sp.TAddress)
        self.activateOp(OP.ComptrollerOperations.EXIT_MARKET)

        destination = sp.contract(sp.TPair(sp.TAddress, sp.TContract(
            CTI.TAccountSnapshot)), cToken, "getAccountSnapshot").open_some()
        sp.transfer(sp.pair(sp.sender, sp.self_entry_point(
            "setAccountSnapAndExitMarket")), sp.mutez(0), destination)

    """
        Helper for exitMarket. Must be called only by underlying cToken.getAccountSnapshot viewer within exitMarket action 

        accountSnapshot: TAccountSnapshot - Container for account balance information
    """
    @sp.entry_point(lazify=True)
    def setAccountSnapAndExitMarket(self, accountSnapshot):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(accountSnapshot, CTI.TAccountSnapshot)
        self.verifyAndFinishActiveOp(OP.ComptrollerOperations.EXIT_MARKET)
        sp.verify(accountSnapshot.borrowBalance ==
                  sp.nat(0), EC.CMPT_BORROW_IN_MARKET)
        cTokenAddress = sp.sender
        self.redeemAllowedInternal(
            cTokenAddress, accountSnapshot.account, accountSnapshot.cTokenBalance)
        sp.if (self.data.collaterals.contains(accountSnapshot.account)) & (self.data.collaterals[accountSnapshot.account].contains(cTokenAddress)):
            # if sender has collateralized this market, remove from collaterals
            self.data.collaterals[accountSnapshot.account].remove(
                cTokenAddress)
        self.invalidateLiquidity(accountSnapshot.account)

    """
        Checks if the account should be allowed to mint tokens in the given market

        params: TRecord
            cToken: TAddress - The market to verify the mint against
            minter: TAddress - The account which would get the minted tokens
            mintAmount: TNat - The amount of underlying being supplied to the market in exchange for tokens
    """
    @sp.entry_point(lazify=True)
    def mintAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TMintAllowedParams)
        sp.verify(
            ~ self.data.markets[params.cToken].mintPaused, EC.CMPT_MINT_PAUSED)
        self.verifyMarketListed(params.cToken)
        self.invalidateLiquidity(params.minter)

    """
        Checks if the account should be allowed to redeem tokens in the given market

        requirements:
            updateAssetPrice() should be executed within the same block prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within the same block prior to this call

        params: TRecord
            cToken: TAddress - The market to verify the redeem against
            redeemer: TAddress - The account which would redeem the tokens
            redeemAmount: TNat - The number of cTokens to exchange for the underlying asset in the market
    """
    @sp.entry_point(lazify=True)
    def redeemAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TRedeemAllowedParams)
        self.redeemAllowedInternal(
            params.cToken, params.redeemer, params.redeemAmount)

    def redeemAllowedInternal(self, cToken, redeemer, redeemAmount):
        self.verifyMarketListed(cToken)
        # If the redeemer is not 'in' the market, then we can bypass the liquidity check
        sp.if self.data.collaterals.contains(redeemer) & self.data.collaterals[redeemer].contains(cToken):
            # skip liquidity check if no loans for user
            sp.if (self.data.loans.contains(redeemer)) & (sp.len(self.data.loans[redeemer]) != 0):
                self.checkInsuffLiquidityInternal(
                    cToken, redeemer, redeemAmount)
        self.invalidateLiquidity(redeemer)

    def checkInsuffLiquidityInternal(self, cToken, account, amount):
        self.verifyLiquidityCorrect(account)
        self.checkPriceErrors(cToken)
        newLiquidity = sp.compute(self.data.account_liquidity[account].liquidity - sp.to_int(
            self.mulScalarTruncate(self.data.markets[cToken].price, amount)))
        sp.verify(newLiquidity >= 0, EC.CMPT_REDEEMER_SHORTFALL)

    """
        Checks if the account should be allowed to borrow the underlying asset of the given market

        requirements:
            updateAssetPrice() should be executed within the same block prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within the same block prior to this call

        params: TRecord
            cToken: TAddress - The market to verify the borrow against
            borrower: TAddress - The account which would borrow the tokens
            borrowAmount: TNat - The amount of underlying the account would borrow
    """
    @sp.entry_point(lazify=True)
    def borrowAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TBorrowAllowedParams)
        sp.verify(
            ~ self.data.markets[params.cToken].borrowPaused, EC.CMPT_BORROW_PAUSED)
        self.verifyMarketListed(params.cToken)
        sp.if self.isNewAssetForUser(params.borrower, params.cToken):
            uniqueAssetsCount = self.getUserUniqueAssetsCount(params.borrower)
            sp.verify(uniqueAssetsCount < self.data.maxAssetsPerUser,
                       EC.CMPT_TOO_MANY_ASSETS)
        sp.if ~ self.data.loans.contains(params.borrower):
            # only cTokens may call borrowAllowed if borrower not in market
            sp.verify(sp.sender == params.cToken,
                      EC.CMPT_INVALID_BORROW_SENDER)
        sp.if sp.sender == params.cToken:
            self.addToLoans(params.cToken, params.borrower)
        self.checkInsuffLiquidityInternal(
            params.cToken, params.borrower, params.borrowAmount)
        self.invalidateLiquidity(params.borrower)

    def checkPriceErrors(self, cToken):
        price = self.getAssetPrice(cToken)
        sp.verify(price.mantissa > 0, EC.CMPT_INVALID_PRICE)

    def addToLoans(self, cToken, borrower):
        self.verifyMarketListed(cToken)
        sp.if self.data.loans.contains(borrower):
            self.data.loans[borrower].add(cToken)
        sp.else:
            self.data.loans[borrower] = sp.set([cToken])

    @sp.entry_point(lazify=True)
    def removeFromLoans(self, borrower):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        self.verifyMarketListed(sp.sender)
        sp.if self.data.loans.contains(borrower) & self.data.loans[borrower].contains(sp.sender):
            self.data.loans[borrower].remove(sp.sender)

    """
        Checks if the account should be allowed to repay a borrow in the given market

        params: TRecord
            cToken: TAddress - The market to verify the repay against
            payer: TAddress - The account which would repay the asset
            borrower: TAddress - The account which would borrowed the asset
            repayAmount: TNat - The amount of the underlying asset the account would repay
    """
    @sp.entry_point(lazify=True)
    def repayBorrowAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TRepayBorrowAllowedParams)
        self.verifyMarketListed(params.cToken)
        self.invalidateLiquidity(params.borrower)
        self.invalidateLiquidity(params.payer)

    """
        Checks if the account should be allowed to transfer tokens in the given market

        requirements:
            updateAssetPrice() should be executed within the same block prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within the same block prior to this call

        params: TRecord
            cToken: TAddress - The market to verify the transfer against
            src: TAddress - The account which sources the tokens
            dst: TAddress - The account which receives the tokens
            transferTokens: TNat - The number of cTokens to transfer
    """
    @sp.entry_point(lazify=True)
    def transferAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TTransferAllowedParams)
        sp.verify(~ self.data.transferPaused, EC.CMPT_TRANSFER_PAUSED)
        self.redeemAllowedInternal(
            params.cToken, params.src, params.transferTokens)

    """
        Updates all asset prices using harbinger view
    """
    @sp.entry_point
    def updateAllAssetPricesWithView(self):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        self.updateAllAssetPrices()

    def updateAllAssetPrices(self):
        sp.for asset in self.data.marketNameToAddress.values():
            sp.if self.data.markets[asset].updateLevel < sp.level:
                pricePair = sp.local("pricePair", 
                    sp.view("getPrice", self.data.oracleAddress, self.data.markets[asset].name + "-USD", 
                        t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some("invalid oracle view call")
                )
                sp.if self.data.markets[asset].priceTimestamp!= sp.timestamp(0):
                    sp.verify(sp.now - sp.fst(pricePair.value) <= self.data.maxPriceTimeDifference, "STALE_ASSET_PRICE")
                self.data.markets[asset].price = self.makeExp(
                    sp.snd(pricePair.value)*self.data.markets[asset].priceExp)
                self.data.markets[asset].priceTimestamp = sp.fst(pricePair.value)
                self.data.markets[asset].updateLevel = sp.level

    def getAssetPrice(self, asset):
        sp.verify(sp.level == self.data.markets[asset].updateLevel, EC.CMPT_UPDATE_PRICE)
        return self.data.markets[asset].price

    """
        Updates stored liquidity for the given account and also updates the asset prices and accrue interests if stale

        account: TAddress - The account to calculate liquidity for
    """
    @sp.entry_point
    def updateAccountLiquidityWithView(self, account):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(account, sp.TAddress)
        self.updateAllAssetPrices()
        self.accrueAllAssetInterests()
        self.activateOp(OP.ComptrollerOperations.SET_LIQUIDITY)
        sp.transfer(account, sp.mutez(0), sp.self_entry_point(
            "setAccountLiquidityWithView"))

    """
        Updates stored liquidity for the given account

        account: TAddress - The account to calculate liquidity for
    """
    @sp.entry_point(lazify=True)
    def setAccountLiquidityWithView(self, account):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(account, sp.TAddress)
        liquidity = sp.local(
            'liquidity', self.calculateCurrentAccountLiquidityWithView(account)).value
        self.verifyAndFinishActiveOp(OP.ComptrollerOperations.SET_LIQUIDITY)
        self.data.account_liquidity[account] = sp.record(
            liquidity=liquidity.sumCollateral - liquidity.sumBorrowPlusEffects,
            updateLevel=sp.level,
            valid=True
        )

    def accrueAllAssetInterests(self):
        sp.for asset in self.data.marketNameToAddress.values():
            sp.transfer(sp.unit, sp.mutez(0), sp.contract(
                sp.TUnit, asset, entry_point="accrueInterest").open_some())

    """
        Determine what the account liquidity would be if the given amounts were redeemed/borrowed,
        updates asset prices and accrues interests if stale

        return: TInt - the account liquidity. Shows shortfall when return value < 0
    """
    # @sp.entry_point
    # def getHypoAccountLiquidity(self, params):
    #     sp.set_type(params, CMPTInterface.TGetAccountLiquidityParams)
    #     self.updateAllAssetPrices()
    #     self.accrueAllAssetInterests()
    #     sp.transfer((params.data, params.callback), sp.mutez(
    #         0), sp.self_entry_point("returnHypoAccountLiquidity"))

    # @sp.utils.view(sp.TInt)
    # def returnHypoAccountLiquidity(self, params):
    #     sp.set_type(params, CMPTInterface.TAccountLiquidityParams)
    #     liquidity = self.getHypoAccountLiquidityInternal(params)
    #     sp.result(liquidity)

    # def getHypoAccountLiquidityInternal(self, params):
    #     sp.set_type(params, CMPTInterface.TAccountLiquidityParams)
    #     calcLiquidity = sp.local('calcLiquidity', self.calculateAccountLiquidityWithView(sp.record(cTokenModify=sp.some(
    #         params.cTokenModify), account=params.account, redeemTokens=params.redeemTokens, borrowAmount=params.borrowAmount))).value
    #     liquidity = sp.compute(
    #         calcLiquidity.sumCollateral - calcLiquidity.sumBorrowPlusEffects)
    #     return liquidity

    def getAccountLiquidityInternal(self, account):
        calcLiquidity = sp.local('calcLiquidity', self.calculateAccountLiquidityWithView(
            sp.record(account=account))).value
        liquidity = sp.compute(
            calcLiquidity.sumCollateral - calcLiquidity.sumBorrowPlusEffects)
        return liquidity

    """
        Determines the amount of collateral tokens that can seized given the 
        borrowed token, the collateral token and the repay amount

        updateAccountLiquidityWithView() needs to be called 
        before executing this to get up-to-date results
        
        return: sp.TPair of TNat - the no. of collateral tokens that can be seized on repay of the borrowed amount , TNat - last accrual block number
    """
    @sp.onchain_view()
    def liquidateCalculateSeizeTokens(self, params):
        sp.set_type(params, CMPTInterface.TLiquidateCalculateSeizeTokens)

        priceBorrowedMantissa = sp.local("priceBorrowedMantissa",
                                         self.getAssetPrice(params.cTokenBorrowed))
        priceCollateralMantissa = sp.local("priceCollateralMantissa",
                                           self.getAssetPrice(params.cTokenCollateral))

        sp.verify((priceBorrowedMantissa.value.mantissa != sp.nat(0)) & (
            priceCollateralMantissa.value.mantissa != sp.nat(0)), EC.CMPT_PRICE_ERROR)

        exchangeRateData = sp.view("exchangeRateStoredView", params.cTokenCollateral, sp.unit,
                                       t=sp.TPair(sp.TNat, sp.TNat)).open_some("INVALID EXCHANGE RATE VIEW")

        exchangeRateMantissa = sp.fst(exchangeRateData)
        lastAccrual = sp.snd(exchangeRateData)

        numerator = sp.local("numerator", self.mul_exp_exp(self.makeExp(
            self.data.liquidationIncentiveMantissa), priceBorrowedMantissa.value))
        denominator = sp.local("denominator", self.mul_exp_exp(
            priceCollateralMantissa.value, self.makeExp(exchangeRateMantissa)))

        ratio = sp.local("ratio", self.div_exp_exp(
            numerator.value, denominator.value))

        sp.result(sp.pair(self.mulScalarTruncate(
            ratio.value, params.actualRepayAmount), lastAccrual))

    """
        Determines whether a users position can be liquidated

        updateAccountLiquidityWithView() needs to be called 
        before executing this to get up-to-date results
    """
    @sp.entry_point(lazify=True)
    def liquidateBorrowAllowed(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, CMPTInterface.TLiquidateBorrowAllowed)

        self.verifyMarketListed(params.cTokenBorrowed)
        self.verifyMarketListed(params.cTokenCollateral)

        liquidity = sp.local(
            "liquidtiy", self.getAccountLiquidityInternal(params.borrower))

        sp.verify(liquidity.value < 0, EC.CMPT_INSUFFICIENT_SHORTFALL)

        borrowBalance = sp.fst(sp.view("borrowBalanceStoredView", params.cTokenBorrowed, params.borrower,
                                t=sp.TPair(sp.TNat, sp.TNat)).open_some("INVALID ACCOUNT BORROW BALANCE VIEW"))

        maxClose = sp.local("maxClose", self.mulScalarTruncate(self.makeExp(
            self.data.closeFactorMantissa), borrowBalance))

        sp.verify(maxClose.value >= params.repayAmount, EC.CMPT_TOO_MUCH_REPAY)
        
        self.invalidateLiquidity(params.borrower)
        self.invalidateLiquidity(params.liquidator)
    
    """
        Determines whether a seize is allwed

        return: TBool - return true if a seize is allowed , false otherwise
    """
    @sp.onchain_view()
    def seizeAllowed(self, params):
        sp.set_type(params, sp.TRecord(cTokenCollateral=sp.TAddress, cTokenBorrowed=sp.TAddress))
        # liquidator is not used, left here for future proofing

        borrowMarketValid = self.data.markets.contains(params.cTokenBorrowed) & \
                       self.data.markets[params.cTokenBorrowed].isListed
    
        collateralMarketValid = self.data.markets.contains(params.cTokenCollateral) & \
                           self.data.markets[params.cTokenCollateral].isListed

        sp.if ~borrowMarketValid | ~collateralMarketValid:
            sp.result(False)
        sp.else:
            borrowComptrollerOpt = sp.view("comptroller", params.cTokenBorrowed, sp.unit, t=sp.TAddress)
            collateralComptrollerOpt = sp.view("comptroller", params.cTokenCollateral, sp.unit, t=sp.TAddress)
            
            sp.if borrowComptrollerOpt.is_none() | collateralComptrollerOpt.is_none():
                sp.result(False)
            sp.else:
                borrowComptroller = borrowComptrollerOpt.open_some()
                collateralComptroller = collateralComptrollerOpt.open_some()
                sp.result(borrowComptroller == collateralComptroller)

    def calculateCurrentAccountLiquidityWithView(self, account):
        return self.calculateAccountLiquidityWithView(sp.record(account=account))

    def calculateAccountLiquidityWithView(self, params):
        calculation = sp.local('calculation', sp.record(
            sumCollateral=sp.nat(0), sumBorrowPlusEffects=sp.nat(0))).value
        temp = sp.local('temp', sp.record(sumCollateral=sp.nat(
            0), sumBorrowPlusEffects=sp.nat(0))).value
        sp.if self.data.collaterals.contains(params.account):
            sp.for asset in self.data.collaterals[params.account].elements():
                # cToken.accrueInterest() for the given asset should be executed within the same block prior to this call
                # updateAssetPrice() should be executed within the same block prior to this call
                temp = self.calculateAccountAssetLiquidityView(
                    asset, params.account)
                calculation.sumCollateral += temp.sumCollateral
                calculation.sumBorrowPlusEffects += temp.sumBorrowPlusEffects
        sp.if self.data.loans.contains(params.account):
            sp.for asset in self.data.loans[params.account].elements():
                # only get liquidity for assets that aren't in collaterals to avoid double counting
                sp.if self.data.collaterals.contains(params.account):
                    sp.if ~self.data.collaterals[params.account].contains(asset):
                        # cToken.accrueInterest() for the given asset should be executed within the same block prior to this call
                        # updateAssetPrice() should be executed within the same block prior to this call
                        temp = self.calculateAccountAssetLiquidityView(
                            asset, params.account)
                        calculation.sumCollateral += temp.sumCollateral
                        calculation.sumBorrowPlusEffects += temp.sumBorrowPlusEffects
                sp.else:
                    temp = self.calculateAccountAssetLiquidityView(
                        asset, params.account)
                    calculation.sumCollateral += temp.sumCollateral
                    calculation.sumBorrowPlusEffects += temp.sumBorrowPlusEffects

        return calculation

    def calculateAccountAssetLiquidityView(self, asset, account):
        paramsOption = sp.view("getAccountSnapshotView", asset, account,
                         t=sp.TOption(CTI.TAccountSnapshot)).open_some("INVALID ACCOUNT SNAPSHOT VIEW")
        sp.verify(paramsOption.is_some(), EC.CMPT_OUTDATED_ACCOUNT_SNAPSHOT)
        params = sp.local("params", paramsOption.open_some())
        exchangeRate = sp.compute(self.makeExp(params.value.exchangeRateMantissa))
        self.checkPriceErrors(asset)
        priceIndex = self.mul_exp_exp(
            self.data.markets[asset].price, self.data.markets[asset].collateralFactor)
        tokensToDenom = sp.compute(self.mul_exp_exp(priceIndex, exchangeRate))
        calc = sp.local('calc', sp.record(sumCollateral=sp.nat(
            0), sumBorrowPlusEffects=sp.nat(0))).value
        # incase of only borrow don't consider supply as collateral
        sp.if self.data.collaterals.contains(params.value.account) & self.data.collaterals[params.value.account].contains(asset):
            calc.sumCollateral += self.mulScalarTruncate(
                tokensToDenom, params.value.cTokenBalance)
        calc.sumBorrowPlusEffects += self.mulScalarTruncate(
            self.data.markets[asset].price, params.value.borrowBalance)
        return calc
    
    """
        Gets the number of unique assets for a given user

        returns: TNat - The number of unique assets held by the user
    """
    @sp.onchain_view()
    def getUserAssetsCount(self, user):
        sp.set_type(user, sp.TAddress)
        sp.result(self.getUserUniqueAssetsCount(user))

    """
        Returns the current limit for the maximum number of unique assets a user can hold

        returns: TNat - Current limit value for maxAssetsPerUser
    """
    @sp.onchain_view()
    def getMaxAssetsPerUser(self):
        sp.result(self.data.maxAssetsPerUser)

    """
        Sets a new pending governance for the market

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance contract
    """
    @sp.entry_point(lazify=True)
    def setPendingGovernance(self, pendingAdminAddress):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.some(pendingAdminAddress)

    """
        Accept a new governance for the market

        dev: Governance function to set a new governance

        params: TUnit
    """
    @sp.entry_point(lazify=True)
    def acceptGovernance(self, unusedArg):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator.open_some(
            EC.CMPT_NOT_SET_PENDING_ADMIN), EC.CMPT_NOT_PENDING_ADMIN)
        self.data.administrator = self.data.pendingAdministrator.open_some()
        self.data.pendingAdministrator = sp.none

    """
        Pause or activate the mint of given CToken

        dev: Governance function to pause or activate the mint of given CToken

        params: TRecord
            cToken: TAddress - The address of the market to change the mint pause state
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point(lazify=True)
    def setMintPaused(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, state=sp.TBool))
        self.verifyMarketListed(params.cToken)
        self.verifyAdministrator()
        self.data.markets[params.cToken].mintPaused = params.state

    """
        Pause or activate the borrow of given CToken

        dev: Governance function to pause or activate the borrow of given CToken

        params: TRecord
            cToken: TAddress - The address of the market to change the borrow pause state
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point(lazify=True)
    def setBorrowPaused(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, state=sp.TBool))
        self.verifyMarketListed(params.cToken)
        self.verifyAdministrator()
        self.data.markets[params.cToken].borrowPaused = params.state

    """
        Pause or activate the transfer of CTokens

        dev: Governance function to pause or activate the transfer of CTokens

        state: TBool, where True - pause, False - activate
    """
    @sp.entry_point(lazify=True)
    def setTransferPaused(self, state):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(state, sp.TBool)
        self.verifyAdministrator()
        self.data.transferPaused = state

    """
        Sets a new price oracle and time diff for the comptroller

        dev: Governance function to set a new price oracle and time diff

        params: TAddress, TInt - The address of the new price oracle contract and max time diff
        
        NOTE: can only use harbinger or harbinger like oracle
    """
    @sp.entry_point(lazify=True)
    def setPriceOracleAndTimeDiff(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, sp.TRecord(priceOracle=sp.TAddress, timeDiff=sp.TInt))
        self.verifyAdministrator()
        self.data.maxPriceTimeDifference = params.timeDiff
        self.data.oracleAddress = params.priceOracle

    """
        Sets the closeFactor used when liquidating borrows

        dev: Governance function to set closeFactor

        closeFactorMantissa: TNat - New close factor, scaled by 1e18
    """
    @sp.entry_point(lazify=True)
    def setCloseFactor(self, closeFactorMantissa):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(closeFactorMantissa, sp.TNat)
        self.verifyAdministrator()
        self.data.closeFactorMantissa = closeFactorMantissa

    """
        Sets the maximum number of unique assets a user can hold

        dev: Governance function to set maxAssetsPerUser

        newLimit: TNat - The new limit for the maximum number of unique assets a user can hold
    """
    @sp.entry_point(lazify=True)
    def setMaxAssetsPerUser(self, newLimit):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(newLimit, sp.TNat)
        self.verifyAdministrator()
        self.data.maxAssetsPerUser = newLimit

    """
        Sets the collateralFactor for a market

        dev: Governance function to set per-market collateralFactor

        collateralFactor: TRecord
            cToken: TAddress - The market to set the factor on
            newCollateralFactor: TNat - The new collateral factor, scaled by 1e18
    """
    @sp.entry_point(lazify=True)
    def setCollateralFactor(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, newCollateralFactor=sp.TNat))
        self.verifyAdministrator()
        self.verifyMarketListed(params.cToken)
        self.data.markets[params.cToken].collateralFactor.mantissa = params.newCollateralFactor

    """
        Sets liquidationIncentive

        dev: Governance function to set liquidationIncentive

        liquidationIncentiveMantissa: TNat - New liquidationIncentive scaled by 1e18
    """
    @sp.entry_point(lazify=True)
    def setLiquidationIncentive(self, liquidationIncentiveMantissa):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(liquidationIncentiveMantissa, sp.TNat)
        self.verifyAdministrator()
        self.data.liquidationIncentiveMantissa = liquidationIncentiveMantissa

    """
        Add the market to the markets mapping and set it as listed

        dev: Governance function to set isListed and add support for the market

        params: TRecord
            cToken: TAddress - The address of the market (token) to list
            name: TString - The market name in price oracle
            priceExp: TNat - exponent needed to normalize the token prices to 10^18 (eth:0, btc: 10, usd: 12)
    """
    @sp.entry_point(lazify=True)
    def supportMarket(self, params):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress,
                    name=sp.TString, priceExp=sp.TNat))
        self.verifyAdministrator()
        self.verifyMarketNotListed(params.cToken)
        self.data.markets[params.cToken] = sp.record(isListed=sp.bool(True),
                                                     collateralFactor=self.makeExp(
                                                         sp.nat(DEFAULT_COLLATERAL_FACTOR)),
                                                     mintPaused=sp.bool(True),
                                                     borrowPaused=sp.bool(
                                                         True),
                                                     name=params.name,
                                                     price=self.makeExp(
                                                         sp.nat(0)),
                                                     priceExp=params.priceExp,
                                                     updateLevel=sp.nat(0),
                                                     priceTimestamp=sp.timestamp(0))
        self.data.marketNameToAddress[params.name+"-USD"] = params.cToken

    """
        Disable the supported market

        dev: Governance function to set isDisabled for the supported market

        cToken: TAddress - The address of the market (token) to disable
    """
    @sp.entry_point(lazify=True)
    def disableMarket(self, cToken):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(
            0), "TEZ_TRANSFERED")
        sp.set_type(cToken, sp.TAddress)
        self.verifyAdministrator()
        self.verifyMarketListed(cToken)
        self.data.markets[cToken].isListed = sp.bool(False)

    # Helpers

    def verifyMarketExists(self, token):
        sp.verify(self.data.markets.contains(token), EC.CMPT_MARKET_NOT_EXISTS)

    def verifyMarketListed(self, token):
        sp.verify(self.data.markets.contains(token) &
                  self.data.markets[token].isListed, EC.CMPT_MARKET_NOT_LISTED)

    def verifyMarketNotListed(self, token):
        sp.verify(~ (self.data.markets.contains(
            token) & self.data.markets[token].isListed), EC.CMPT_MARKET_ALREADY_LISTED)

    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, EC.CMPT_NOT_ADMIN)

    def verifyInternal(self):
        sp.verify(sp.sender == sp.self_address, EC.CMPT_INTERNAL_FUNCTION)

    def verifyLiquidityCorrect(self, account):
        sp.verify(self.data.account_liquidity.contains(
            account), EC.CMPT_LIQUIDITY_ABSENT)
        sp.verify(
            self.data.account_liquidity[account].valid, EC.CMPT_LIQUIDITY_INVALID)
        updatePeriod = sp.compute(self.sub_nat_nat(
            sp.level, self.data.account_liquidity[account].updateLevel))
        sp.verify(updatePeriod == 0, EC.CMPT_LIQUIDITY_OLD)

    def invalidateLiquidity(self, account):
        sp.if self.data.account_liquidity.contains(account):
            self.data.account_liquidity[account].valid = False

    def getUserUniqueAssetsCount(self, user):
        unique_assets = sp.local("unique_assets", sp.set(t=sp.TAddress))
        
        sp.if self.data.collaterals.contains(user):
            sp.for asset in self.data.collaterals[user].elements():
                unique_assets.value.add(asset)
        
        sp.if self.data.loans.contains(user):
            sp.for asset in self.data.loans[user].elements():
                unique_assets.value.add(asset)
        
        return sp.len(unique_assets.value)
    
    def isNewAssetForUser(self, user, cToken):
        is_new = sp.local("is_new", True)
        
        sp.if self.data.collaterals.contains(user):
            sp.if self.data.collaterals[user].contains(cToken):
                is_new.value = False
        
        sp.if self.data.loans.contains(user) & is_new.value:
            sp.if self.data.loans[user].contains(cToken):
                is_new.value = False
        
        return is_new.value

import smartpy as sp

CMPTErrors = sp.io.import_script_from_url("file:contracts/errors/ComptrollerErrors.py")
EC = CMPTErrors.ErrorCodes

CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")
OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")
Exponential = sp.io.import_script_from_url("file:contracts/utils/Exponential.py")
OP = sp.io.import_script_from_url("file:contracts/utils/OperationProtector.py")
SweepTokens = sp.io.import_script_from_url("file:contracts/utils/SweepTokens.py")

TMarket = sp.TRecord(isListed = sp.TBool,  # Whether or not this market is listed
     collateralFactor = Exponential.TExp,  # Multiplier representing the most one can borrow against their collateral in this market.
                                          # For instance, 0.9 to allow borrowing 90% of collateral value.
                                          # Must be between 0 and 1, and stored as a mantissa.
     mintPaused = sp.TBool,
     borrowPaused = sp.TBool,
     name = sp.TString, # Asset name for price oracle
     price = Exponential.TExp, # The price of the asset
     updateLevel = sp.TNat, # Block level of last price update
     borrowCap = sp.TNat # Borrow caps enforced by borrowAllowed for each cToken address. Defaults to zero which corresponds to unlimited borrowing
    )

TLiquidity = sp.TRecord(
        liquidity = sp.TInt, # Current account liquidity. Negative value indicates shortfall
        updateLevel = sp.TNat, # Block level of last update
        valid = sp.TBool # Liquidity is valid only for one user action
    )

DEFAULT_COLLATERAL_FACTOR = int(9e17) # 90 %

class Comptroller(CMPTInterface.ComptrollerInterface, Exponential.Exponential, SweepTokens.SweepTokens, OP.OperationProtector):
    def __init__(self, administrator_, oracleAddress_, closeFactorMantissa_, liquidationIncentiveMantissa_, **extra_storage):
        Exponential.Exponential.__init__(
            self,
            administrator = administrator_,
            pendingAdministrator = sp.none,
            markets = sp.big_map(l={}, tkey = sp.TAddress, tvalue = TMarket), # Official mapping of cTokens -> Market metadata. Used e.g. to determine if a market is supported
            marketNameToAddress = sp.map(tkey = sp.TString, tvalue = sp.TAddress), # The mapping of Market names -> CToken
            transferPaused = sp.bool(True),
            collaterals = sp.big_map(l={}, tkey = sp.TAddress, tvalue = sp.TSet(sp.TAddress)), # Per-account mapping of collaterals, capped by maxAssets
            loans = sp.big_map(l={}, tkey = sp.TAddress, tvalue = sp.TSet(sp.TAddress)), # Per-account mapping of loans, capped by maxAssets
            account_liquidity = sp.big_map(l={}, tkey = sp.TAddress, tvalue = TLiquidity), # Per-account mapping of current liquidity
            oracleAddress = oracleAddress_,
            activeOperations = sp.set(t=sp.TNat), # Set of currently active operations to protect execution flow
            calculation = sp.record(
                sumBorrowPlusEffects = sp.nat(0),
                sumCollateral = sp.nat(0),
                cTokenModify = sp.none,
                account = sp.none,
                redeemTokens = sp.nat(0),
                borrowAmount = sp.nat(0)
            ),
            closeFactorMantissa = closeFactorMantissa_,
            liquidationIncentiveMantissa = liquidationIncentiveMantissa_,
            **extra_storage
        )


    """
        Add assets to be included in account liquidity calculation

        cTokens: TList(TAddress) - The list of addresses of the cToken markets to be enabled
    """
    @sp.entry_point(lazify = True)
    def enterMarkets(self, cTokens):
        sp.set_type(cTokens, sp.TList(sp.TAddress))
        sp.for token in cTokens:
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
            updateAssetPrice() should be executed within 5 blocks prior to this call, for all markets entered by the user
            updateAccountLiquidity() should be executed within 5 blocks prior to this call

        dev: Sender must not have an outstanding borrow balance in the asset,
             or be providing necessary collateral for an outstanding borrow

        cToken: TAddress - The address of the asset to be removed
    """
    @sp.entry_point
    def exitMarket(self, cToken):
        sp.set_type(cToken, sp.TAddress)
        self.activateOp(OP.ComptrollerOperations.EXIT_MARKET)

        destination = sp.contract(sp.TPair(sp.TAddress, sp.TContract(CTI.TAccountSnapshot)), cToken, "getAccountSnapshot").open_some()
        sp.transfer(sp.pair(sp.sender, sp.self_entry_point("setAccountSnapAndExitMarket")), sp.mutez(0), destination)


    """
        Helper for exitMarket. Must be called only by underlying cToken.getAccountSnapshot viewer within exitMarket action 

        accountSnapshot: TAccountSnapshot - Container for account balance information
    """
    @sp.entry_point(lazify = True)
    def setAccountSnapAndExitMarket(self, accountSnapshot):
        sp.set_type(accountSnapshot, CTI.TAccountSnapshot)
        sp.verify(accountSnapshot.borrowBalance == sp.nat(0), EC.CMPT_BORROW_IN_MARKET)  
        cTokenAddress = sp.sender
        self.redeemAllowedInternal(cTokenAddress, accountSnapshot.account, accountSnapshot.cTokenBalance)
        sp.if self.data.collaterals.contains(accountSnapshot.account):
            # if sender has collateralized this market, remove from collaterals
            self.data.collaterals[accountSnapshot.account].remove(cTokenAddress)
        self.invalidateLiquidity(accountSnapshot.account)


    """
        Checks if the account should be allowed to mint tokens in the given market

        params: TRecord
            cToken: TAddress - The market to verify the mint against
            minter: TAddress - The account which would get the minted tokens
            mintAmount: TNat - The amount of underlying being supplied to the market in exchange for tokens
    """
    @sp.entry_point(lazify = True)
    def mintAllowed(self, params):
        sp.set_type(params, CMPTInterface.TMintAllowedParams)
        sp.verify( ~ self.data.markets[params.cToken].mintPaused, EC.CMPT_MINT_PAUSED)
        self.verifyMarketListed(params.cToken)
        self.invalidateLiquidity(params.minter)


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
    @sp.entry_point(lazify = True)
    def redeemAllowed(self, params):
        sp.set_type(params, CMPTInterface.TRedeemAllowedParams)
        self.redeemAllowedInternal(params.cToken, params.redeemer, params.redeemAmount)

    def redeemAllowedInternal(self, cToken, redeemer, redeemAmount):
        self.verifyMarketListed(cToken)
        market = self.data.markets[cToken]
        # If the redeemer is not 'in' the market, then we can bypass the liquidity check
        sp.if self.data.collaterals.contains(redeemer):
            self.checkInsuffLiquidityInternal(cToken, redeemer, redeemAmount)
        self.invalidateLiquidity(redeemer)

    def checkInsuffLiquidityInternal(self, cToken, account, amount):
        self.verifyLiquidityCorrect(account)
        self.checkPriceErrors(cToken)
        newLiquidity = sp.compute(self.data.account_liquidity[account].liquidity - sp.to_int(self.mulScalarTruncate(self.data.markets[cToken].price, amount)))
        sp.verify(newLiquidity >= 0, EC.CMPT_REDEEMER_SHORTFALL)


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
    @sp.entry_point(lazify = True)
    def borrowAllowed(self, params):
        sp.set_type(params, CMPTInterface.TBorrowAllowedParams)
        sp.verify(~ self.data.markets[params.cToken].borrowPaused, EC.CMPT_BORROW_PAUSED)
        self.verifyMarketListed(params.cToken)
        sp.if ~ self.data.loans.contains(params.borrower):
            # only cTokens may call borrowAllowed if borrower not in market
            sp.verify(sp.sender == params.cToken, EC.CMPT_INVALID_BORROW_SENDER)
            self.addToLoans(sp.sender, params.borrower)
        self.checkInsuffLiquidityInternal(params.cToken, params.borrower, params.borrowAmount)
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


    """
        Checks if the account should be allowed to repay a borrow in the given market

        params: TRecord
            cToken: TAddress - The market to verify the repay against
            payer: TAddress - The account which would repay the asset
            borrower: TAddress - The account which would borrowed the asset
            repayAmount: TNat - The amount of the underlying asset the account would repay
    """
    @sp.entry_point(lazify = True)
    def repayBorrowAllowed(self, params):
        sp.set_type(params, CMPTInterface.TRepayBorrowAllowedParams)
        self.verifyMarketListed(params.cToken)
        self.invalidateLiquidity(params.borrower)
        self.invalidateLiquidity(params.payer)


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
    @sp.entry_point(lazify = True)
    def transferAllowed(self, params):
        sp.set_type(params, CMPTInterface.TTransferAllowedParams)
        sp.verify(~ self.data.transferPaused, EC.CMPT_TRANSFER_PAUSED)
        self.redeemAllowedInternal(params.cToken, params.src, params.transferTokens)


    """
        Update price of the given asset

        asset: TAddress - CToken market address
    """
    @sp.entry_point
    def updateAssetPrice(self, asset):
        sp.set_type(asset, sp.TAddress)
        sp.if self.data.markets[asset].updateLevel < sp.level:
            self.activateOp(OP.ComptrollerOperations.UPDATE_PRICE)
            handle = sp.contract(OracleInterface.TGetPriceParam, self.data.oracleAddress, entry_point="get").open_some()
            # get asset-USD price from oracle
            priceParams = (self.data.markets[asset].name + "-USD", sp.self_entry_point("setAssetPrice"))
            sp.transfer(priceParams, sp.mutez(0), handle)

    @sp.entry_point(lazify = True)
    def setAssetPrice(self, params):
        sp.set_type(params, OracleInterface.TSetPriceParam)
        self.verifyAndFinishActiveOp(OP.ComptrollerOperations.UPDATE_PRICE)
        assetName = sp.compute(sp.fst(params))
        pricePair = sp.compute(sp.snd(params))
        asset = self.data.marketNameToAddress[assetName]
        self.data.markets[asset].price = self.toExp(sp.snd(pricePair))
        self.data.markets[asset].updateLevel = sp.level

    def getAssetPrice(self, asset):
        updatePeriod = sp.compute(self.sub_nat_nat(sp.level, self.data.markets[asset].updateLevel))
        sp.verify(updatePeriod == 0, EC.CMPT_UPDATE_PRICE)
        return self.data.markets[asset].price


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
        sp.set_type(account, sp.TAddress)
        self.calculateCurrentAccountLiquidity(account)
        sp.transfer(sp.unit, sp.mutez(0), sp.self_entry_point("setAccountLiquidity"))

    @sp.entry_point(lazify = True)
    def setAccountLiquidity(self, params):
        sp.set_type(params, sp.TUnit)
        self.data.account_liquidity[self.data.calculation.account.open_some()] = sp.record(
                liquidity = self.data.calculation.sumCollateral - self.data.calculation.sumBorrowPlusEffects,
                updateLevel = sp.level,
                valid = True
            )
        self.resetCalculation()


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
        sp.set_type(params, CMPTInterface.TGetAccountLiquidityParams)
        self.calculateAccountLiquidity(sp.record(cTokenModify=sp.some(params.data.cTokenModify), account=params.data.account, redeemTokens=params.data.redeemTokens, borrowAmount=params.data.borrowAmount))
        sp.transfer((sp.unit, params.callback), sp.mutez(0), sp.self_entry_point("returnHypoAccountLiquidity"))

    @sp.utils.view(sp.TInt)
    def returnHypoAccountLiquidity(self, params):
        sp.set_type(params, sp.TUnit)
        self.verifyAndFinishActiveOp(OP.ComptrollerOperations.GET_LIQUIDITY)
        liquidity = sp.compute(self.data.calculation.sumCollateral - self.data.calculation.sumBorrowPlusEffects)
        self.resetCalculation()
        sp.result(liquidity)

    def calculateCurrentAccountLiquidity(self, account):
        self.calculateAccountLiquidity(sp.record(cTokenModify=sp.none, account=account, redeemTokens=sp.nat(0), borrowAmount=sp.nat(0)))

    def calculateAccountLiquidity(self, params):
        self.activateOp(OP.ComptrollerOperations.GET_LIQUIDITY)
        self.initCalculation(params.cTokenModify, params.account, params.redeemTokens, params.borrowAmount)
        sp.if self.data.collaterals.contains(params.account):
            sp.for asset in self.data.collaterals[params.account].elements():
                # cToken.accrueInterest() for the given asset should be executed within 5 blocks prior to this call
                # updateAssetPrice() should be executed within 5 blocks prior to this call
                self.getAccountLiquidityForAsset(asset, params.account)
        sp.if self.data.loans.contains(params.account):
            sp.for asset in self.data.loans[params.account].elements():
                # only get liquidity for assets that aren't in collaterals to avoid double counting
                sp.if ~ self.data.collaterals[params.account].contains(asset):
                    # cToken.accrueInterest() for the given asset should be executed within 5 blocks prior to this call
                    # updateAssetPrice() should be executed within 5 blocks prior to this call
                    self.getAccountLiquidityForAsset(asset, params.account)


    def initCalculation(self, cTokenModify, account, redeemTokens, borrowAmount):
        self.data.calculation = sp.record(
              sumBorrowPlusEffects = sp.nat(0),
              sumCollateral = sp.nat(0),
              cTokenModify = cTokenModify,
              account = sp.some(account),
              redeemTokens = redeemTokens,
              borrowAmount = borrowAmount
            )

    def resetCalculation(self):
        self.data.calculation = sp.record(
              sumBorrowPlusEffects = sp.nat(0),
              sumCollateral = sp.nat(0),
              cTokenModify = sp.none,
              account = sp.none,
              redeemTokens = sp.nat(0),
              borrowAmount = sp.nat(0)
            )

    def getAccountLiquidityForAsset(self, asset, account):
        handle = sp.contract(sp.TPair(sp.TAddress, sp.TContract(CTI.TAccountSnapshot)), asset, entry_point="getAccountSnapshot").open_some()
        sp.transfer((account, sp.self_entry_point("calculateAccountAssetLiquidity")), sp.mutez(0), handle)

    @sp.entry_point(lazify = True)
    def calculateAccountAssetLiquidity(self, params):
        sp.set_type(params, CTI.TAccountSnapshot)
        self.verifyActiveOp(OP.ComptrollerOperations.GET_LIQUIDITY)
        asset = sp.sender
        exchangeRate = sp.compute(self.makeExp(params.exchangeRateMantissa))
        self.checkPriceErrors(asset)
        priceIndex = self.mul_exp_exp(self.data.markets[asset].price, self.data.markets[asset].collateralFactor)
        tokensToDenom = sp.compute(self.mul_exp_exp(priceIndex, exchangeRate))
        self.data.calculation.sumCollateral += self.mulScalarTruncate(tokensToDenom, params.cTokenBalance)
        self.data.calculation.sumBorrowPlusEffects += self.mulScalarTruncate(self.data.markets[asset].price, params.borrowBalance)
        sp.if sp.some(asset) == self.data.calculation.cTokenModify:
            self.data.calculation.sumCollateral += self.mulScalarTruncate(tokensToDenom, self.data.calculation.redeemTokens)
            self.data.calculation.sumBorrowPlusEffects += self.mulScalarTruncate(self.data.markets[asset].price, self.data.calculation.borrowAmount)


    """
        Sets a new pending governance for the market

        dev: Governance function to set a new governance

        params: TAddress - The address of the new pending governance contract
    """
    @sp.entry_point(lazify = True)
    def setPendingGovernance(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.some(pendingAdminAddress)


    """
        Accept a new governance for the market

        dev: Governance function to set a new governance

        params: TUnit
    """
    @sp.entry_point(lazify = True)
    def acceptGovernance(self, unusedArg):
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator.open_some(EC.CMPT_NOT_SET_PENDING_ADMIN), EC.CMPT_NOT_PENDING_ADMIN)
        self.data.administrator = self.data.pendingAdministrator.open_some()
        self.data.pendingAdministrator = sp.none


    """
        Pause or activate the mint of given CToken

        dev: Governance function to pause or activate the mint of given CToken

        params: TRecord
            cToken: TAddress - The address of the market to change the mint pause state
            state: TBool - state, where True - pause, False - activate
    """
    @sp.entry_point(lazify = True)
    def setMintPaused(self, params):
        sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool))
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
    @sp.entry_point(lazify = True)
    def setBorrowPaused(self, params):
        sp.set_type(params, sp.TRecord(cToken = sp.TAddress, state = sp.TBool))
        self.verifyMarketListed(params.cToken)
        self.verifyAdministrator()
        self.data.markets[params.cToken].borrowPaused = params.state


    """
        Pause or activate the transfer of CTokens

        dev: Governance function to pause or activate the transfer of CTokens

        state: TBool, where True - pause, False - activate
    """
    @sp.entry_point(lazify = True)
    def setTransferPaused(self, state):
        sp.set_type(state, sp.TBool)
        self.verifyAdministrator()
        self.data.transferPaused = state


    """
        Sets a new price oracle for the comptroller

        dev: Governance function to set a new price oracle

        params: TAddress - The address of the new price oracle contract
    """
    @sp.entry_point(lazify = True)
    def setPriceOracle(self, priceOracle):
        sp.set_type(priceOracle, sp.TAddress)
        self.verifyAdministrator()
        self.data.oracleAddress = priceOracle


    """
        Sets the closeFactor used when liquidating borrows

        dev: Governance function to set closeFactor

        closeFactorMantissa: TNat - New close factor, scaled by 1e18
    """
    @sp.entry_point(lazify = True)
    def setCloseFactor(self, closeFactorMantissa):
        sp.set_type(closeFactorMantissa, sp.TNat)
        self.verifyAdministrator()
        self.data.closeFactorMantissa = closeFactorMantissa


    """
        Sets the collateralFactor for a market

        dev: Governance function to set per-market collateralFactor

        collateralFactor: TRecord
            cToken: TAddress - The market to set the factor on
            newCollateralFactor: TNat - The new collateral factor, scaled by 1e18
    """
    @sp.entry_point(lazify = True)
    def setCollateralFactor(self, params):
        sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newCollateralFactor = sp.TNat))
        self.verifyAdministrator()
        self.verifyMarketListed(params.cToken)
        self.data.markets[params.cToken].collateralFactor.mantissa = params.newCollateralFactor


    """
        Sets liquidationIncentive

        dev: Governance function to set liquidationIncentive

        liquidationIncentiveMantissa: TNat - New liquidationIncentive scaled by 1e18
    """
    @sp.entry_point(lazify = True)
    def setLiquidationIncentive(self, liquidationIncentiveMantissa):
        sp.set_type(liquidationIncentiveMantissa, sp.TNat)
        self.verifyAdministrator()
        self.data.liquidationIncentiveMantissa = liquidationIncentiveMantissa


    """
        Add the market to the markets mapping and set it as listed

        dev: Governance function to set isListed and add support for the market

        params: TRecord
            cToken: TAddress - The address of the market (token) to list
            name: TString - The market name in price oracle
    """
    @sp.entry_point(lazify = True)
    def supportMarket(self, params):
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, name=sp.TString))
        self.verifyAdministrator()
        self.verifyMarketNotListed(params.cToken)
        self.data.markets[params.cToken] = sp.record(isListed = sp.bool(True),
            collateralFactor = self.makeExp(sp.nat(DEFAULT_COLLATERAL_FACTOR)),
            mintPaused = sp.bool(True),
            borrowPaused = sp.bool(True),
            name = params.name,
            price = self.makeExp(sp.nat(0)),
            updateLevel = sp.nat(0),
            borrowCap = sp.nat(0))
        self.data.marketNameToAddress[params.name+"-USD"] = params.cToken


    """
        Disable the supported market

        dev: Governance function to set isDisabled for the supported market

        cToken: TAddress - The address of the market (token) to disable
    """
    @sp.entry_point(lazify = True)
    def disableMarket(self, cToken):
        sp.set_type(cToken, sp.TAddress)
        self.verifyAdministrator()
        self.verifyMarketListed(cToken)
        self.data.markets[cToken].isListed = sp.bool(False)


    """
        Set the given borrow cap for the given cToken market. Borrowing that brings total borrows to or above borrow cap will revert.

        dev: Governance function to set the borrow caps. A borrow cap of 0 corresponds to unlimited borrowing.

        params: TRecord
            cToken: TAddress - The address of the market (token) to change the borrow caps for
            newBorrowCap: TNat - The new borrow cap value in underlying to be set. A value of 0 corresponds to unlimited borrowing.
    """
    @sp.entry_point(lazify = True)
    def setMarketBorrowCap(self, params):
        sp.set_type(params, sp.TRecord(cToken = sp.TAddress, newBorrowCap = sp.TNat))
        self.verifyAdministrator()
        self.verifyMarketExists(params.cToken)
        self.data.markets[params.cToken].borrowCap = params.newBorrowCap


    #Helpers
    def verifyMarketExists(self, token):
        sp.verify(self.data.markets.contains(token), EC.CMPT_MARKET_NOT_EXISTS)

    def verifyMarketListed(self, token):
        sp.verify(self.data.markets.contains(token) & self.data.markets[token].isListed, EC.CMPT_MARKET_NOT_LISTED)

    def verifyMarketNotListed(self, token):
        sp.verify(~ (self.data.markets.contains(token) & self.data.markets[token].isListed), EC.CMPT_MARKET_ALREADY_LISTED)

    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, EC.CMPT_NOT_ADMIN)

    def verifyInternal(self):
        sp.verify(sp.sender == sp.self_address, EC.CMPT_INTERNAL_FUNCTION)

    def verifyLiquidityCorrect(self, account):
        sp.verify(self.data.account_liquidity.contains(account), EC.CMPT_LIQUIDITY_ABSENT)
        sp.verify(self.data.account_liquidity[account].valid, EC.CMPT_LIQUIDITY_INVALID)
        updatePeriod = sp.compute(self.sub_nat_nat(sp.level, self.data.account_liquidity[account].updateLevel))
        sp.verify(updatePeriod == 0, EC.CMPT_LIQUIDITY_OLD)

    def invalidateLiquidity(self, account):
        sp.if self.data.account_liquidity.contains(account):
           self.data.account_liquidity[account].valid = False

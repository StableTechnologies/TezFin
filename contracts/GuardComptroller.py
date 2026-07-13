import smartpy as sp

CMPTErrors = sp.io.import_script_from_url(
    "file:contracts/errors/ComptrollerErrors.py")
EC = CMPTErrors.ErrorCodes

CMPTInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/ComptrollerInterface.py")

# Incident-mode errors for the June 18 stale-cash containment Guard.
GC_ACTION_DISABLED = "GC_ACTION_DISABLED"
GC_CTOKEN_NOT_FRESH = "GC_CTOKEN_NOT_FRESH"
GC_MARKET_REDEEM_ALREADY_USED_THIS_BLOCK = "GC_MARKET_REDEEM_ALREADY_USED_THIS_BLOCK"
GC_BORROWER_REDEEM_BLOCKED = "GC_BORROWER_REDEEM_BLOCKED"
GC_REDEEM_PAUSED = "GC_REDEEM_PAUSED"
GC_INVALID_ROLLBACK = "GC_INVALID_ROLLBACK"
GC_INVALID_REDEEM_SENDER = "GC_INVALID_REDEEM_SENDER"

# Minimal market metadata. Do not mirror full Comptroller TMarket —
# collaterals/loans/liquidity are intentionally unused after setComptroller.
TGuardMarket = sp.TRecord(
    isListed=sp.TBool,
    # True pauses redemption for the market.
    redeemPaused=sp.TBool,
)


class GuardComptroller(CMPTInterface.ComptrollerInterface):
    """
    Lean incident-mode Comptroller for existing pools at the 4f6121a ABI.

    Compatible with live fToken entrypoints/views. Does not inherit the full
    risk-engine Comptroller (that binary is too large to originate under
    current Previewnet gas limits).

    Policy (mitigation doc):
      mint / borrow / transfer / liquidate / enter / exit -> reject
      repayBorrowAllowed -> allow known markets (incl. disabled, for debt clear)
      removeFromLoans -> no-op (must exist for repay-to-zero)
      redeemAllowed -> listed + not paused + fresh accrual + one redeem
                       per market per block + no debt across allMarkets
                       (caller must be params.cToken)
                       (params: {cToken, redeemer, redeemAmount})
      seizeAllowed -> False
      liquidateCalculateSeizeTokens -> (0, 0)
    """

    def __init__(self, administrator_, markets_=None, approvedRollbackComptroller_=None, **extra_storage):
        initial_markets = {}
        initial_all_markets = []
        if markets_ is not None:
            for market in markets_:
                initial_markets[market] = sp.record(
                    isListed=True, redeemPaused=False)
                initial_all_markets.append(market)

        approved = sp.none
        if approvedRollbackComptroller_ is not None:
            approved = sp.some(approvedRollbackComptroller_)

        self.init(
            administrator=administrator_,
            pendingAdministrator=sp.none,
            markets=sp.big_map(
                l=initial_markets, tkey=sp.TAddress, tvalue=TGuardMarket),
            allMarkets=sp.set(l=initial_all_markets, t=sp.TAddress),
            lastRedeemLevelByMarket=sp.big_map(
                l={}, tkey=sp.TAddress, tvalue=sp.TNat),
            approvedRollbackComptroller=approved,
            **extra_storage
        )

    def verifyNoTez(self):
        sp.verify(sp.amount == sp.utils.nat_to_mutez(0), "TEZ_TRANSFERED")

    def verifyAdministrator(self):
        sp.verify(sp.sender == self.data.administrator, EC.CMPT_NOT_ADMIN)

    def verifyMarketExists(self, token):
        sp.verify(self.data.markets.contains(token), EC.CMPT_MARKET_NOT_EXISTS)

    def verifyMarketListed(self, token):
        sp.verify(self.data.markets.contains(token) &
                  self.data.markets[token].isListed, EC.CMPT_MARKET_NOT_LISTED)

    def hasAnyBorrow(self, account):
        # Scan every market ever supported, including disableMarket'd ones.
        # Do not lazify entrypoints that call this when markets are pre-listed:
        # SmartPy/Michelson asserts on that combination.
        hasBorrow = sp.local("hasBorrow", False)
        sp.for market in self.data.allMarkets.elements():
            borrowData = sp.view(
                "borrowBalanceStoredView",
                market,
                account,
                t=sp.TPair(sp.TNat, sp.TNat)
            ).open_some("INVALID_BORROW_VIEW")
            sp.if sp.fst(borrowData) > 0:
                hasBorrow.value = True
        return hasBorrow.value

    # ------------------------------------------------------------------
    # fToken gates
    # ------------------------------------------------------------------

    @sp.entry_point
    def mintAllowed(self, params):
        self.verifyNoTez()
        sp.set_type(params, CMPTInterface.TMintAllowedParams)
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def borrowAllowed(self, params):
        self.verifyNoTez()
        sp.set_type(params, CMPTInterface.TBorrowAllowedParams)
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def transferAllowed(self, params):
        self.verifyNoTez()
        sp.set_type(params, CMPTInterface.TTransferAllowedParams)
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def liquidateBorrowAllowed(self, params):
        self.verifyNoTez()
        sp.set_type(params, CMPTInterface.TLiquidateBorrowAllowed)
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def repayBorrowAllowed(self, params):
        self.verifyNoTez()
        sp.set_type(params, CMPTInterface.TRepayBorrowAllowedParams)
        # Allow repayment in disabled markets so outstanding debt can be cleared.
        self.verifyMarketExists(params.cToken)

    @sp.entry_point
    def redeemAllowed(self, params):
        self.verifyNoTez()
        # 4f6121a ABI: { cToken, redeemer, redeemAmount }
        sp.set_type(params, CMPTInterface.TRedeemAllowedParams)
        # Only the market cToken may consume the per-block redeem slot.
        sp.verify(sp.sender == params.cToken, GC_INVALID_REDEEM_SENDER)
        self.verifyMarketListed(params.cToken)
        sp.verify(~ self.data.markets[params.cToken].redeemPaused,
                  GC_REDEEM_PAUSED)

        accrual = sp.view(
            "accrualBlockNumber",
            params.cToken,
            sp.unit,
            t=sp.TNat
        ).open_some("INVALID_ACCRUAL_VIEW")
        sp.verify(accrual == sp.level, GC_CTOKEN_NOT_FRESH)

        previous = self.data.lastRedeemLevelByMarket.get(
            params.cToken, sp.nat(0))
        sp.verify(previous < sp.level, GC_MARKET_REDEEM_ALREADY_USED_THIS_BLOCK)
        self.data.lastRedeemLevelByMarket[params.cToken] = sp.level

        sp.verify(~ self.hasAnyBorrow(params.redeemer),
                  GC_BORROWER_REDEEM_BLOCKED)

    @sp.entry_point
    def removeFromLoans(self, borrower):
        """No-op: Guard does not track loans. Must exist for repay-to-zero."""
        self.verifyNoTez()
        sp.set_type(borrower, sp.TAddress)
        self.verifyMarketExists(sp.sender)

    @sp.entry_point
    def enterMarkets(self, cTokens):
        self.verifyNoTez()
        sp.set_type(cTokens, sp.TList(sp.TAddress))
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def exitMarket(self, cToken):
        self.verifyNoTez()
        sp.set_type(cToken, sp.TAddress)
        sp.failwith(GC_ACTION_DISABLED)

    @sp.onchain_view()
    def seizeAllowed(self, params):
        sp.set_type(params, sp.TRecord(
            cTokenCollateral=sp.TAddress, cTokenBorrowed=sp.TAddress))
        sp.result(False)

    @sp.onchain_view()
    def liquidateCalculateSeizeTokens(self, params):
        sp.set_type(params, CMPTInterface.TLiquidateCalculateSeizeTokens)
        sp.result(sp.pair(sp.nat(0), sp.nat(0)))

    # ------------------------------------------------------------------
    # Admin / governance surface
    # ------------------------------------------------------------------

    @sp.entry_point
    def setPendingGovernance(self, pendingAdminAddress):
        self.verifyNoTez()
        sp.set_type(pendingAdminAddress, sp.TAddress)
        self.verifyAdministrator()
        self.data.pendingAdministrator = sp.some(pendingAdminAddress)

    @sp.entry_point
    def acceptGovernance(self, unusedArg):
        self.verifyNoTez()
        sp.set_type(unusedArg, sp.TUnit)
        sp.verify(sp.sender == self.data.pendingAdministrator.open_some(
            EC.CMPT_NOT_SET_PENDING_ADMIN), EC.CMPT_NOT_PENDING_ADMIN)
        self.data.administrator = self.data.pendingAdministrator.open_some()
        self.data.pendingAdministrator = sp.none

    @sp.entry_point
    def supportMarket(self, params):
        self.verifyNoTez()
        # Keep Governance proxy signature: cToken, name, priceExp.
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, name=sp.TString, priceExp=sp.TNat))
        self.verifyAdministrator()
        sp.verify(~ (self.data.markets.contains(params.cToken) &
                     self.data.markets[params.cToken].isListed),
                  EC.CMPT_MARKET_ALREADY_LISTED)
        self.data.markets[params.cToken] = sp.record(
            isListed=True, redeemPaused=False)
        self.data.allMarkets.add(params.cToken)

    @sp.entry_point
    def disableMarket(self, cToken):
        self.verifyNoTez()
        sp.set_type(cToken, sp.TAddress)
        self.verifyAdministrator()
        self.verifyMarketListed(cToken)
        self.data.markets[cToken].isListed = False

    @sp.entry_point
    def setMarketRedeemPaused(self, params):
        self.verifyNoTez()
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, state=sp.TBool))
        self.verifyAdministrator()
        self.verifyMarketListed(params.cToken)
        self.data.markets[params.cToken].redeemPaused = params.state

    @sp.entry_point
    def setApprovedRollbackComptroller(self, comptroller):
        self.verifyNoTez()
        sp.set_type(comptroller, sp.TOption(sp.TAddress))
        self.verifyAdministrator()
        self.data.approvedRollbackComptroller = comptroller

    @sp.entry_point
    def verifyRollbackComptroller(self, comptroller):
        self.verifyNoTez()
        sp.set_type(comptroller, sp.TAddress)
        sp.verify(self.data.approvedRollbackComptroller.is_some(),
                  GC_INVALID_ROLLBACK)
        sp.verify(self.data.approvedRollbackComptroller.open_some() == comptroller,
                  GC_INVALID_ROLLBACK)

    # Unused full-Comptroller admin surface: keep signatures for Governance
    # proxies; reject or no-op in incident mode.

    @sp.entry_point
    def setMintPaused(self, params):
        self.verifyNoTez()
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, state=sp.TBool))
        self.verifyAdministrator()

    @sp.entry_point
    def setBorrowPaused(self, params):
        self.verifyNoTez()
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, state=sp.TBool))
        self.verifyAdministrator()

    @sp.entry_point
    def setTransferPaused(self, state):
        self.verifyNoTez()
        sp.set_type(state, sp.TBool)
        self.verifyAdministrator()

    @sp.entry_point
    def setPriceOracleAndTimeDiff(self, params):
        self.verifyNoTez()
        sp.set_type(params, sp.TRecord(
            priceOracle=sp.TAddress, timeDiff=sp.TInt))
        self.verifyAdministrator()
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def setCloseFactor(self, closeFactorMantissa):
        self.verifyNoTez()
        sp.set_type(closeFactorMantissa, sp.TNat)
        self.verifyAdministrator()
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def setCollateralFactor(self, params):
        self.verifyNoTez()
        sp.set_type(params, sp.TRecord(
            cToken=sp.TAddress, newCollateralFactor=sp.TNat))
        self.verifyAdministrator()
        sp.failwith(GC_ACTION_DISABLED)

    @sp.entry_point
    def setLiquidationIncentive(self, liquidationIncentiveMantissa):
        self.verifyNoTez()
        sp.set_type(liquidationIncentiveMantissa, sp.TNat)
        self.verifyAdministrator()
        sp.failwith(GC_ACTION_DISABLED)

import smartpy as sp

CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")
CMPTInterface = sp.io.import_script_from_url("file:contracts/interfaces/ComptrollerInterface.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
TestAdminFunctionality = sp.io.import_script_from_url("file:contracts/tests/utils/TestAdminFunctionality.py")
CTI = sp.io.import_script_from_url("file:contracts/interfaces/CTokenInterface.py")
CTMock = sp.io.import_script_from_url("file:contracts/tests/mock/CTokenMock.py")
OracleMock = sp.io.import_script_from_url("file:contracts/tests/mock/OracleMock.py")
Exponential = sp.io.import_script_from_url("file:contracts/utils/Exponential.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")


class ComptrollerTest(CMPT.Comptroller):
    def __init__(self, administrator_, oracleAddress_):
        CMPT.Comptroller.__init__(self,
                                  administrator_ = administrator_,
                                  oracleAddress_ = oracleAddress_,
                                  closeFactorMantissa_= sp.nat(0),
                                  liquidationIncentiveMantissa_= sp.nat(0),
                                  maxAssetsPerUser_= sp.nat(3))

    # test-oriented entry points
    @sp.entry_point
    def addMarket(self, params):
        sp.set_type(params, sp.TPair(sp.TAddress, CMPT.TMarket))
        self.data.markets[sp.fst(params)] = sp.snd(params)
        self.data.marketNameToAddress[sp.snd(params).name] = sp.fst(params)

    @sp.entry_point
    def addToLoansExternal(self, params):
        sp.set_type(params, sp.TPair(sp.TAddress, sp.TSet(sp.TAddress)))
        self.data.loans[sp.fst(params)] = sp.snd(params)

    @sp.entry_point
    def setLiquidityForTest(self, params):
        sp.set_type(params, sp.TRecord(account=sp.TAddress, liquidity=sp.TInt))
        self.data.account_liquidity[params.account] = sp.record(
            liquidity=params.liquidity,
            updateLevel=sp.level,
            valid=sp.bool(True))

    @sp.entry_point
    def setMarketRiskForTest(self, params):
        sp.set_type(params, sp.TRecord(cToken=sp.TAddress, collateralFactor=sp.TNat, price=sp.TNat))
        self.data.markets[params.cToken].collateralFactor.mantissa = params.collateralFactor
        self.data.markets[params.cToken].price.mantissa = params.price
        self.data.markets[params.cToken].updateLevel = sp.level
    
    @sp.onchain_view()
    def calculateAccountLiquidityExposed(self, params):
        sp.result(self.calculateAccountLiquidityWithView(params))


@sp.add_test(name = "Comptroller_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("Comptroller tests")

    # Test accounts
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    notMember = sp.test_account("Hasn't accountMembership")
    admin = sp.test_account("admin")
    priceOracle = sp.address("KT10")

    scenario.h2("Accounts")
    scenario.show([alice, admin, notMember])

    exchRate = sp.nat(int(1e18))

    # Contracts
    scenario.h2("Contracts")
    view_result = RV.ViewerInt()
    scenario += view_result
    oracle = OracleMock.OracleMock()
    scenario += oracle
    cmpt = ComptrollerTest( administrator_= admin.address, oracleAddress_=oracle.address)
    scenario += cmpt
    cTokenMock = CTMock.CTokenMock(test_account_snapshot_ = sp.record(
            account = alice.address,
            cTokenBalance = sp.nat(10), 
            borrowBalance = sp.nat(0),
            exchangeRateMantissa = exchRate
        ))
    scenario += cTokenMock

    cTokenMock1 = CTMock.CTokenMock(test_account_snapshot_ = sp.record(
            account = alice.address,
            cTokenBalance = sp.nat(0), 
            borrowBalance = sp.nat(0),
            exchangeRateMantissa = exchRate
        ))
    scenario += cTokenMock1

    # Add stub markets

    listedMarket = cTokenMock1.address
    notListedMarket = sp.address("KT11")
    listedMarketWithoutAccountMembership = sp.address("KT12")

    emptyMembership = sp.big_map(l={}, tkey = sp.TAddress, tvalue = sp.TBool)
    markets = [
        sp.pair(listedMarket,
                sp.record(isListed = sp.bool(True),
                          collateralFactor = sp.record(mantissa=sp.nat(int(1e18))), 
                          mintPaused = sp.bool(True), 
                          borrowPaused = sp.bool(True), 
                          redeemPaused = sp.bool(False),
                          liquidatePaused = sp.bool(False),
                          supplyCap = sp.nat(10**50),
                          borrowCap = sp.nat(10**50),
                          name = sp.string("m1"), 
                          price = sp.record(mantissa=sp.nat(0)),
                          priceExp = 1000000000000000000,
                          updateLevel = sp.nat(0),
                          priceTimestamp= sp.timestamp(0))),

        sp.pair(cTokenMock.address, 
                sp.record(isListed = sp.bool(True), 
                          collateralFactor = sp.record(mantissa=sp.nat(int(1e18))), 
                          mintPaused = sp.bool(True), 
                          borrowPaused = sp.bool(True), 
                          redeemPaused = sp.bool(False),
                          liquidatePaused = sp.bool(False),
                          supplyCap = sp.nat(10**50),
                          borrowCap = sp.nat(10**50),
                          name = sp.string("m4"), 
                          price = sp.record(mantissa=sp.nat(0)),
                          priceExp = 1000000000000000000,
                          updateLevel = sp.nat(0),
                          priceTimestamp= sp.timestamp(0))),
    ]
    initMarkets(scenario, bLevel, markets, cmpt)
    scenario += cmpt.setPriceOracleAndTimeDiff(sp.record(
        priceOracle=oracle.address, timeDiff=sp.int(300))).run(
            sender=admin, level=bLevel.next())
    scenario += cmpt.setPriceBounds(sp.record(
        cToken=listedMarket, minPrice=sp.nat(1), maxPrice=sp.nat(10**50),
        maxChangeBps=sp.nat(10000))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.setPriceBounds(sp.record(
        cToken=cTokenMock.address, minPrice=sp.nat(1), maxPrice=sp.nat(10**50),
        maxChangeBps=sp.nat(10000))).run(sender=admin, level=bLevel.next())
    marketsList = [listedMarket, notListedMarket, listedMarketWithoutAccountMembership, cTokenMock.address]

    scenario.h4("Add Alice and admin to markets")
    cmpt.enterMarkets(sp.list([cTokenMock.address, listedMarket])).run(sender = alice, level = bLevel.next())
    cmpt.enterMarkets(sp.list([cTokenMock.address, listedMarket])).run(sender = admin, level = bLevel.next())
    scenario.h4("Set initial price")
    oracle.setPrice(1)

    scenario.h2("Test paused functionality")

    scenario.h3("Set mint paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set mint paused True", bLevel, admin, alice, cmpt.setMintPaused,
        sp.record(cToken = listedMarket, state = sp.bool(True)))
    scenario.verify(cmpt.data.markets[listedMarket].mintPaused  == sp.bool(True))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set mint paused False", bLevel, admin, alice, cmpt.setMintPaused, 
        sp.record(cToken = listedMarket, state = sp.bool(False)))
    scenario.verify(cmpt.data.markets[listedMarket].mintPaused == sp.bool(False))
    testPauseFunctionsOnMarkets(scenario, "Set mint paused", bLevel, admin, cmpt.setMintPaused, notListedMarket, listedMarket)

    scenario.h3("Set borrow paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set borrow paused True", bLevel, admin, alice, cmpt.setBorrowPaused,
        sp.record(cToken = listedMarket, state = sp.bool(True)))
    scenario.verify(cmpt.data.markets[listedMarket].borrowPaused == sp.bool(True))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set borrow paused False", bLevel, admin, alice, cmpt.setBorrowPaused,
        sp.record(cToken = listedMarket, state = sp.bool(False)))
    scenario.verify(cmpt.data.markets[listedMarket].borrowPaused == sp.bool(False))
    testPauseFunctionsOnMarkets(scenario, "Set borrow paused", bLevel, admin, cmpt.setBorrowPaused, notListedMarket, listedMarket)

    scenario.h3("Set redeem paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set redeem paused True", bLevel, admin, alice, cmpt.setRedeemPaused,
        sp.record(cToken = listedMarket, state = sp.bool(True)))
    scenario.verify(cmpt.data.markets[listedMarket].redeemPaused == sp.bool(True))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set redeem paused False", bLevel, admin, alice, cmpt.setRedeemPaused,
        sp.record(cToken = listedMarket, state = sp.bool(False)))
    scenario.verify(cmpt.data.markets[listedMarket].redeemPaused == sp.bool(False))
    testPauseFunctionsOnMarkets(scenario, "Set redeem paused", bLevel, admin, cmpt.setRedeemPaused, notListedMarket, listedMarket)

    scenario.h3("Set transfer paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set transfer paused True", bLevel, admin, alice, cmpt.setTransferPaused, sp.bool(True))
    scenario.verify(cmpt.data.transferPaused == sp.bool(True))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set transfer paused False", bLevel, admin, alice, cmpt.setTransferPaused, sp.bool(False))
    scenario.verify(cmpt.data.transferPaused == sp.bool(False))

    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(10**50), borrowCap=sp.nat(10**50))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.setBorrowPaused(sp.record(cToken=listedMarket, state=sp.bool(False))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.setTransferPaused(sp.bool(False)).run(sender=admin, level=bLevel.next())

    scenario.h2("Test allowed functionality")
    scenario.h3("Mint allowed")
    minterArgLambda = lambda market : sp.record(cToken=market, minter=alice.address, mintAmount=sp.nat(100))
    scenario.h4("on the listed market")
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = True)
    scenario.h4("on the not listed market")
    scenario += cmpt.mintAllowed(minterArgLambda(notListedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("mint is paused")
    scenario += cmpt.setMintPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.next())
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("mint is not paused")
    scenario += cmpt.setMintPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.next())
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(sender = alice, level = bLevel.next())
    scenario.h4("supply cap cannot be exceeded")
    scenario += cTokenMock1.setMarketTotals(sp.record(supply=sp.nat(100), borrows=sp.nat(0)))
    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(99), borrowCap=sp.nat(10**50))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(
        sender=alice, level=bLevel.next(), valid=False,
        exception=CMPT.EC.CMPT_SUPPLY_CAP_EXCEEDED)
    scenario.h4("supply cap can be reached exactly")
    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(100), borrowCap=sp.nat(10**50))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(
        sender=alice, level=bLevel.next())
    scenario += cTokenMock1.setMarketTotals(sp.record(supply=sp.nat(0), borrows=sp.nat(0)))
    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(10**50), borrowCap=sp.nat(10**50))).run(sender=admin, level=bLevel.next())

    scenario.h3("Redeem allowed")
    cmpt.addToLoansExternal(sp.pair(alice.address, sp.set([cTokenMock.address])))
    redeemArgLambda = lambda market : sp.record(
        cToken=market,
        redeemer=alice.address,
        redeemTokens=sp.nat(10*1000000000000000000),
        exchangeRateMantissa=exchRate)
    scenario.h4("on the listed market, without updated price")
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("when redemption is paused")
    scenario += cmpt.setRedeemPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario += cmpt.setRedeemPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.current())
    scenario.h4("on the listed market, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the not listed market")
    scenario += cmpt.redeemAllowed(redeemArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("with insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(0), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario.show(cmpt.data.collaterals)
    scenario.show(alice.address)
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("without insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(100*1000000000000000000), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("invalid after price was not updated for 5 blocks")
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.add(5), valid = False)

    scenario.h3("Borrow allowed")
    borrowArgLambda = lambda market : sp.record(cToken=market, borrower=alice.address, borrowAmount=sp.nat(100*1000000000000000000))
    scenario.h4("borrow cap cannot be exceeded")
    scenario += cTokenMock1.setMarketTotals(sp.record(supply=sp.nat(0), borrows=sp.nat(100)))
    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(10**50), borrowCap=sp.nat(99))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(
        sender=alice, level=bLevel.next(), valid=False,
        exception=CMPT.EC.CMPT_BORROW_CAP_EXCEEDED)
    scenario += cTokenMock1.setMarketTotals(sp.record(supply=sp.nat(0), borrows=sp.nat(0)))
    scenario += cmpt.setMarketCaps(sp.record(cToken=listedMarket, supplyCap=sp.nat(10**50), borrowCap=sp.nat(10**50))).run(sender=admin, level=bLevel.next())
    scenario.h4("borrow completion is internal only")
    scenario += cmpt.completeBorrowAllowed(borrowArgLambda(listedMarket)).run(
        sender=alice, level=bLevel.next(), valid=False,
        exception=CMPT.EC.CMPT_INVALID_BORROW_SENDER)
    scenario.h4("on the listed market, without updated price")
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the listed market, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the listed market, with updated price and updated liquidity")
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = True)
    scenario.h4("borrowing uses the full debt value when the market collateral factor is zero")
    scenario += cmpt.setCollateralFactor(sp.record(cToken = listedMarket, newCollateralFactor = sp.nat(0))).run(sender = admin, level = bLevel.next())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(sp.record(cToken = listedMarket, borrower = alice.address, borrowAmount = sp.nat(100*1000000000000000000 + 1))).run(
        sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("on the not listed market")
    scenario += cmpt.borrowAllowed(borrowArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("with insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(0), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("without insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(100*1000000000000000000), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("with price errors")
    oracle.setPrice(0)
    scenario += cmpt.updateAllAssetPricesWithView().run(
        level=bLevel.next(), now=sp.timestamp(100), valid=False,
        exception="ASSET_PRICE_OUT_OF_BOUNDS")
    scenario.h4("without price errors")
    oracle.setPrice(1)
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("borrow is paused")
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("borrow is not paused")
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("alice calls borrowAllowed if borrower not in market")
    scenario += cmpt.updateAccountLiquidityWithView(notMember.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.borrowAllowed(sp.record(cToken=listedMarket, borrower=notMember.address, borrowAmount=sp.nat(0))).run(
        sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("cToken calls borrowAllowed if borrower not in market")
    scenario += cmpt.borrowAllowed(sp.record(cToken=listedMarket, borrower=notMember.address, borrowAmount=sp.nat(0))).run(
        sender = listedMarket, level = bLevel.current())
    scenario.h4("invalid after price was not updated for 5 blocks")
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.add(5), valid = False)

    scenario.h3("Repay borrow allowed")
    repayBorrowArgLambda = lambda market : sp.record(cToken=market, payer=admin.address, borrower=alice.address, repayAmount=sp.nat(100))
    scenario.h4("on the listed market")
    scenario += cmpt.repayBorrowAllowed(repayBorrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.next())
    scenario.h4("on the not listed market")
    scenario += cmpt.repayBorrowAllowed(repayBorrowArgLambda(notListedMarket)).run(sender = alice, level = bLevel.next(), valid = False)

    scenario.h3("Liquidation pause does not block repayment")
    liquidateArg = sp.record(cTokenBorrowed=listedMarket,
                             cTokenCollateral=cTokenMock.address,
                             borrower=alice.address, liquidator=bob.address,
                             repayAmount=sp.nat(1))
    scenario += cmpt.setLiquidatePaused(sp.record(cToken=listedMarket, state=sp.bool(True))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.liquidateBorrowAllowed(liquidateArg).run(
        sender=listedMarket, level=bLevel.next(), valid=False,
        exception=CMPT.EC.CMPT_LIQUIDATE_PAUSED)
    scenario += cmpt.repayBorrowAllowed(repayBorrowArgLambda(listedMarket)).run(
        sender=alice, level=bLevel.next())
    scenario += cmpt.setLiquidatePaused(sp.record(cToken=listedMarket, state=sp.bool(False))).run(sender=admin, level=bLevel.next())

    scenario.h3("Incident mode keeps repayment available")
    scenario += cmpt.setMintPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.next())
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.setRedeemPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.setTransferPaused(sp.bool(True)).run(sender = admin, level = bLevel.current())
    scenario += cmpt.mintAllowed(minterArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario += cmpt.transferAllowed(sp.record(cToken = listedMarket, src = alice.address, dst = admin.address, transferTokens = sp.nat(100))).run(sender = alice, level = bLevel.current(), valid = False)
    scenario += cmpt.repayBorrowAllowed(repayBorrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario += cmpt.setMintPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.next())
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.setRedeemPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.setTransferPaused(sp.bool(False)).run(sender = admin, level = bLevel.current())

    scenario.h3("Transfer allowed")
    transferArgLambda = lambda market : sp.record(cToken=market, src=alice.address, dst=admin.address, transferTokens=sp.nat(100))
    # The boundary tests below use a 100% factor so one cToken transferred at
    # a 1.0 exchange rate reduces liquidity by one underlying unit.
    scenario += cmpt.setCollateralFactor(sp.record(cToken = listedMarket, newCollateralFactor = sp.nat(int(1e18)))).run(sender = admin, level = bLevel.next())
    scenario.h4("redeem is allowed, without updated price")
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("redeem is allowed, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("redeem is allowed, with updated price and updated liquidity")
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("redeem is not allowed")
    scenario += cmpt.transferAllowed(transferArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("transfer is paused")
    scenario += cmpt.setTransferPaused(sp.bool(True)).run(sender = admin, level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("transfer is not paused")
    scenario += cmpt.setTransferPaused(sp.bool(False)).run(sender = admin, level = bLevel.current())
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("debt-free holders transfer without a fresh snapshot")
    scenario += cTokenMock1.setSnapshotAvailable(sp.bool(False)).run(level = bLevel.next())
    scenario += cmpt.transferAllowed(sp.record(cToken = listedMarket, src = bob.address, dst = admin.address, transferTokens = sp.nat(100))).run(
        sender = bob, level = bLevel.current())
    scenario.h4("borrowers can transfer a market that is not collateral without a fresh snapshot")
    scenario += cmpt.addToLoansExternal(sp.pair(notMember.address, sp.set([listedMarket]))).run(level = bLevel.next())
    scenario += cmpt.transferAllowed(sp.record(cToken = listedMarket, src = notMember.address, dst = admin.address, transferTokens = sp.nat(100))).run(
        sender = notMember, level = bLevel.current())
    scenario.h4("collateralized borrowers require a fresh snapshot")
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("collateralized borrowers transfer with a current snapshot and sufficient liquidity")
    scenario += cTokenMock1.setSnapshotAvailable(sp.bool(True)).run(level = bLevel.next())
    scenario += cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(100), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("collateralized borrowers cannot transfer into a one-unit shortfall")
    scenario += cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(99), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.next())
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("invalid after price was not updated for 5 blocks")
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.add(5), valid = False)

    scenario.h3("Exit market")
    scenario.h4("The sender hasn't borrow balance, asset price was not updated")
    scenario += cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(10), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.next())
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("The sender hasn't borrow balance, asset price was updated, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("The sender hasn't borrow balance, asset price was updated and updated liquidity")
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), now=sp.timestamp(100))
    scenario.verify(cmpt.data.collaterals[alice.address].contains(cTokenMock.address))  # account membership should exist before
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.current())
    scenario.verify( (~ cmpt.data.collaterals[alice.address].contains(cTokenMock.address)))  # account membership must be removed
    scenario.h4("The sender has borrow balance")
    scenario += cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(10), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate))
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.current(), valid = False)
   
    scenario.h2("Test updateAssetPrice")
    scenario.h3("Update price")
    oracle.setPrice(2)
    scenario += cmpt.updateAllAssetPricesWithView().run(sender = bob, level = bLevel.next(), now=sp.timestamp(100))
    scenario.verify_equal(cmpt.data.markets[listedMarket].price.mantissa, sp.nat(int(2e18)))
    scenario.verify_equal(cmpt.data.markets[listedMarket].updateLevel, bLevel.current())
    scenario.h3("Try to update price at the same level")
    oracle.setPrice(1)
    scenario += cmpt.updateAllAssetPricesWithView().run(sender = bob, level = bLevel.current(), now=sp.timestamp(100))
    scenario.verify_equal(cmpt.data.markets[listedMarket].price.mantissa, sp.nat(int(2e18)))
    scenario.h3("Reject a price timestamp from the future")
    oracle.setTimestamp(sp.timestamp(101))
    scenario += cmpt.updateAllAssetPricesWithView().run(
        sender = bob, level = bLevel.next(), now = sp.timestamp(100),
        valid = False, exception = "FUTURE_ASSET_PRICE")
    scenario.h3("Reject a zero price timestamp")
    oracle.setTimestamp(sp.timestamp(0))
    scenario += cmpt.updateAllAssetPricesWithView().run(
        sender = bob, level = bLevel.next(), now = sp.timestamp(100),
        valid = False, exception = "INVALID_ASSET_PRICE_TIMESTAMP")
    scenario.h3("Reject a price timestamp rollback")
    oracle.setTimestamp(sp.timestamp(100))
    scenario += cmpt.updateAllAssetPricesWithView().run(
        sender = bob, level = bLevel.next(), now = sp.timestamp(100))
    oracle.setTimestamp(sp.timestamp(99))
    scenario += cmpt.updateAllAssetPricesWithView().run(
        sender = bob, level = bLevel.next(), now = sp.timestamp(100),
        valid = False, exception = "ASSET_PRICE_TIMESTAMP_ROLLBACK")
    oracle.clearTimestamp()
    scenario.h3("Reject extreme prices outside configured bounds")
    scenario += cmpt.setPriceBounds(sp.record(cToken=listedMarket,
        minPrice=sp.nat(100000), maxPrice=sp.nat(10000000),
        maxChangeBps=sp.nat(2000))).run(sender=admin, level=bLevel.next())
    oracle.setPrice(1)
    scenario += cmpt.updateAssetPricesWithView(sp.set([listedMarket])).run(
        sender=bob, level=bLevel.next(), now=sp.timestamp(100), valid=False,
        exception="ASSET_PRICE_OUT_OF_BOUNDS")
    oracle.setPrice(9000000000000000)
    scenario += cmpt.updateAssetPricesWithView(sp.set([listedMarket])).run(
        sender=bob, level=bLevel.next(), now=sp.timestamp(100), valid=False,
        exception="ASSET_PRICE_OUT_OF_BOUNDS")
    scenario += cmpt.setPriceBounds(sp.record(cToken=listedMarket,
        minPrice=sp.nat(1), maxPrice=sp.nat(10**50),
        maxChangeBps=sp.nat(10000))).run(sender=admin, level=bLevel.next())
    oracle.setPrice(1)
    scenario.h3("Unrelated unhealthy market does not block account price updates")
    healthyMarketAccount = sp.test_account("healthy market account")
    scenario += cmpt.addToLoansExternal(sp.pair(
        healthyMarketAccount.address, sp.set([listedMarket]))).run(
            level=bLevel.next())
    scenario += cmpt.setPriceBounds(sp.record(
        cToken=cTokenMock.address, minPrice=sp.nat(2), maxPrice=sp.nat(3),
        maxChangeBps=sp.nat(10000))).run(sender=admin, level=bLevel.next())
    scenario += cmpt.updateAllAssetPricesWithView().run(
        sender=bob, level=bLevel.next(), now=sp.timestamp(100), valid=False,
        exception="ASSET_PRICE_OUT_OF_BOUNDS")
    scenario += cmpt.updateAccountLiquidityWithView(
        healthyMarketAccount.address).run(
            sender=bob, level=bLevel.next(), now=sp.timestamp(100))
    scenario.verify(cmpt.data.account_liquidity[
        healthyMarketAccount.address].valid)
    scenario += cmpt.setPriceBounds(sp.record(
        cToken=cTokenMock.address, minPrice=sp.nat(1), maxPrice=sp.nat(10**50),
        maxChangeBps=sp.nat(10000))).run(sender=admin, level=bLevel.next())

    scenario.h2("Test account liquidity")
    cmpt.enterMarkets(sp.list([cTokenMock.address])).run(sender = bob, level = bLevel.next())
    scenario.h3("Get current liquidity, without updated price")
    cTokenMock.setAccountSnapshot(sp.record(account = bob.address, cTokenBalance = sp.nat(10), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate))
    liquidityParams = sp.record(account=bob.address)
    scenario.h3("Get current liquidity, with updated price")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    result = sp.view("calculateAccountLiquidityExposed", cmpt.address, liquidityParams, t=sp.TRecord(sumBorrowPlusEffects = sp.TNat,sumCollateral = sp.TNat)).open_some()
    scenario.verify_equal((result.sumCollateral-result.sumBorrowPlusEffects), -90) # borrows(100) - balance(10)
    scenario.h3("Get liquidity with redeem")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    liquidityParams = sp.record(account=bob.address)
    result = sp.view("calculateAccountLiquidityExposed", cmpt.address, liquidityParams, t=sp.TRecord(sumBorrowPlusEffects = sp.TNat,sumCollateral = sp.TNat)).open_some()
    scenario.verify_equal((result.sumCollateral-result.sumBorrowPlusEffects), -90)
    scenario.h3("Get liquidity with borrow")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    liquidityParams = sp.record(account=bob.address)
    result = sp.view("calculateAccountLiquidityExposed", cmpt.address, liquidityParams, t=sp.TRecord(sumBorrowPlusEffects = sp.TNat,sumCollateral = sp.TNat)).open_some()
    scenario.verify_equal((result.sumCollateral-result.sumBorrowPlusEffects), -90)

    scenario.h2("Test admin functionality")
    scenario.h3("Set price oracle")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set price oracle", bLevel, admin, alice, cmpt.setPriceOracleAndTimeDiff,
        sp.record(priceOracle=priceOracle, timeDiff=300))
    scenario.verify(cmpt.data.oracleAddress == priceOracle)

    scenario.h3("Set close factor")
    closeFactor = sp.nat(1)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set close factor", bLevel, admin, alice, cmpt.setCloseFactor,
        closeFactor)
    scenario.verify(cmpt.data.closeFactorMantissa == closeFactor)

    scenario.h3("Set liquidation incentive")
    liquidationIncentiveMantissa = sp.nat(1)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set liquidation incentive", bLevel, admin, alice, cmpt.setLiquidationIncentive,
        liquidationIncentiveMantissa)
    scenario.verify(cmpt.data.liquidationIncentiveMantissa == liquidationIncentiveMantissa)

    scenario.h3("Set collateral factor")
    collateralFactor = sp.record(cToken = listedMarket, newCollateralFactor = sp.nat(2))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set collateral factor", bLevel, admin, alice, cmpt.setCollateralFactor,
        collateralFactor)
    scenario.verify(cmpt.data.markets[collateralFactor.cToken].collateralFactor.mantissa == collateralFactor.newCollateralFactor)
    scenario.h4("Not listed market")
    notListedMarket = sp.test_account("[setCollateralFactor] not listed market").address
    collateralFactor = sp.record(cToken = notListedMarket, newCollateralFactor = sp.nat(2))
    scenario += cmpt.setCollateralFactor(collateralFactor).run(sender = admin, level = bLevel.next(), valid = False)
    scenario.h4("A collateral factor cannot exceed one")
    collateralFactor = sp.record(cToken = listedMarket, newCollateralFactor = sp.nat(int(1e18) + 1))
    scenario += cmpt.setCollateralFactor(collateralFactor).run(sender = admin, level = bLevel.next(), valid = False)

    scenario.h3("Support market")
    newMarket = sp.test_account("[supportMarket] new market").address
    supportMarketParams = sp.record(cToken=newMarket, name=sp.string("market"), priceExp=1000000000000000000)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "support market", bLevel, admin, alice, cmpt.supportMarket,
        supportMarketParams)
    scenario.verify(cmpt.data.markets.contains(newMarket) & cmpt.data.markets[newMarket].isListed)
    scenario.verify(cmpt.data.marketNameToAddress.contains("market-USD"))
    scenario.h4("Zero price exponent")
    zeroPriceExpMarket = sp.test_account("[supportMarket] zero price exponent").address
    scenario += cmpt.supportMarket(sp.record(
        cToken=zeroPriceExpMarket, name=sp.string("zero-exp"),
        priceExp=sp.nat(0))).run(
            sender=admin, level=bLevel.next(), valid=False,
            exception="INVALID_PRICE_EXP")
    scenario.h4("Already listed market")
    cmpt.supportMarket(supportMarketParams).run(sender = admin, level = bLevel.next(), valid = False)

    scenario.h3("Disable market")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "disable market", bLevel, admin, alice, cmpt.disableMarket,
        newMarket)
    scenario.verify(cmpt.data.markets.contains(newMarket) & ~ cmpt.data.markets[newMarket].isListed)
    scenario.h4("Not listed market")
    notListedMarket = sp.test_account("[disableMarket] not listed market").address
    cmpt.disableMarket(notListedMarket).run(sender = admin, level = bLevel.next(), valid = False)

    scenario.h3("Pending governance")
    pendingGovernance = sp.test_account("[governance] pending governance")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set pending governance", bLevel, admin, alice, cmpt.setPendingGovernance, pendingGovernance.address)
    scenario.verify(cmpt.data.pendingAdministrator.open_some() == pendingGovernance.address)

    scenario.h3("Accept governance")
    scenario.h4("Not pending admin attempts to accept governance")
    scenario += cmpt.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h4("Pending admin attempts to accept governance")
    scenario += cmpt.acceptGovernance(sp.unit).run(sender=pendingGovernance, level=bLevel.next())
    scenario.verify(cmpt.data.administrator == pendingGovernance.address)
    scenario.verify( ~ cmpt.data.pendingAdministrator.is_some())

    # [CONSISTENCY] return governance back to test account "admin"
    scenario += cmpt.setPendingGovernance(admin.address).run(sender=pendingGovernance, level=bLevel.next())
    scenario += cmpt.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.next())

    scenario.h2("Test Asset Limit Functionality")
    scenario.h3("Setup additional markets for asset limit testing")
    cTokenExtra1 = CTMock.CTokenMock(test_account_snapshot_ = sp.record(
        account = alice.address,
        cTokenBalance = sp.nat(10), 
        borrowBalance = sp.nat(0),
        exchangeRateMantissa = exchRate
    ))
    scenario += cTokenExtra1
    
    cTokenExtra2 = CTMock.CTokenMock(test_account_snapshot_ = sp.record(
        account = alice.address,
        cTokenBalance = sp.nat(10), 
        borrowBalance = sp.nat(0),
        exchangeRateMantissa = exchRate
    ))
    scenario += cTokenExtra2

    extraMarkets = [
        sp.pair(cTokenExtra1.address,
                sp.record(isListed = sp.bool(True),
                          collateralFactor = sp.record(mantissa=sp.nat(int(5e17))), 
                          mintPaused = sp.bool(False), 
                          borrowPaused = sp.bool(False), 
                          redeemPaused = sp.bool(False),
                          liquidatePaused = sp.bool(False),
                          supplyCap = sp.nat(10**50),
                          borrowCap = sp.nat(10**50),
                          name = sp.string("extra1"), 
                          price = sp.record(mantissa=sp.nat(int(1e18))),
                          priceExp = sp.nat(int(1e18)),
                          updateLevel = sp.nat(0),
                          priceTimestamp= sp.timestamp(0))),
        sp.pair(cTokenExtra2.address,
                sp.record(isListed = sp.bool(True),
                          collateralFactor = sp.record(mantissa=sp.nat(int(5e17))), 
                          mintPaused = sp.bool(False), 
                          borrowPaused = sp.bool(False), 
                          redeemPaused = sp.bool(False),
                          liquidatePaused = sp.bool(False),
                          supplyCap = sp.nat(10**50),
                          borrowCap = sp.nat(10**50),
                          name = sp.string("extra2"), 
                          price = sp.record(mantissa=sp.nat(int(1e18))),
                          priceExp = sp.nat(int(1e18)),
                          updateLevel = sp.nat(0),
                          priceTimestamp= sp.timestamp(0)))
    ]
    
    for market in extraMarkets:
        scenario += cmpt.addMarket(market).run(level = bLevel.next())

    scenario.h3("Test max assets per user limit")
    
    scenario.h4("Check initial max assets limit")
    scenario.verify_equal(cmpt.data.maxAssetsPerUser, 3)

    scenario.h4("Admin can change max assets limit")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set max assets per user", bLevel, admin, alice, cmpt.setMaxAssetsPerUser, sp.nat(2))
    scenario.verify_equal(cmpt.data.maxAssetsPerUser, 2)

    scenario.h4("Reset limit back to 3 for testing")
    scenario += cmpt.setMaxAssetsPerUser(sp.nat(3)).run(sender=admin, level=bLevel.next())
    
    scenario.h3("Test asset limit enforcement in enterMarkets")
    # Alice currently has 2 assets
    scenario.h4("Alice currently has 2 assets")
    alice_count = sp.view("getUserAssetsCount", cmpt.address, alice.address, t=sp.TNat).open_some()
    scenario.show(alice_count)
    scenario.verify_equal(alice_count, 2)
    
    scenario.h4("Alice can enter 1 more market (within limit)")
    scenario += cmpt.enterMarkets([cTokenExtra1.address]).run(
        sender=alice, level=bLevel.next())
    
    scenario.verify(cmpt.data.collaterals[alice.address].contains(cTokenExtra1.address))
    
    scenario.h4("Alice now has 3 assets (at limit)")
    alice_count = sp.view("getUserAssetsCount", cmpt.address, alice.address, t=sp.TNat).open_some()
    scenario.verify_equal(alice_count, 3)
    
    scenario.h4("Alice cannot enter 4th market (exceeds limit)")
    scenario += cmpt.enterMarkets([cTokenExtra2.address]).run(
        sender=alice, level=bLevel.next(), valid=False)
    
    scenario.h4("Alice cannot borrow from new market (would exceed limit)")
    scenario += cmpt.borrowAllowed(borrowArgLambda(cTokenExtra2.address)).run(sender = alice, level = bLevel.current(), valid = False)

# Helpers

def initMarkets(scenario, bLevel, marketPairs, testCMPT):
    for marketPair in marketPairs:
        scenario += testCMPT.addMarket(marketPair).run(level = bLevel.next(), show = False)

def testPauseFunctionsOnMarkets(scenario, actionText, bLevel, sender, callableObj, notListedMarket, listedMarket, isValidOnNotListedMarket = False, isValidOnListedMarket = True):
    scenario.h4(f'{actionText} on listed market')
    scenario += callableObj(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = sender, level = bLevel.next(), valid = isValidOnListedMarket)
    scenario.h4(f'{actionText} on not listed market')
    scenario += callableObj(sp.record(cToken = notListedMarket, state = sp.bool(False))).run(sender = sender, level = bLevel.next(), valid = isValidOnNotListedMarket)

def updateAssetsPrices(scenario, cmpt, bLevel, markets):
    bLevel.next()
    cmpt.updateAllAssetPricesWithView().run(level = bLevel.current(), now=sp.timestamp(100))


@sp.add_test(name = "Comptroller_Collateral_Boundaries")
def collateral_boundary_matrix():
    """Exercise each action at the liquidity boundary independently.

    The expected reduction is calculated here as
    underlyingAmount * oraclePrice * collateralFactor, with the two 1e18
    fixed-point scale factors applied independently from Comptroller helpers.
    """
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")
    admin = sp.test_account("boundary admin")
    account = sp.test_account("boundary account")
    oracle = OracleMock.OracleMock()
    scenario += oracle
    cmpt = ComptrollerTest(administrator_=admin.address, oracleAddress_=oracle.address)
    scenario += cmpt
    exchange_scale = int(1e18)
    price = exchange_scale
    transfer_tokens = 10
    cToken = CTMock.CTokenMock(test_account_snapshot_=sp.record(
        account=account.address,
        cTokenBalance=sp.nat(transfer_tokens),
        borrowBalance=sp.nat(0),
        exchangeRateMantissa=sp.nat(exchange_scale)))
    scenario += cToken
    scenario += cmpt.addMarket(sp.pair(cToken.address, sp.record(
        isListed=sp.bool(True),
        collateralFactor=sp.record(mantissa=sp.nat(0)),
        mintPaused=sp.bool(False),
        borrowPaused=sp.bool(False),
        redeemPaused=sp.bool(False),
        liquidatePaused=sp.bool(False),
        supplyCap=sp.nat(10**50),
        borrowCap=sp.nat(10**50),
        name=sp.string("boundary"),
        price=sp.record(mantissa=sp.nat(price)),
        priceExp=sp.nat(exchange_scale),
        updateLevel=sp.nat(0),
        priceTimestamp=sp.timestamp(0)))).run(level=bLevel.next())
    scenario += cmpt.setTransferPaused(sp.bool(False)).run(sender=admin, level=bLevel.next())
    scenario += cmpt.enterMarkets([cToken.address]).run(sender=account, level=bLevel.next())
    scenario += cmpt.addToLoansExternal(sp.pair(account.address, sp.set([cToken.address]))).run(level=bLevel.next())

    factors = [0, int(5e17), int(9e17)]
    exchange_rates = [int(5e17), exchange_scale, int(2e18)]
    offsets = [(-1, False), (0, True), (1, True)]

    scenario.h2("Redeem boundary matrix: 0%, 50%, and 90% collateral factors")
    for factor in factors:
        reduction = transfer_tokens * price * factor // exchange_scale // exchange_scale
        for offset, valid in offsets:
            scenario += cmpt.setMarketRiskForTest(sp.record(cToken=cToken.address, collateralFactor=sp.nat(factor), price=sp.nat(price))).run(level=bLevel.next())
            scenario += cmpt.setLiquidityForTest(sp.record(account=account.address, liquidity=sp.int(reduction + offset))).run(level=bLevel.current())
            scenario += cmpt.redeemAllowed(sp.record(
                cToken=cToken.address,
                redeemer=account.address,
                redeemTokens=sp.nat(transfer_tokens),
                exchangeRateMantissa=sp.nat(exchange_scale))).run(
                sender=account, level=bLevel.current(), valid=valid)

    scenario.h2("Transfer boundary matrix: exchange rates below, at, and above one")
    for factor in factors:
        for exchange_rate in exchange_rates:
            token_value = price * factor // exchange_scale * exchange_rate // exchange_scale
            collateral_before = token_value * (2 * transfer_tokens) // exchange_scale
            collateral_after = token_value * transfer_tokens // exchange_scale
            reduction = collateral_before - collateral_after
            scenario += cToken.setAccountSnapshot(sp.record(
                account=account.address,
                cTokenBalance=sp.nat(transfer_tokens),
                borrowBalance=sp.nat(0),
                exchangeRateMantissa=sp.nat(exchange_rate))).run(level=bLevel.next())
            for offset, valid in offsets:
                scenario += cmpt.setMarketRiskForTest(sp.record(cToken=cToken.address, collateralFactor=sp.nat(factor), price=sp.nat(price))).run(level=bLevel.next())
                scenario += cmpt.setLiquidityForTest(sp.record(account=account.address, liquidity=sp.int(reduction + offset))).run(level=bLevel.current())
                scenario += cmpt.transferAllowed(sp.record(cToken=cToken.address, src=account.address, dst=admin.address, transferTokens=sp.nat(transfer_tokens))).run(
                    sender=account, level=bLevel.current(), valid=valid)

    scenario.h2("Exit-market boundary matrix: exchange rates below, at, and above one")
    for factor in factors:
        for exchange_rate in exchange_rates:
            token_value = price * factor // exchange_scale * exchange_rate // exchange_scale
            reduction = token_value * transfer_tokens // exchange_scale
            for offset, valid in offsets:
                # A prior successful exit removes membership; put it back for
                # the next matrix cell before setting the current liquidity.
                scenario += cmpt.enterMarkets([cToken.address]).run(sender=account, level=bLevel.next())
                scenario += cToken.setAccountSnapshot(sp.record(
                    account=account.address,
                    cTokenBalance=sp.nat(transfer_tokens),
                    borrowBalance=sp.nat(0),
                    exchangeRateMantissa=sp.nat(exchange_rate))).run(level=bLevel.current())
                scenario += cmpt.setMarketRiskForTest(sp.record(cToken=cToken.address, collateralFactor=sp.nat(factor), price=sp.nat(price))).run(level=bLevel.current())
                scenario += cmpt.setLiquidityForTest(sp.record(account=account.address, liquidity=sp.int(reduction + offset))).run(level=bLevel.current())
                scenario += cmpt.exitMarket(cToken.address).run(sender=account, level=bLevel.current(), valid=valid)

    scenario.h2("Fractional exchange rates use the exact rounded collateral delta")
    fractional_rate = int(15e17)  # 1.5 underlying per cToken
    scenario += cmpt.enterMarkets([cToken.address]).run(
        sender=account, level=bLevel.next())
    scenario += cmpt.setMarketRiskForTest(sp.record(
        cToken=cToken.address,
        collateralFactor=sp.nat(exchange_scale),
        price=sp.nat(exchange_scale))).run(level=bLevel.current())

    # Before the action, two cTokens are worth three collateral units. With
    # debt of two, liquidity is one. Removing one cToken leaves collateral of
    # one, so every removal path must reject the resulting one-unit shortfall.
    scenario += cToken.setAccountSnapshot(sp.record(
        account=account.address,
        cTokenBalance=sp.nat(1),  # post-action balance seen by redeem/transfer
        borrowBalance=sp.nat(0),
        exchangeRateMantissa=sp.nat(fractional_rate))).run(level=bLevel.current())
    scenario += cmpt.setLiquidityForTest(sp.record(
        account=account.address, liquidity=sp.int(1))).run(level=bLevel.current())
    scenario += cmpt.redeemAllowed(sp.record(
        cToken=cToken.address,
        redeemer=account.address,
        redeemTokens=sp.nat(1),
        exchangeRateMantissa=sp.nat(fractional_rate))).run(
        sender=cToken.address, level=bLevel.current(), valid=False)

    scenario += cmpt.setLiquidityForTest(sp.record(
        account=account.address, liquidity=sp.int(1))).run(level=bLevel.next())
    scenario += cmpt.setMarketRiskForTest(sp.record(
        cToken=cToken.address,
        collateralFactor=sp.nat(exchange_scale),
        price=sp.nat(exchange_scale))).run(level=bLevel.current())
    scenario += cmpt.transferAllowed(sp.record(
        cToken=cToken.address,
        src=account.address,
        dst=admin.address,
        transferTokens=sp.nat(1))).run(
        sender=cToken.address, level=bLevel.current(), valid=False)

    scenario += cToken.setAccountSnapshot(sp.record(
        account=account.address,
        cTokenBalance=sp.nat(2),  # pre-action balance supplied to exitMarket
        borrowBalance=sp.nat(0),
        exchangeRateMantissa=sp.nat(fractional_rate))).run(level=bLevel.next())
    scenario += cmpt.setLiquidityForTest(sp.record(
        account=account.address, liquidity=sp.int(1))).run(level=bLevel.current())
    scenario += cmpt.setMarketRiskForTest(sp.record(
        cToken=cToken.address,
        collateralFactor=sp.nat(exchange_scale),
        price=sp.nat(exchange_scale))).run(level=bLevel.current())
    scenario += cmpt.exitMarket(cToken.address).run(
        sender=account, level=bLevel.current(), valid=False)

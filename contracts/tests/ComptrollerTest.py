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
                                  liquidationIncentiveMantissa_= sp.nat(0))
    
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
    
    @sp.onchain_view()
    def calculateAccountLiquidityExposed(self, params):
        sp.result(self.calculateAccountLiquidityWithView(params))


@sp.add_test(name = "Comptroller_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "kathmandu")

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
                          name = sp.string("m1"), 
                          price = sp.record(mantissa=sp.nat(0)),
                          priceExp = 1000000000000000000,
                          updateLevel = sp.nat(0),
                          borrowCap = sp.nat(0))),

        sp.pair(cTokenMock.address, 
                sp.record(isListed = sp.bool(True), 
                          collateralFactor = sp.record(mantissa=sp.nat(int(1e18))), 
                          mintPaused = sp.bool(True), 
                          borrowPaused = sp.bool(True), 
                          name = sp.string("m4"), 
                          price = sp.record(mantissa=sp.nat(0)),
                          priceExp = 1000000000000000000,
                          updateLevel = sp.nat(0),
                          borrowCap = sp.nat(0)))
    ]
    initMarkets(scenario, bLevel, markets, cmpt)
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

    scenario.h3("Set transfer paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set transfer paused True", bLevel, admin, alice, cmpt.setTransferPaused, sp.bool(True))
    scenario.verify(cmpt.data.transferPaused == sp.bool(True))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set transfer paused False", bLevel, admin, alice, cmpt.setTransferPaused, sp.bool(False))
    scenario.verify(cmpt.data.transferPaused == sp.bool(False))

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

    scenario.h3("Redeem allowed")
    cmpt.addToLoansExternal(sp.pair(alice.address, sp.set([cTokenMock.address])))
    redeemArgLambda = lambda market : sp.record(cToken=market, redeemer=alice.address, redeemAmount=sp.nat(10*1000000000000000000))
    scenario.h4("on the listed market, without updated price")
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the listed market, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the not listed market")
    scenario += cmpt.redeemAllowed(redeemArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("with insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(0), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario.show(cmpt.data.collaterals)
    scenario.show(alice.address)
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("without insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(100*1000000000000000000), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("invalid after price was not updated for 5 blocks")
    scenario += cmpt.redeemAllowed(redeemArgLambda(listedMarket)).run(sender = alice, level = bLevel.add(5), valid = False)

    scenario.h3("Borrow allowed")
    borrowArgLambda = lambda market : sp.record(cToken=market, borrower=alice.address, borrowAmount=sp.nat(100*1000000000000000000))
    scenario.h4("on the listed market, without updated price")
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the listed market, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("on the listed market, with updated price and updated liquidity")
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = True)
    scenario.h4("on the not listed market")
    scenario += cmpt.borrowAllowed(borrowArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("with insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(0), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("without insufficient liquidity")
    cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(100*1000000000000000000), borrowBalance = sp.nat(0), exchangeRateMantissa = exchRate)).run(level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("with price errors")
    oracle.setPrice(0)
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next(), valid = False)
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("without price errors")
    oracle.setPrice(1)
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("borrow is paused")
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(True))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("borrow is not paused")
    scenario += cmpt.setBorrowPaused(sp.record(cToken = listedMarket, state = sp.bool(False))).run(sender = admin, level = bLevel.current())
    scenario += cmpt.borrowAllowed(borrowArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("alice calls borrowAllowed if borrower not in market")
    scenario += cmpt.updateAccountLiquidityWithView(notMember.address).run(sender = alice, level = bLevel.next())
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

    scenario.h3("Transfer allowed")
    transferArgLambda = lambda market : sp.record(cToken=market, src=alice.address, dst=admin.address, transferTokens=sp.nat(100))
    scenario.h4("redeem is allowed, without updated price")
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("redeem is allowed, with updated price, without updated liquidity")
    updateAssetsPrices(scenario, cmpt, bLevel, marketsList)
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.next(), valid = False)
    scenario.h4("redeem is allowed, with updated price and updated liquidity")
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
    scenario.h4("redeem is not allowed")
    scenario += cmpt.transferAllowed(transferArgLambda(notListedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("transfer is paused")
    scenario += cmpt.setTransferPaused(sp.bool(True)).run(sender = admin, level = bLevel.current())
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current(), valid = False)
    scenario.h4("transfer is not paused")
    scenario += cmpt.setTransferPaused(sp.bool(False)).run(sender = admin, level = bLevel.current())
    scenario += cmpt.transferAllowed(transferArgLambda(listedMarket)).run(sender = alice, level = bLevel.current())
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
    scenario += cmpt.updateAccountLiquidityWithView(alice.address).run(sender = alice, level = bLevel.next())
    scenario.verify(cmpt.data.collaterals[alice.address].contains(cTokenMock.address))  # account membership should exist before
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.current())
    scenario.verify( (~ cmpt.data.collaterals[alice.address].contains(cTokenMock.address)))  # account membership must be removed
    scenario.h4("The sender has borrow balance")
    scenario += cTokenMock.setAccountSnapshot(sp.record(account = alice.address, cTokenBalance = sp.nat(10), borrowBalance = sp.nat(100), exchangeRateMantissa = exchRate))
    cmpt.exitMarket(cTokenMock.address).run(sender = alice, level = bLevel.current(), valid = False)
   
    scenario.h2("Test updateAssetPrice")
    scenario.h3("Update price")
    oracle.setPrice(2)
    scenario += cmpt.updateAllAssetPricesWithView().run(sender = bob, level = bLevel.next())
    scenario.verify_equal(cmpt.data.markets[listedMarket].price.mantissa, sp.nat(int(2e18)))
    scenario.verify_equal(cmpt.data.markets[listedMarket].updateLevel, bLevel.current())
    scenario.h3("Try to update price at the same level")
    oracle.setPrice(1)
    scenario += cmpt.updateAllAssetPricesWithView().run(sender = bob, level = bLevel.current())
    scenario.verify_equal(cmpt.data.markets[listedMarket].price.mantissa, sp.nat(int(2e18)))

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
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set price oracle", bLevel, admin, alice, cmpt.setPriceOracle,
        priceOracle)
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

    scenario.h3("Support market")
    newMarket = sp.test_account("[supportMarket] new market").address
    supportMarketParams = sp.record(cToken=newMarket, name=sp.string("market"), priceExp=1000000000000000000)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "support market", bLevel, admin, alice, cmpt.supportMarket,
        supportMarketParams)
    scenario.verify(cmpt.data.markets.contains(newMarket) & cmpt.data.markets[newMarket].isListed)
    scenario.verify(cmpt.data.marketNameToAddress.contains("market-USD"))
    scenario.h4("Already listed market")
    cmpt.supportMarket(supportMarketParams).run(sender = admin, level = bLevel.next(), valid = False)

    scenario.h3("Disable market")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "disable market", bLevel, admin, alice, cmpt.disableMarket,
        newMarket)
    scenario.verify(cmpt.data.markets.contains(newMarket) & ~ cmpt.data.markets[newMarket].isListed)
    scenario.h4("Not listed market")
    notListedMarket = sp.test_account("[disableMarket] not listed market").address
    cmpt.disableMarket(notListedMarket).run(sender = admin, level = bLevel.next(), valid = False)

    scenario.h3("Set market borrow cap")
    borrowCapRecord = sp.record(cToken = newMarket, newBorrowCap = sp.nat(2))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set market borrow cap", bLevel, admin, alice, cmpt.setMarketBorrowCap,
        borrowCapRecord)
    scenario.verify(cmpt.data.markets[borrowCapRecord.cToken].borrowCap == borrowCapRecord.newBorrowCap)
    scenario.h4("Non-existant market")
    notExistantMarket = sp.test_account("[setMarketBorrowCap] non-existant market").address
    borrowCapRecord = sp.record(cToken = notExistantMarket, newBorrowCap = sp.nat(2))
    scenario += cmpt.setMarketBorrowCap(borrowCapRecord).run(sender = admin, level = bLevel.next(), valid = False)

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
    cmpt.updateAllAssetPricesWithView().run(level = bLevel.current())

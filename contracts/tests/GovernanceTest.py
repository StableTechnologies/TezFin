import smartpy as sp

GOV = sp.io.import_script_from_url("file:contracts/Governance.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
CMPT = sp.io.import_script_from_url("file:contracts/Comptroller.py")
TestAdminFunctionality = sp.io.import_script_from_url("file:contracts/tests/utils/TestAdminFunctionality.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
OracleMock = sp.io.import_script_from_url("file:contracts/tests/mock/OracleMock.py")
IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
FA12Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA12Mock.py")

@sp.add_test(name = "Governor tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("Governor tests")

    # Test accounts
    alice = sp.test_account("Alice")
    admin = sp.test_account("admin")

    scenario.h2("Accounts")
    scenario.show([alice, admin])

    # Contracts
    scenario.h2("Contracts")
    governor = GOV.Governance(admin.address)
    scenario += governor
    cmpt = CMPT.Comptroller(administrator_= governor.address,
        oracleAddress_ = sp.address("KT10"),
        closeFactorMantissa_= sp.nat(0),
        liquidationIncentiveMantissa_= sp.nat(0))
    scenario += cmpt
    
    multiplierPerBlock = 180000000000 # 0.00000018
    baseRatePerBlock = 840000000000 # 0.00000084
    irm = IRM.InterestRateModel(multiplierPerBlock_=multiplierPerBlock, baseRatePerBlock_=baseRatePerBlock, scale_=1000000000000000000)
    scenario += irm 

    fa12Target = FA12Mock.FA12Mock()
    scenario += fa12Target
    cfa12 = CFA12.CFA12(comptroller_=cmpt.address, 
                        interestRateModel_=irm.address,
                        initialExchangeRateMantissa_=sp.nat(int(1e12)),
                        administrator_=governor.address,
                        fa1_2_TokenAddress_ = fa12Target.address)
    scenario += cfa12
    cxtz = CXTZ.CXTZ(comptroller_=cmpt.address, 
                   interestRateModel_=irm.address, 
                   administrator_=governor.address)
    scenario += cxtz
    oracle = OracleMock.OracleMock()
    scenario += oracle
    
    scenario.h2("Governor governance")
    scenario.h3("Pending governance")
    pendingGovernance = sp.test_account("[governance] pending governance")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set pending governance", bLevel, admin, alice, governor.setPendingGovernance, pendingGovernance.address)
    scenario.verify(governor.data.pendingAdministrator.open_some() == pendingGovernance.address)

    scenario.h3("Accept governance")
    scenario.h4("Not pending admin attempts to accept governance")
    scenario += governor.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.current(), valid=False)
    scenario.h4("Pending admin attempts to accept governance")
    scenario += governor.acceptGovernance(sp.unit).run(sender=pendingGovernance, level=bLevel.current())
    scenario.verify(governor.data.administrator == pendingGovernance.address)
    scenario.verify( ~ governor.data.pendingAdministrator.is_some())

    # [CONSISTENCY] return governance back to test account "admin"
    scenario += governor.setPendingGovernance(admin.address).run(sender=pendingGovernance, level=bLevel.current())
    scenario += governor.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.current())

    testCToken(scenario, cxtz, bLevel, alice, admin, governor, cmpt, irm, oracle, "CXTZ")
    testCxtzReserves(scenario, cxtz, bLevel, alice, admin, governor)

    testCToken(scenario, cfa12, bLevel, alice, admin, governor, cmpt, irm, oracle, "CFA12")
    testCfa12Reserves(scenario, cfa12, fa12Target, bLevel, alice, admin, governor)

    testComptroller(scenario, cxtz, bLevel, alice, admin, governor, cmpt, oracle)
    

def testCToken(scenario, ctoken, bLevel, alice, admin, governor, cmpt, irm, oracle, cTokenName):
    scenario.h2(cTokenName)
    scenario.h3("Set cToken governance")
    arg = sp.record(contractAddress = ctoken.address, governance = alice.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set contract governance", bLevel, admin, alice, governor.setContractGovernance, arg)
    scenario.verify(ctoken.data.pendingAdministrator.open_some() == alice.address)

    scenario.h3("Accept cToken governance")
    scenario += ctoken.acceptGovernance(sp.unit).run(sender=alice, level=bLevel.current())
    scenario += ctoken.setPendingGovernance(governor.address).run(sender=alice, level=bLevel.current())
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "accept contract governance", bLevel, admin, alice, governor.acceptContractGovernance, ctoken.address)
    scenario.verify(ctoken.data.administrator == governor.address)

    scenario.h3("Set comptroller")
    arg = sp.record(cToken = ctoken.address, comptroller = cmpt.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set comptroller", bLevel, admin, alice, governor.setComptroller, arg)
    scenario.verify(ctoken.data.comptroller == arg.comptroller)
    
    scenario.h3("Set interest rate model")
    arg = sp.record(cToken = ctoken.address, interestRateModel = irm.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set interest rate model", bLevel, admin, alice, governor.setInterestRateModel, arg)
    scenario.verify(ctoken.data.interestRateModel == irm.address)
    
    scenario.h3("Set reserve factor")
    arg = sp.record(cToken = ctoken.address, newReserveFactor = sp.nat(2))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set reserve factor", bLevel, admin, alice, governor.setReserveFactor, arg)
    scenario.verify(ctoken.data.reserveFactorMantissa == arg.newReserveFactor)
    
def testCxtzReserves(scenario, cxtz, bLevel, alice, admin, governor):
    scenario.h3("Add reserves to reduce")
    prevBalance = scenario.compute(cxtz.balance)
    prevTotalReserves = scenario.compute(cxtz.data.totalReserves)
    cxtz.addReserves(sp.nat(5)).run(sender = alice, level = bLevel.current(), amount = sp.mutez(5))
    scenario.verify(cxtz.data.totalReserves > prevTotalReserves)
    scenario.verify(cxtz.balance > prevBalance)

    scenario.h3("Reduce reserves")
    prevBalance = scenario.compute(cxtz.balance)
    prevTotalReserves = scenario.compute(cxtz.data.totalReserves)
    prevGovernorBalance = scenario.compute(governor.balance)
    arg = sp.record(cToken = cxtz.address, amount = sp.nat(1))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "reduce reserves", bLevel, admin, alice, governor.reduceReserves, arg)
    scenario.verify(cxtz.data.totalReserves < prevTotalReserves)
    scenario.verify(cxtz.balance < prevBalance)
    scenario.verify(governor.balance > prevGovernorBalance)

def testCfa12Reserves(scenario, cfa12, fa12Target, bLevel, alice, admin, governor):
    scenario.h3("Add reserves to reduce")
    fa12Target.mint(sp.record(address = alice.address, value = 500))
    scenario += fa12Target.approve(sp.record(spender = cfa12.address, value = 500)).run(sender=alice)
    cfa12.addReserves(sp.nat(500)).run(sender = alice, level = bLevel.current())

    scenario.h3("Reduce reserves")
    prevBalance = scenario.compute(fa12Target.data.balances[cfa12.address].balance)
    prevReserves = scenario.compute(cfa12.data.totalReserves)
    arg = sp.record(cToken = cfa12.address, amount = sp.nat(500))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "reduce reserves", bLevel, admin, alice, governor.reduceReserves, arg)
    scenario.verify(fa12Target.data.balances[cfa12.address].balance < prevBalance)
    scenario.verify(fa12Target.data.balances[governor.address].balance == sp.nat(500))
    scenario.verify(cfa12.data.totalReserves < prevReserves)
    
def testComptroller(scenario, ctoken, bLevel, alice, admin, governor, cmpt, oracle):
    scenario.h2("Comptroller")
    scenario.h3("Set comptroller governance")
    arg = sp.record(contractAddress = cmpt.address, governance = alice.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set contract governance", bLevel, admin, alice, governor.setContractGovernance, arg)
    scenario.verify(cmpt.data.pendingAdministrator.open_some() == alice.address)

    scenario.h3("Accept comptroller governance")
    scenario += cmpt.acceptGovernance(sp.unit).run(sender=alice, level=bLevel.current())
    scenario += cmpt.setPendingGovernance(governor.address).run(sender=alice, level=bLevel.current())
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "accept contract governance", bLevel, admin, alice, governor.acceptContractGovernance, cmpt.address)
    scenario.verify(cmpt.data.administrator == governor.address)

    scenario.h3("Set price oracle")
    arg = sp.record(comptroller = cmpt.address, priceOracle = oracle.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set price oracle", bLevel, admin, alice, governor.setPriceOracle, arg)
    scenario.verify(cmpt.data.oracleAddress == arg.priceOracle)

    scenario.h3("Set close factor")
    arg = sp.record(comptroller = cmpt.address, closeFactor = sp.nat(2))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set close factor", bLevel, admin, alice, governor.setCloseFactor, arg)
    scenario.verify(cmpt.data.closeFactorMantissa == arg.closeFactor)

    scenario.h3("Set liquidation incentive")
    arg = sp.record(comptroller = cmpt.address, liquidationIncentive = sp.nat(2))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set liquidation incentive", bLevel, admin, alice, governor.setLiquidationIncentive, arg)
    scenario.verify(cmpt.data.liquidationIncentiveMantissa == arg.liquidationIncentive)

    scenario.h3("Support market")
    arg = sp.record(comptroller = cmpt.address, market=sp.record(cToken = ctoken.address, name=sp.string("m1"), priceExp=10^18))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "support market", bLevel, admin, alice, governor.supportMarket, arg)
    scenario.verify(cmpt.data.markets.contains(arg.market.cToken) & cmpt.data.markets[arg.market.cToken].isListed)

    scenario.h3("Set market borrow cap")
    arg = sp.record(comptroller = cmpt.address, borrowCap = sp.record(cToken = ctoken.address, newBorrowCap = sp.nat(2)))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set market borrow cap", bLevel, admin, alice, governor.setMarketBorrowCap, arg)
    scenario.verify(cmpt.data.markets[arg.borrowCap.cToken].borrowCap == arg.borrowCap.newBorrowCap)

    scenario.h3("Set collateral factor")
    arg = sp.record(comptroller = cmpt.address, collateralFactor = sp.record(cToken = ctoken.address, newCollateralFactor = sp.nat(2)))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set collateral factor", bLevel, admin, alice, governor.setCollateralFactor, arg)
    scenario.verify(cmpt.data.markets[arg.collateralFactor.cToken].collateralFactor.mantissa == arg.collateralFactor.newCollateralFactor)

    scenario.h3("Set mint paused")
    arg = sp.record(comptroller = cmpt.address, tokenState = sp.record(cToken = ctoken.address, state = sp.bool(False)))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set mint paused", bLevel, admin, alice, governor.setMintPaused, arg)
    scenario.verify(cmpt.data.markets[arg.tokenState.cToken].mintPaused == arg.tokenState.state)

    scenario.h3("Set borrow paused")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set borrow paused", bLevel, admin, alice, governor.setBorrowPaused, arg)
    scenario.verify(cmpt.data.markets[arg.tokenState.cToken].borrowPaused == arg.tokenState.state)

    scenario.h3("Set transfer paused")
    arg = sp.record(comptroller = cmpt.address, state = sp.bool(False))
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set transfer paused", bLevel, admin, alice, governor.setTransferPaused, arg)
    scenario.verify(cmpt.data.transferPaused == arg.state)

    scenario.h3("Disable market")
    arg = sp.record(comptroller = cmpt.address, cToken = ctoken.address)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "disable market", bLevel, admin, alice, governor.disableMarket, arg)
    scenario.verify(cmpt.data.markets.contains(arg.cToken) & ~ cmpt.data.markets[arg.cToken].isListed)

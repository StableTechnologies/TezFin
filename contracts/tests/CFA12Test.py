import smartpy as sp

CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
FA12Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA12Mock.py")
RV = sp.io.import_script_from_url("file:contracts/tests/ResultViewer.py")


@sp.add_test(name = "CFA1_2_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "florence")

    scenario.table_of_contents()
    scenario.h1("CFA1.2 tests")

    # Test accounts
    alice = sp.test_account("Alice")
    admin = sp.test_account("admin")

    scenario.h2("Accounts")
    scenario.show([alice, admin])

    # Contracts
    scenario.h2("Contracts")
    cmpt = CMPT.ComptrollerMock()
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(840000000000), supplyRate_=sp.nat(180000000000))
    fa12 = FA12Mock.FA12Mock()
    view_result = RV.Viewer(sp.TNat)

    exchange_rate = int(1e18)
    c1 = CFA12.CFA12(decimalsUnderlying_=sp.nat(0),
                     comptroller_=cmpt.address, 
                     interestRateModel_=irm.address,
                     initialExchangeRateMantissa_=sp.nat(exchange_rate),
                     administrator_=admin.address,
                     fa1_2_TokenAddress_ = fa12.address)

    scenario += cmpt
    scenario += irm
    scenario += fa12
    scenario += view_result
    scenario += c1
    
    scenario.h2("Check transferIn")
    scenario.h3("Try mint with no cash")
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h3("First mint")
    scenario += fa12.mint(sp.record(address = alice.address, value = 100))
    scenario += fa12.approve(sp.record(spender = c1.address, value = 100)).run(sender=alice)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next())
    scenario.verify(c1.data.balances[alice.address].balance == 100)
    scenario.h3("Second mint")
    scenario += fa12.mint(sp.record(address = admin.address, value = 10))
    scenario += fa12.approve(sp.record(spender = c1.address, value = 10)).run(sender=admin)
    scenario += c1.mint(10).run(sender=admin, level=bLevel.next())
    scenario.verify(c1.data.balances[admin.address].balance == 10)

    scenario.h2("Check getCash")
    scenario.h3("Before accrueInterest")
    scenario += c1.getCash(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(100))

    scenario.h3("After accrueInterest")
    scenario += c1.accrueInterest().run(sender=alice, level=bLevel.next())
    scenario += c1.getCash(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(110))
    
    scenario.h3("getTotalSupply")
    scenario += c1.getTotalSupply(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(110))

    scenario.h2("Check setCash")
    scenario.h3("Try direct call")
    scenario += c1.setCash(10).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h3("Try with callback")
    scenario += fa12.getBalance(sp.pair(alice.address, c1.typed.setCash)).run(sender=admin, level=bLevel.next(), valid=False)

    scenario.h2("Check transferOut")
    scenario += c1.borrow(sp.nat(10)).run(sender=alice, level=bLevel.next())
    scenario.verify(fa12.data.balances[c1.address].balance == 100)
    scenario.verify(fa12.data.balances[alice.address].balance == 10)

    scenario.h2("Check verifySweepFA12")
    scenario.h3("With underlying token")
    scenario += c1.sweepFA12(sp.record(amount = 10, tokenAddress = fa12.address)).run(sender=admin, level=bLevel.next(), valid=False)
    
    scenario.h3("With random token")
    scenario += c1.sweepFA12(sp.record(amount = 10, tokenAddress = sp.address("KT10"))).run(sender=admin, level=bLevel.next())

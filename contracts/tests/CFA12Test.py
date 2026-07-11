import smartpy as sp
import json

CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
FA12Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA12Mock.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")


def verify_cached_cash(scenario, ctoken, underlying):
    """The accounting cache must always equal the token actually held."""
    scenario.verify(ctoken.data.currentCash == underlying.data.balances[ctoken.address].balance)


@sp.add_test(name = "CFA1_2_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

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
    scenario += cmpt
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(80000000000), supplyRate_=sp.nat(180000000000))
    scenario += irm
    fa12 = FA12Mock.FA12Mock()
    scenario += fa12
    view_result = RV.ViewerNat()
    view_result_pair = RV.ViewerNatPair()
    scenario += view_result
    scenario += view_result_pair
    exchange_rate = int(1e18)
    c1 = CFA12.CFA12(comptroller_=cmpt.address, 
                     interestRateModel_=irm.address,
                     initialExchangeRateMantissa_=sp.nat(exchange_rate),
                     administrator_=admin.address,
                     metadata_=sp.big_map({
                         "": sp.utils.bytes_of_string("tezos-storage:data"),
                         "data": sp.utils.bytes_of_string(json.dumps({
                             "name": "...",
                             "description": "...",
                             "version": "1.0.0",
                             "authors": ["ewqenqjw"],
                             "homepage": "https://some-website.com",
                             "interfaces": ["TZIP-007"],
                             "license": {"name": "..."}
                         }))
                     }),
                     token_metadata_={
                         "name": sp.utils.bytes_of_string("Compound XTZ"),
                         "symbol": sp.utils.bytes_of_string("fXTZ"),
                         "decimals": sp.utils.bytes_of_string("6"),
                     },
                     fa1_2_TokenAddress_ = fa12.address)

    scenario += c1
    
    scenario.h2("Check transferIn")
    scenario.h3("Try mint with no cash")
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h3("First mint")
    scenario += fa12.mint(sp.record(address = alice.address, value = 100))
    scenario += fa12.approve(sp.record(spender = c1.address, value = 100)).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == 100)
    verify_cached_cash(scenario, c1, fa12)
    scenario.h3("Second mint")
    scenario += fa12.mint(sp.record(address = admin.address, value = 10))
    scenario += fa12.approve(sp.record(spender = c1.address, value = 10)).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(10).run(sender=admin, level=bLevel.current())
    scenario.verify(c1.data.ledger[admin.address].balance == 10)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h2("Check getCash")
    scenario.h3("Before accrueInterest")
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 110)

    scenario.h3("After accrueInterest")
    scenario += c1.accrueInterest().run(sender=alice, level=bLevel.next())
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 110)
    
    scenario.h3("getTotalSupply")
    scenario += c1.getTotalSupply(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(110))

    scenario.h2("Check setCash")
    scenario.h3("Try direct call")
    scenario += c1.setCash(10).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h3("Try with callback")
    scenario += fa12.getBalance(sp.pair(alice.address, c1.typed.setCash)).run(sender=admin, level=bLevel.next(), valid=False)

    scenario.h2("Check transferOut")
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.borrow(sp.nat(10)).run(sender=alice, level=bLevel.current())
    scenario.verify(fa12.data.balances[c1.address].balance == 100)
    scenario.verify(fa12.data.balances[alice.address].balance == 10)
    scenario.verify(c1.data.currentCash == 100)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h2("Regression: repeated redeems update cash before repricing")
    # The June 18 exploit repeatedly burned the same number of fTokens while
    # currentCash stayed fixed. That made the exchange rate rise after each
    # burn. Each redemption below must instead decrease both cash and supply.
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 90)
    verify_cached_cash(scenario, c1, fa12)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa12)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa12)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa12)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 50)
    scenario.verify(fa12.data.balances[c1.address].balance == 50)
    scenario.verify(fa12.data.balances[alice.address].balance == 60)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h2("All remaining underlying cash paths keep the cache in sync")
    scenario.h3("Redeem underlying")
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.redeemUnderlying(1).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 49)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h3("Repay own borrow")
    scenario += fa12.approve(sp.record(spender=c1.address, value=2)).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.repayBorrow(2).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 8)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h3("Repay borrow on behalf")
    scenario += fa12.mint(sp.record(address=admin.address, value=5))
    scenario += fa12.approve(sp.record(spender=c1.address, value=3)).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, admin, c1)
    scenario += c1.repayBorrowBehalf(sp.record(borrower=alice.address, repayAmount=3)).run(sender=admin, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 5)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h3("Liquidation repayment")
    scenario += fa12.approve(sp.record(spender=c1.address, value=1)).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, admin, c1)
    scenario += c1.liquidateBorrow(sp.record(cTokenCollateral=c1.address, borrower=alice.address, repayAmount=1)).run(sender=admin, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 4)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h3("Add and reduce reserves")
    scenario += fa12.approve(sp.record(spender=c1.address, value=2)).run(sender=alice)
    scenario += c1.addReserves(2).run(sender=alice, level=bLevel.next())
    scenario.verify(c1.data.totalReserves == 2)
    verify_cached_cash(scenario, c1, fa12)
    scenario += c1.reduceReserves(1).run(sender=admin, level=bLevel.next())
    scenario.verify(c1.data.totalReserves == 1)
    verify_cached_cash(scenario, c1, fa12)

    scenario.h2("Failed underlying transfers roll back all CToken state")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += fa12.setTransferFailure(True)
    scenario += c1.mint(10).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.verify(c1.data.currentCash == 56)
    scenario.verify(c1.data.totalSupply == 58)
    scenario.verify(c1.data.ledger[alice.address].balance == 47)
    scenario.verify(fa12.data.balances[alice.address].balance == 57)
    verify_cached_cash(scenario, c1, fa12)
    scenario += fa12.setTransferFailure(False)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += fa12.setTransferFailure(True)
    scenario += c1.borrow(1).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.verify(c1.data.currentCash == 56)
    scenario.verify(c1.data.totalBorrows == 4)
    scenario.verify(c1.data.borrows[alice.address].principal == 4)
    scenario.verify(fa12.data.balances[alice.address].balance == 57)
    verify_cached_cash(scenario, c1, fa12)
    scenario += fa12.setTransferFailure(False)

    scenario.h2("Non-unit exchange rate and rounding boundaries")
    rounded = CFA12.CFA12(comptroller_=cmpt.address,
                           interestRateModel_=irm.address,
                           initialExchangeRateMantissa_=sp.nat(1500000000000000000),
                           administrator_=admin.address,
                           metadata_=sp.big_map(tkey=sp.TString, tvalue=sp.TBytes),
                           token_metadata_={
                               "name": sp.utils.bytes_of_string("Rounded CFA1.2"),
                               "symbol": sp.utils.bytes_of_string("rCFA12"),
                               "decimals": sp.utils.bytes_of_string("0")
                           },
                           fa1_2_TokenAddress_=fa12.address)
    scenario += rounded
    scenario += fa12.approve(sp.record(spender=rounded.address, value=5)).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, rounded)
    scenario += rounded.mint(5).run(sender=alice, level=bLevel.current())
    scenario.verify(rounded.data.ledger[alice.address].balance == 3)  # floor(5 / 1.5)
    verify_cached_cash(scenario, rounded, fa12)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, rounded)
    scenario += rounded.mint(1).run(sender=alice, level=bLevel.current(), valid=False)  # floor(1 / 1.5) == 0
    verify_cached_cash(scenario, rounded, fa12)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, rounded, cmpt, rounded.address, alice.address)
    scenario += rounded.redeem(1).run(sender=alice, level=bLevel.current())  # floor(1 * 1.5) == 1
    scenario.verify(rounded.data.ledger[alice.address].balance == 2)
    verify_cached_cash(scenario, rounded, fa12)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, rounded, cmpt, rounded.address, alice.address)
    scenario += rounded.redeemUnderlying(1).run(sender=alice, level=bLevel.current())  # ceil(1 / 2) == 1
    scenario.verify(rounded.data.ledger[alice.address].balance == 1)
    verify_cached_cash(scenario, rounded, fa12)

    scenario.h2("Check verifySweepFA12")
    scenario.h3("With underlying token")
    scenario += c1.sweepFA12(sp.record(amount = 10, tokenAddress = fa12.address)).run(sender=admin, level=bLevel.next(), valid=False)
    
    scenario.h3("With random token")
    scenario += c1.sweepFA12(sp.record(amount = 10, tokenAddress = sp.address("KT10"))).run(sender=admin, level=bLevel.next())

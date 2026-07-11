import smartpy as sp
import json

CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
FA2Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA2Mock.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")


def verify_cached_cash(scenario, ctoken, underlying, token_id):
    """The cash cache is valid only when it matches the FA2 ledger."""
    scenario.verify(ctoken.data.currentCash == underlying.data.ledger[underlying.ledger_key.make(ctoken.address, token_id)].balance)


@sp.add_test(name = "CFA2_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("CFA2 tests")

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
    tokenId = sp.nat(0)
    fa2 = FA2Mock.FA2(config = FA2Mock.FA2_config(debug_mode = True),
                      metadata = sp.utils.metadata_of_url("https://example.com"),
                      admin = admin.address)
    tok0_md = FA2Mock.FA2.make_metadata(
        name = "The Token Zero",
        decimals = 2,
        symbol= "TK0" )
    scenario += fa2
    view_result = RV.ViewerNat()
    view_result_pair = RV.ViewerNatPair()
    scenario += view_result
    scenario += view_result_pair
    exchange_rate = int(1e18)
    c1 = CFA2.CFA2(comptroller_=cmpt.address, 
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
                       "name": sp.utils.bytes_of_string("CFA2"),
                       "symbol": sp.utils.bytes_of_string("cFA2"),
                       "decimals": sp.utils.bytes_of_string("6"),
                   },
                   fa2_TokenAddress_ = fa2.address,
                   tokenId_ = tokenId)
    scenario += c1

    
    scenario.h2("Check transferIn")
    scenario.h3("Try mint not as operator")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += fa2.mint(address = alice.address,
                         amount = 200,
                         metadata = tok0_md,
                         token_id = tokenId).run(sender = admin)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h3("Mint as operator")
    scenario += fa2.update_operators([
        sp.variant("add_operator", fa2.operator_param.make(
            owner = alice.address,
            operator = c1.address,
            token_id = tokenId))
    ]).run(sender = admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == 100)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario.h3("Second mint")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == 200)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario.h3("Try mint with no cash")
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h2("Check getCash")
    scenario.h3("Before accrueInterest")
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 200)

    scenario.h3("After accrueInterest")
    scenario += c1.accrueInterest().run(sender=alice, level=bLevel.next())
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 200)
    
    scenario.h3("getTotalSupply")
    scenario += c1.getTotalSupply(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(200))

    scenario.h2("Check setCash")
    scenario.h3("Try direct call")
    scenario += c1.setCash(sp.list([sp.record(balance=123, request=sp.record(owner=c1.address, token_id=tokenId))])).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h3("Try with callback")
    balanceParams = sp.record(callback=c1.typed.setCash, requests = sp.list([sp.record(owner=c1.address, token_id=tokenId)]))
    scenario += fa2.balance_of(balanceParams).run(sender=admin, level=bLevel.next(), valid=False)

    scenario.h2("Check transferOut")
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.borrow(sp.nat(10)).run(sender=alice, level=bLevel.current())
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(c1.address, tokenId)].balance == 190)
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(alice.address, tokenId)].balance == 10)
    scenario.verify(c1.data.currentCash == 190)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h2("Regression: repeated redeems update cash before repricing")
    # A token-backed market must not retain the old cash value after sending
    # underlying. Otherwise each equal burn in a group receives more than the
    # preceding one as totalSupply falls.
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 180)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += c1.redeem(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 140)
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(c1.address, tokenId)].balance == 140)
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(alice.address, tokenId)].balance == 60)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h2("All remaining underlying cash paths keep the cache in sync")
    scenario.h3("Redeem underlying")
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.redeemUnderlying(1).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.currentCash == 139)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h3("Repay own borrow")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.repayBorrow(2).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 8)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h3("Repay borrow on behalf")
    scenario += fa2.transfer([fa2.batch_transfer.item(alice.address, [
        sp.record(to_=admin.address, token_id=tokenId, amount=5)
    ])]).run(sender=alice)
    scenario += fa2.update_operators([
        sp.variant("add_operator", fa2.operator_param.make(owner=admin.address, operator=c1.address, token_id=tokenId))
    ]).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, admin, c1)
    scenario += c1.repayBorrowBehalf(sp.record(borrower=alice.address, repayAmount=3)).run(sender=admin, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 5)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h3("Liquidation repayment")
    DataRelevance.updateAccrueInterest(scenario, bLevel, admin, c1)
    scenario += c1.liquidateBorrow(sp.record(cTokenCollateral=c1.address, borrower=alice.address, repayAmount=1)).run(sender=admin, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == 4)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h3("Add and reduce reserves")
    scenario += c1.addReserves(2).run(sender=alice, level=bLevel.next())
    scenario.verify(c1.data.totalReserves == 2)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += c1.reduceReserves(1).run(sender=admin, level=bLevel.next())
    scenario.verify(c1.data.totalReserves == 1)
    verify_cached_cash(scenario, c1, fa2, tokenId)

    scenario.h2("Failed underlying transfers roll back all CToken state")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += fa2.setTransferFailure(True)
    scenario += c1.mint(10).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.verify(c1.data.currentCash == 146)
    scenario.verify(c1.data.totalSupply == 148)
    scenario.verify(c1.data.ledger[alice.address].balance == 147)
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(alice.address, tokenId)].balance == 52)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += fa2.setTransferFailure(False)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += fa2.setTransferFailure(True)
    scenario += c1.borrow(1).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.verify(c1.data.currentCash == 146)
    scenario.verify(c1.data.totalBorrows == 4)
    scenario.verify(c1.data.borrows[alice.address].principal == 4)
    scenario.verify(fa2.data.ledger[fa2.ledger_key.make(alice.address, tokenId)].balance == 52)
    verify_cached_cash(scenario, c1, fa2, tokenId)
    scenario += fa2.setTransferFailure(False)

    scenario.h2("Non-unit exchange rate and rounding boundaries")
    rounded = CFA2.CFA2(comptroller_=cmpt.address,
                         interestRateModel_=irm.address,
                         initialExchangeRateMantissa_=sp.nat(1500000000000000000),
                         administrator_=admin.address,
                         metadata_=sp.big_map(tkey=sp.TString, tvalue=sp.TBytes),
                         token_metadata_={
                             "name": sp.utils.bytes_of_string("Rounded CFA2"),
                             "symbol": sp.utils.bytes_of_string("rCFA2"),
                             "decimals": sp.utils.bytes_of_string("0")
                         },
                         fa2_TokenAddress_=fa2.address,
                         tokenId_=tokenId)
    scenario += rounded
    scenario += fa2.update_operators([
        sp.variant("add_operator", fa2.operator_param.make(owner=alice.address, operator=rounded.address, token_id=tokenId))
    ]).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, rounded)
    scenario += rounded.mint(5).run(sender=alice, level=bLevel.current())
    scenario.verify(rounded.data.ledger[alice.address].balance == 3)  # floor(5 / 1.5)
    verify_cached_cash(scenario, rounded, fa2, tokenId)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, rounded)
    scenario += rounded.mint(1).run(sender=alice, level=bLevel.current(), valid=False)  # floor(1 / 1.5) == 0
    verify_cached_cash(scenario, rounded, fa2, tokenId)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, rounded, cmpt, rounded.address, alice.address)
    scenario += rounded.redeem(1).run(sender=alice, level=bLevel.current())  # floor(1 * 1.5) == 1
    scenario.verify(rounded.data.ledger[alice.address].balance == 2)
    verify_cached_cash(scenario, rounded, fa2, tokenId)
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, rounded, cmpt, rounded.address, alice.address)
    scenario += rounded.redeemUnderlying(1).run(sender=alice, level=bLevel.current())  # ceil(1 / 2) == 1
    scenario.verify(rounded.data.ledger[alice.address].balance == 1)
    verify_cached_cash(scenario, rounded, fa2, tokenId)

    scenario.h2("Check verifySweepFA12")
    scenario.h3("With underlying token and correct id")
    scenario += c1.sweepFA2(sp.record(amount = 10, tokenAddress = fa2.address, id=tokenId)).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h3("With underlying token and wrong id")
    scenario += fa2.mint(address = c1.address,
                         amount = 30,
                         metadata = tok0_md,
                         token_id = 1).run(sender = admin)
    scenario += c1.sweepFA2(sp.record(amount = 10, tokenAddress = fa2.address, id=1)).run(sender=admin, level=bLevel.next())
    scenario.h3("With random token")
    scenario += c1.sweepFA2(sp.record(amount = 10, tokenAddress = sp.address("KT10"), id=tokenId)).run(sender=admin, level=bLevel.next())

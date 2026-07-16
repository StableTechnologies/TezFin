import json
import smartpy as sp

AdjustedIRM = sp.io.import_script_from_url("file:contracts/AdjustedInterestRateModel.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")

MULTIPLIER_PER_BLOCK = 32610000000
BASE_RATE_PER_BLOCK = 0
JUMP_MULTIPLIER_PER_BLOCK = 875200000000
KINK = 700000000000000000
CASH_OFFSET = 20090000000


@sp.add_test(name="AdjustedInterestRateModel_Security_Tests")
def test():
    expScale = sp.nat(int(1e18))
    bLevel = BlockLevel.BlockLevel()

    admin = sp.test_account("Administrator")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("AdjustedInterestRateModel security tests")

    cmpt = CMPT.ComptrollerMock()
    irm = AdjustedIRM.AdjustedInterestRateModel(
        scale_=expScale,
        multiplierPerBlock_=sp.nat(MULTIPLIER_PER_BLOCK),
        baseRatePerBlock_=sp.nat(BASE_RATE_PER_BLOCK),
        kink_=sp.nat(KINK),
        jumpMultiplierPerBlock_=sp.nat(JUMP_MULTIPLIER_PER_BLOCK),
        cashOffset_=sp.nat(CASH_OFFSET),
        administrator_=admin.address)
    view_result_pair = RV.ViewerNatPair()

    scenario += cmpt
    scenario += irm
    scenario += view_result_pair

    cxtz = CXTZ.CXTZ(
        comptroller_=cmpt.address,
        interestRateModel_=irm.address,
        administrator_=admin.address,
        metadata_=sp.big_map({
            "": sp.utils.bytes_of_string("tezos-storage:data"),
            "data": sp.utils.bytes_of_string(json.dumps({
                "name": "TezFin Interest-Bearing XTZ",
                "description": "Security regression market",
                "version": "3.0",
                "authors": ["TezFin"],
                "homepage": "https://tezos.finance",
                "interfaces": ["TZIP-007", "TZIP-016"],
            }))
        }),
        token_metadata_={
            "name": sp.utils.bytes_of_string("fXTZ"),
            "symbol": sp.utils.bytes_of_string("fXTZ"),
            "decimals": sp.utils.bytes_of_string("6"),
        })
    scenario += cxtz

    scenario.h2("Borrow remains capped by real sp.balance, not virtual cash")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, cxtz)
    scenario += cxtz.mint(1000).run(sender=alice, level=bLevel.current(), amount=sp.mutez(1000))
    DataRelevance.updateAllRelevance(scenario, bLevel, bob, cxtz, cmpt, cxtz.address, bob.address)
    scenario += cxtz.borrow(sp.nat(900)).run(sender=bob, level=bLevel.current())
    scenario += cxtz.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), sp.nat(100))
    DataRelevance.updateAllRelevance(scenario, bLevel, bob, cxtz, cmpt, cxtz.address, bob.address)
    scenario += cxtz.borrow(sp.nat(101)).run(sender=bob, level=bLevel.current(), valid=False)

    scenario.h2("Repeated redeems still use live sp.balance (no cached-cash repricing bug)")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, cxtz)
    scenario += cxtz.mint(500).run(sender=alice, level=bLevel.current(), amount=sp.mutez(500))
    scenario += cxtz.redeem(sp.nat(10)).run(sender=alice, level=bLevel.current())
    scenario += cxtz.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    cash_after_first = scenario.compute(sp.fst(view_result_pair.data.last.open_some()))
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, cxtz, cmpt, cxtz.address, alice.address)
    scenario += cxtz.redeem(sp.nat(10)).run(sender=alice, level=bLevel.current())
    scenario += cxtz.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    cash_after_second = scenario.compute(sp.fst(view_result_pair.data.last.open_some()))
    scenario.verify(cash_after_second < cash_after_first)

    scenario.h2("Accrue interest uses adjusted rate but does not inflate cash")
    borrows_before = scenario.compute(cxtz.data.totalBorrows)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, cxtz)
    scenario += cxtz.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    cash_before_accrue = scenario.compute(sp.fst(view_result_pair.data.last.open_some()))
    scenario += cxtz.accrueInterest().run(sender=alice, level=bLevel.next())
    scenario += cxtz.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), cash_before_accrue)
    scenario.verify(cxtz.data.totalBorrows >= borrows_before)

    scenario.h2("Exchange rate ignores IRM cashOffset")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, cxtz)
    scenario += cxtz.exchangeRateStored(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    exchange_before = scenario.compute(sp.fst(view_result_pair.data.last.open_some()))
    scenario += cxtz.setInterestRateModel(irm.address).run(sender=admin, level=bLevel.next())
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, cxtz)
    scenario += cxtz.exchangeRateStored(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(
        sender=alice, level=bLevel.current())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), exchange_before)

    scenario.h2("Extreme cashOffset cannot be set by non-admin")
    scenario += irm.setCashOffset(sp.nat(0)).run(sender=alice, valid=False)

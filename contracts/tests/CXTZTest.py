import smartpy as sp
import json

CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
RV = sp.io.import_script_from_url("file:contracts/tests//utils/ResultViewer.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")


@sp.add_test(name = "CXTZ_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("CXTZ tests")

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
    
    view_result = RV.ViewerNat()
    view_result_pair = RV.ViewerNatPair()
    scenario += view_result
    scenario += view_result_pair

    c1 = CXTZ.CXTZ(comptroller_=cmpt.address,
                   interestRateModel_=irm.address,
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
                   })
    scenario += c1

    scenario.h2("mint + transferIn")
    scenario.h3("first mint")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(777).run(sender=alice, level=bLevel.current(), amount=sp.mutez(777))
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(777))
    scenario.h3("second mint")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(20).run(sender=admin, level=bLevel.current(), amount=sp.mutez(20))
    scenario.verify(c1.data.ledger[admin.address].balance == sp.nat(20))

    scenario.h2("getCash")
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 797)
    
    scenario.h2("getTotalSupply")
    scenario += c1.getTotalSupply(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(797))

    scenario.h2("call transferOut inside borrow entry point ")
    DataRelevance.updateAllRelevance(scenario, bLevel, alice, c1, cmpt, c1.address, alice.address)
    scenario += c1.borrow(sp.nat(777)).run(sender=alice, level=bLevel.current())

    scenario.h2("getCash after transferOut call")
    scenario += c1.getCash(sp.pair(sp.unit, view_result_pair.typed.targetNatPair)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(sp.fst(view_result_pair.data.last.open_some()), 20)
    
    scenario.h2("Try sweepMutez")
    scenario += c1.sweepMutez(sp.bool(False)).run(sender=admin, level=bLevel.next(), valid=False)

import smartpy as sp
import json

CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
FA2Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA2Mock.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")


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
    scenario += view_result
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
    scenario.h3("Second mint")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == 200)
    scenario.h3("Try mint with no cash")
    scenario += c1.mint(100).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h2("Check getCash")
    scenario.h3("Before accrueInterest")
    scenario += c1.getCash(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(100))

    scenario.h3("After accrueInterest")
    scenario += c1.accrueInterest().run(sender=alice, level=bLevel.next())
    scenario += c1.getCash(sp.pair(sp.unit, view_result.typed.targetNat)).run(sender=alice, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(200))
    
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

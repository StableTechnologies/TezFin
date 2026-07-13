import smartpy as sp
import json

Guard = sp.io.import_script_from_url("file:contracts/GuardComptroller.py")
CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
CMPT = sp.io.import_script_from_url(
    "file:contracts/tests/mock/ComptrollerMock.py")
IRM = sp.io.import_script_from_url(
    "file:contracts/tests/mock/InterestRateModelMock.py")
FA12Mock = sp.io.import_script_from_url(
    "file:contracts/tests/mock/FA12Mock.py")
FA2Mock = sp.io.import_script_from_url(
    "file:contracts/tests/mock/FA2Mock.py")
BlockLevel = sp.io.import_script_from_url(
    "file:contracts/tests/utils/BlockLevel.py")
DataRelevance = sp.io.import_script_from_url(
    "file:contracts/tests/utils/DataRelevance.py")


def _meta(name, symbol):
    return sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": name,
            "description": "guard integration",
            "version": "1.0.0",
            "authors": ["tezfin"],
            "homepage": "https://example.com",
            "interfaces": ["TZIP-007"],
            "license": {"name": "test"}
        }))
    }), {
        "name": sp.utils.bytes_of_string(name),
        "symbol": sp.utils.bytes_of_string(symbol),
        "decimals": sp.utils.bytes_of_string("6"),
    }


def _switch_to_guard(scenario, bLevel, admin, permissive, fToken):
    guard = Guard.GuardComptroller(
        administrator_=admin.address,
        markets_=[fToken.address],
        approvedRollbackComptroller_=permissive.address,
    )
    scenario += guard
    scenario += fToken.setComptroller(guard.address).run(
        sender=admin, level=bLevel.next())
    scenario.verify(fToken.data.comptroller == guard.address)
    return guard


def _assert_guard_blocks_mint_borrow(scenario, bLevel, alice, fToken, mint_kw=None):
    mint_kw = mint_kw or {}
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, fToken)
    scenario += fToken.mint(1).run(
        sender=alice, level=bLevel.current(), valid=False, **mint_kw)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, fToken)
    scenario += fToken.borrow(1).run(
        sender=alice, level=bLevel.current(), valid=False)


def _assert_debt_blocks_redeem(scenario, bLevel, alice, fToken, redeem_tokens):
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, fToken)
    scenario += fToken.redeem(redeem_tokens).run(
        sender=alice, level=bLevel.current(), valid=False)


def _assert_post_repay_redeems(scenario, bLevel, alice, fToken, redeem_tokens, redeem_underlying):
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, fToken)
    scenario += fToken.redeem(redeem_tokens).run(
        sender=alice, level=bLevel.current())
    scenario += fToken.redeem(redeem_tokens).run(
        sender=alice, level=bLevel.current(), valid=False)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, fToken)
    scenario += fToken.redeemUnderlying(redeem_underlying).run(
        sender=alice, level=bLevel.current())


@sp.add_test(name="Guard_CFA12_Integration")
def test_cfa12():
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")
    scenario.h1("Guard × CFA12")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    exchange_rate = int(1e18)
    mint_amount = 1000
    borrow_amount = 100
    redeem_tokens = 50

    permissive = CMPT.ComptrollerMock()
    scenario += permissive
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm
    fa12 = FA12Mock.FA12Mock()
    scenario += fa12

    meta, token_meta = _meta("CFA12 Guard", "fFA12")
    c1 = CFA12.CFA12(
        comptroller_=permissive.address,
        interestRateModel_=irm.address,
        initialExchangeRateMantissa_=sp.nat(exchange_rate),
        administrator_=admin.address,
        metadata_=meta,
        token_metadata_=token_meta,
        fa1_2_TokenAddress_=fa12.address,
    )
    scenario += c1

    scenario.h2("Seed liquidity and borrow under permissive Comptroller")
    scenario += fa12.mint(sp.record(address=alice.address, value=mint_amount))
    scenario += fa12.approve(sp.record(
        spender=c1.address, value=mint_amount)).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(mint_amount).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(mint_amount))

    DataRelevance.updateAllRelevance(
        scenario, bLevel, alice, c1, permissive, c1.address, alice.address)
    scenario += c1.borrow(borrow_amount).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(borrow_amount))

    scenario.h2("Switch to Guard")
    _switch_to_guard(scenario, bLevel, admin, permissive, c1)

    scenario.h2("Mint / borrow blocked; redeem blocked while debt remains")
    _assert_guard_blocks_mint_borrow(scenario, bLevel, alice, c1)
    _assert_debt_blocks_redeem(scenario, bLevel, alice, c1, redeem_tokens)

    scenario.h2("Repay-to-zero through CFA12 calls Guard.removeFromLoans")
    scenario += fa12.approve(sp.record(
        spender=c1.address, value=borrow_amount)).run(sender=alice)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.repayBorrow(borrow_amount).run(
        sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(0))

    scenario.h2("Redeem / redeemUnderlying after debt cleared")
    _assert_post_repay_redeems(
        scenario, bLevel, alice, c1, redeem_tokens, redeem_underlying=10)


@sp.add_test(name="Guard_CFA2_Integration")
def test_cfa2():
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")
    scenario.h1("Guard × CFA2")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    exchange_rate = int(1e18)
    token_id = sp.nat(0)
    mint_amount = 1000
    borrow_amount = 100
    redeem_tokens = 50

    permissive = CMPT.ComptrollerMock()
    scenario += permissive
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm
    fa2 = FA2Mock.FA2(
        config=FA2Mock.FA2_config(debug_mode=True),
        metadata=sp.utils.metadata_of_url("https://example.com"),
        admin=admin.address,
    )
    tok_md = FA2Mock.FA2.make_metadata(
        name="Underlying", decimals=6, symbol="UND")
    scenario += fa2

    meta, token_meta = _meta("CFA2 Guard", "fFA2")
    c1 = CFA2.CFA2(
        comptroller_=permissive.address,
        interestRateModel_=irm.address,
        initialExchangeRateMantissa_=sp.nat(exchange_rate),
        administrator_=admin.address,
        metadata_=meta,
        token_metadata_=token_meta,
        fa2_TokenAddress_=fa2.address,
        tokenId_=token_id,
    )
    scenario += c1

    scenario.h2("Seed liquidity and borrow under permissive Comptroller")
    scenario += fa2.mint(
        address=alice.address, amount=mint_amount, metadata=tok_md, token_id=token_id
    ).run(sender=admin)
    scenario += fa2.update_operators([
        sp.variant("add_operator", fa2.operator_param.make(
            owner=alice.address, operator=c1.address, token_id=token_id))
    ]).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(mint_amount).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(mint_amount))

    DataRelevance.updateAllRelevance(
        scenario, bLevel, alice, c1, permissive, c1.address, alice.address)
    scenario += c1.borrow(borrow_amount).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(borrow_amount))

    scenario.h2("Switch to Guard")
    _switch_to_guard(scenario, bLevel, admin, permissive, c1)

    scenario.h2("Mint / borrow blocked; redeem blocked while debt remains")
    _assert_guard_blocks_mint_borrow(scenario, bLevel, alice, c1)
    _assert_debt_blocks_redeem(scenario, bLevel, alice, c1, redeem_tokens)

    scenario.h2("Repay-to-zero through CFA2 calls Guard.removeFromLoans")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.repayBorrow(borrow_amount).run(
        sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(0))

    scenario.h2("Redeem / redeemUnderlying after debt cleared")
    _assert_post_repay_redeems(
        scenario, bLevel, alice, c1, redeem_tokens, redeem_underlying=10)


@sp.add_test(name="Guard_CXTZ_Integration")
def test_cxtz():
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")
    scenario.h1("Guard × CXTZ")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    mint_amount = 1000
    borrow_amount = 100
    redeem_tokens = 50

    permissive = CMPT.ComptrollerMock()
    scenario += permissive
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm

    meta, token_meta = _meta("CXTZ Guard", "fXTZ")
    c1 = CXTZ.CXTZ(
        comptroller_=permissive.address,
        interestRateModel_=irm.address,
        administrator_=admin.address,
        metadata_=meta,
        token_metadata_=token_meta,
    )
    scenario += c1

    scenario.h2("Seed liquidity and borrow under permissive Comptroller")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(mint_amount).run(
        sender=alice, level=bLevel.current(), amount=sp.mutez(mint_amount))
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(mint_amount))

    DataRelevance.updateAllRelevance(
        scenario, bLevel, alice, c1, permissive, c1.address, alice.address)
    scenario += c1.borrow(borrow_amount).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(borrow_amount))

    scenario.h2("Switch to Guard")
    _switch_to_guard(scenario, bLevel, admin, permissive, c1)

    scenario.h2("Mint / borrow blocked; redeem blocked while debt remains")
    _assert_guard_blocks_mint_borrow(
        scenario, bLevel, alice, c1, mint_kw={"amount": sp.mutez(1)})
    _assert_debt_blocks_redeem(scenario, bLevel, alice, c1, redeem_tokens)

    scenario.h2("Repay-to-zero through CXTZ calls Guard.removeFromLoans")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.repayBorrow(borrow_amount).run(
        sender=alice, level=bLevel.current(), amount=sp.mutez(borrow_amount))
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(0))

    scenario.h2("Redeem / redeemUnderlying after debt cleared")
    _assert_post_repay_redeems(
        scenario, bLevel, alice, c1, redeem_tokens, redeem_underlying=10)

import smartpy as sp
import json

Guard = sp.io.import_script_from_url("file:contracts/GuardComptroller.py")
CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
BlockLevel = sp.io.import_script_from_url(
    "file:contracts/tests/utils/BlockLevel.py")
CTMock = sp.io.import_script_from_url(
    "file:contracts/tests/mock/CTokenMock.py")
CMPT = sp.io.import_script_from_url(
    "file:contracts/tests/mock/ComptrollerMock.py")
IRM = sp.io.import_script_from_url(
    "file:contracts/tests/mock/InterestRateModelMock.py")
DataRelevance = sp.io.import_script_from_url(
    "file:contracts/tests/utils/DataRelevance.py")


def redeemParams(cToken, redeemer, amount=sp.nat(1)):
    # 4f6121a ABI: redeemAmount (not redeemTokens / exchangeRateMantissa).
    return sp.record(
        cToken=cToken,
        redeemer=redeemer,
        redeemAmount=amount,
    )


class TestCToken(CToken.CToken):
    def __init__(self, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, metadata_, token_metadata_):
        CToken.CToken.__init__(
            self, comptroller_, interestRateModel_, initialExchangeRateMantissa_,
            administrator_, metadata_, token_metadata_)

    def getCashImpl(self):
        return self.data.totalSupply // sp.nat(int(1e6))

    def doTransferIn(self, from_, amount):
        return amount

    def doTransferOut(self, to_, amount, isContract=False):
        pass


def _token_meta():
    return sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "test",
            "description": "test",
            "version": "1.0.0",
            "authors": ["tezfin"],
            "homepage": "https://example.com",
            "interfaces": ["TZIP-007"],
            "license": {"name": "test"}
        }))
    }), {
        "name": sp.utils.bytes_of_string("Compound token"),
        "symbol": sp.utils.bytes_of_string("cToken"),
        "decimals": sp.utils.bytes_of_string("6"),
    }


@sp.add_test(name="GuardComptroller_Tests")
def test():
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.h1("Lean Guard Comptroller tests")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    bob = sp.test_account("bob")
    attacker = sp.test_account("attacker")
    oldComptroller = sp.test_account("oldComptroller")

    exchRate = sp.nat(int(1e18))
    marketA = CTMock.CTokenMock(test_account_snapshot_=sp.record(
        account=alice.address,
        cTokenBalance=sp.nat(10),
        borrowBalance=sp.nat(0),
        exchangeRateMantissa=exchRate,
    ))
    marketB = CTMock.CTokenMock(test_account_snapshot_=sp.record(
        account=alice.address,
        cTokenBalance=sp.nat(0),
        borrowBalance=sp.nat(0),
        exchangeRateMantissa=exchRate,
    ))
    scenario += marketA
    scenario += marketB

    cmpt = Guard.GuardComptroller(
        administrator_=admin.address,
        markets_=[marketA.address, marketB.address],
        approvedRollbackComptroller_=oldComptroller.address,
    )
    scenario += cmpt

    listed = marketA.address
    collateral = marketB.address
    unlisted = sp.address("KT1UnlistedMarket1111111111111111111")

    scenario.h2("Repay is allowed on a listed market")
    scenario += cmpt.repayBorrowAllowed(sp.record(
        cToken=listed,
        payer=alice.address,
        borrower=alice.address,
        repayAmount=sp.nat(1),
    )).run(sender=listed, level=bLevel.next())

    scenario.h2("Repay rejects an unlisted market")
    scenario += cmpt.repayBorrowAllowed(sp.record(
        cToken=unlisted,
        payer=alice.address,
        borrower=alice.address,
        repayAmount=sp.nat(1),
    )).run(sender=alice.address, level=bLevel.next(), valid=False)

    scenario.h2("Mint / borrow / transfer / liquidation are disabled")
    level = bLevel.next()
    scenario += cmpt.mintAllowed(sp.record(
        cToken=listed, minter=alice.address, mintAmount=sp.nat(1)
    )).run(sender=listed, level=level, valid=False)
    scenario += cmpt.borrowAllowed(sp.record(
        cToken=listed, borrower=alice.address, borrowAmount=sp.nat(1)
    )).run(sender=listed, level=level, valid=False)
    scenario += cmpt.transferAllowed(sp.record(
        cToken=listed,
        src=alice.address,
        dst=bob.address,
        transferTokens=sp.nat(1),
    )).run(sender=listed, level=level, valid=False)
    scenario += cmpt.liquidateBorrowAllowed(sp.record(
        cTokenBorrowed=listed,
        cTokenCollateral=collateral,
        borrower=alice.address,
        liquidator=bob.address,
        repayAmount=sp.nat(1),
    )).run(sender=listed, level=level, valid=False)

    scenario.h2("Enter / exit market are disabled")
    scenario += cmpt.enterMarkets([listed]).run(
        sender=alice.address, level=level, valid=False)
    scenario += cmpt.exitMarket(listed).run(
        sender=alice.address, level=level, valid=False)

    scenario.h2("removeFromLoans is a no-op for listed market callers")
    scenario += cmpt.removeFromLoans(alice.address).run(
        sender=listed, level=bLevel.next())

    scenario.h2("Redeem fails when accrual is stale")
    staleLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(0).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=staleLevel, valid=False)

    scenario.h2("First fresh redeem succeeds for a debt-free account")
    freshLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(freshLevel).run(sender=admin)
    scenario += marketA.setBorrowBalance(0).run(sender=admin)
    scenario += marketB.setBorrowBalance(0).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=freshLevel)

    scenario.h2("Second same-market redeem in the same block fails")
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=freshLevel, valid=False)

    scenario.h2("Next-block redeem succeeds after fresh accrual")
    nextLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(nextLevel).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=nextLevel)

    scenario.h2("Borrower redeem is blocked until debt is zero across markets")
    debtLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(debtLevel).run(sender=admin)
    scenario += marketB.setBorrowBalance(5).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=debtLevel, valid=False)

    scenario += marketB.setBorrowBalance(0).run(sender=admin)
    debtClearLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(debtClearLevel).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=debtClearLevel)

    scenario.h2("Unauthenticated caller cannot consume the redeem slot")
    dosLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(dosLevel).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=attacker.address, level=dosLevel, valid=False)
    # Legitimate cToken caller still gets the slot in the same block.
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=dosLevel)

    scenario.h2("Disabled-market debt still blocks redeem elsewhere")
    scenario += marketB.setBorrowBalance(7).run(sender=admin)
    scenario += cmpt.disableMarket(collateral).run(
        sender=admin.address, level=bLevel.next())
    scenario.verify(cmpt.data.markets[collateral].isListed == False)
    disabledDebtLevel = bLevel.next()
    scenario += marketA.setAccrualBlockNumber(disabledDebtLevel).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=disabledDebtLevel, valid=False)

    scenario.h2("Repay and removeFromLoans remain allowed on disabled markets")
    scenario += cmpt.repayBorrowAllowed(sp.record(
        cToken=collateral,
        payer=alice.address,
        borrower=alice.address,
        repayAmount=sp.nat(7),
    )).run(sender=collateral, level=bLevel.next())
    scenario += cmpt.removeFromLoans(alice.address).run(
        sender=collateral, level=bLevel.next())
    scenario += marketB.setBorrowBalance(0).run(sender=admin)

    scenario.h2("Governance can pause market redeem")
    pausedLevel = bLevel.next()
    scenario += cmpt.setMarketRedeemPaused(sp.record(
        cToken=listed, state=True
    )).run(sender=admin.address, level=pausedLevel)
    scenario += marketA.setAccrualBlockNumber(pausedLevel).run(sender=admin)
    scenario += cmpt.redeemAllowed(
        redeemParams(listed, alice.address)
    ).run(sender=listed, level=pausedLevel, valid=False)
    scenario += cmpt.setMarketRedeemPaused(sp.record(
        cToken=listed, state=False
    )).run(sender=admin.address, level=pausedLevel)

    scenario.h2("seizeAllowed is false in incident mode")
    scenario.verify(
        sp.view(
            "seizeAllowed",
            cmpt.address,
            sp.record(cTokenCollateral=collateral, cTokenBorrowed=listed),
            t=sp.TBool,
        ).open_some() == False
    )

    scenario.h2("Rollback helper only accepts the approved Comptroller")
    # Live Governance/fTokens are not redeployed; ops must batch this helper
    # with setComptroller to enforce the whitelist.
    scenario += cmpt.verifyRollbackComptroller(oldComptroller.address).run(
        sender=admin.address, level=bLevel.next())
    scenario += cmpt.verifyRollbackComptroller(alice.address).run(
        sender=admin.address, level=bLevel.next(), valid=False)

    scenario.h2("supportMarket lists a market with redeem enabled")
    extra = sp.address("KT1ExtraMarket111111111111111111111")
    scenario += cmpt.supportMarket(sp.record(
        cToken=extra, name="extra", priceExp=sp.nat(int(1e18))
    )).run(sender=admin.address, level=bLevel.next())
    scenario.verify(cmpt.data.markets[extra].isListed)
    scenario.verify(cmpt.data.markets[extra].redeemPaused == False)

    scenario.h2("Repay remains allowed after supportMarket")
    scenario += cmpt.repayBorrowAllowed(sp.record(
        cToken=extra,
        payer=bob.address,
        borrower=alice.address,
        repayAmount=sp.nat(10),
    )).run(sender=extra, level=bLevel.next())

    scenario.h2("Underwater repay is still allowed")
    scenario += marketA.setBorrowBalance(10 ** 18).run(sender=admin)
    scenario += cmpt.repayBorrowAllowed(sp.record(
        cToken=listed,
        payer=bob.address,
        borrower=alice.address,
        repayAmount=sp.nat(1),
    )).run(sender=listed, level=bLevel.next())
    scenario += marketA.setBorrowBalance(0).run(sender=admin)


@sp.add_test(name="GuardComptroller_CToken_Integration")
def test_ctoken_integration():
    """Exercise real CToken redeem/mint gates against Guard (not mock entrypoints)."""
    bLevel = BlockLevel.BlockLevel()
    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.h1("Guard + CToken integration")

    admin = sp.test_account("admin")
    alice = sp.test_account("alice")
    exchange_rate = int(1e12)
    ctoken_decimals = int(1e6)

    permissive = CMPT.ComptrollerMock()
    scenario += permissive
    irm = IRM.InterestRateModelMock(
        borrowRate_=sp.nat(0), supplyRate_=sp.nat(0))
    scenario += irm

    meta, token_meta = _token_meta()
    c1 = TestCToken(
        comptroller_=permissive.address,
        interestRateModel_=irm.address,
        initialExchangeRateMantissa_=sp.nat(exchange_rate),
        administrator_=admin.address,
        metadata_=meta,
        token_metadata_=token_meta,
    )
    scenario += c1

    debtMarket = CTMock.CTokenMock(
        test_account_snapshot_=sp.record(
            account=alice.address,
            cTokenBalance=sp.nat(0),
            borrowBalance=sp.nat(0),
            exchangeRateMantissa=sp.nat(int(1e18)),
        ),
        borrowBalance_=0,
    )
    scenario += debtMarket

    guard = Guard.GuardComptroller(
        administrator_=admin.address,
        markets_=[c1.address, debtMarket.address],
        approvedRollbackComptroller_=permissive.address,
    )
    scenario += guard

    scenario.h2("Mint under permissive comptroller, then switch to Guard")
    DataRelevance.validateAccrueInterestRelevance(
        scenario, "mint", bLevel, alice, c1, c1.mint, 100)
    scenario.verify(
        c1.data.ledger[alice.address].balance == sp.nat(100 * ctoken_decimals))

    scenario += c1.setComptroller(guard.address).run(
        sender=admin, level=bLevel.next())
    scenario.verify(c1.data.comptroller == guard.address)

    scenario.h2("Mint is blocked by Guard on the real CToken path")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(10).run(
        sender=alice, level=bLevel.current(), valid=False)

    scenario.h2("Borrow is blocked by Guard on the real CToken path")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.borrow(1).run(
        sender=alice, level=bLevel.current(), valid=False)

    scenario.h2("Fresh accrueInterest then redeem succeeds via Guard")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    redeem_amount = 10 * ctoken_decimals
    scenario += c1.redeem(redeem_amount).run(
        sender=alice, level=bLevel.current())
    scenario.verify(
        c1.data.ledger[alice.address].balance == sp.nat(90 * ctoken_decimals))

    scenario.h2("Second same-block redeem fails through CToken")
    scenario += c1.redeem(redeem_amount).run(
        sender=alice, level=bLevel.current(), valid=False)

    scenario.h2("redeemUnderlying works after next-block accrueInterest")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.redeemUnderlying(10).run(
        sender=alice, level=bLevel.current())

    scenario.h2("Debt in another market blocks CToken redeem")
    scenario += debtMarket.setBorrowBalance(5).run(sender=admin)
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.redeem(redeem_amount).run(
        sender=alice, level=bLevel.current(), valid=False)

    scenario.h2("Ops-style rollback: verify helper then setComptroller")
    scenario += guard.verifyRollbackComptroller(alice.address).run(
        sender=admin, level=bLevel.next(), valid=False)
    scenario += guard.verifyRollbackComptroller(permissive.address).run(
        sender=admin, level=bLevel.next())
    scenario += c1.setComptroller(permissive.address).run(
        sender=admin, level=bLevel.next())
    scenario.verify(c1.data.comptroller == permissive.address)

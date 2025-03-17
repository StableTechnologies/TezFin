import smartpy as sp
import json

CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
IRM = sp.io.import_script_from_url("file:contracts/tests/mock/InterestRateModelMock.py")
CMPT = sp.io.import_script_from_url("file:contracts/tests/mock/ComptrollerMock.py")
BlockLevel = sp.io.import_script_from_url("file:contracts/tests/utils/BlockLevel.py")
RV = sp.io.import_script_from_url("file:contracts/tests//utils/ResultViewer.py")
TestAdminFunctionality = sp.io.import_script_from_url("file:contracts/tests/utils/TestAdminFunctionality.py")
DataRelevance = sp.io.import_script_from_url("file:contracts/tests/utils/DataRelevance.py")


class TestCToken(CToken.CToken):
    def __init__(self, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, metadata_, token_metadata_, **extra_storage):
        CToken.CToken.__init__(self, comptroller_, interestRateModel_, initialExchangeRateMantissa_, administrator_, metadata_, token_metadata_,
                               accCTokenBalance=sp.nat(0), accBorrowBalance=sp.nat(0), accExchangeRateMantissa=sp.nat(0))

    def getCashImpl(self):
        return self.data.totalSupply // sp.nat(int(1e6))

    def doTransferIn(self, from_, amount):
        return amount 
        
    @sp.entry_point
    def updateAccountSnapshot(self, account):
        sp.transfer(sp.pair(account, sp.self_entry_point("setAccountSnapshot")), sp.mutez(0), sp.self_entry_point("getAccountSnapshot"))

    @sp.entry_point
    def setAccountSnapshot(self, params):
        sp.set_type(params, CToken.CTI.TAccountSnapshot)
        self.data.accCTokenBalance = params.cTokenBalance
        self.data.accBorrowBalance = params.borrowBalance
        self.data.accExchangeRateMantissa = params.exchangeRateMantissa

    @sp.entry_point
    def setActiveOp(self, params):
        sp.set_type(params, sp.TNat)
        self.activateOp(params)


@sp.add_test(name = "CToken_Tests")
def test():
    exchange_rate = int(1e12)
    ctoken_decimals = int(1e6)
    bLevel = BlockLevel.BlockLevel()
    collateralToken = sp.address("KT10")

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("CToken tests")

    # Test accounts
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    carl = sp.test_account("Carl")
    admin = sp.test_account("admin")

    scenario.h2("Accounts")
    scenario.show([alice, bob, admin])

    # Contracts
    scenario.h2("Contracts")
    view_result = RV.ViewerNat()
    cmpt = CMPT.ComptrollerMock()
    scenario += view_result
    scenario += cmpt
    irm = IRM.InterestRateModelMock(borrowRate_=sp.nat(80000000000), supplyRate_=sp.nat(180000000000))
    scenario += irm
    c1 = TestCToken(comptroller_=cmpt.address,
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
                        "name": sp.utils.bytes_of_string("Compound token"),
                        "symbol": sp.utils.bytes_of_string("cToken"),
                        "decimals": sp.utils.bytes_of_string("x"),
                    })

    scenario += c1

    scenario.h2("Try borrow when there is no cash")
    scenario += c1.borrow(100).run(sender=alice, level=bLevel.current(), valid=False)

    scenario.h2("Test getAccountSnapshot for nonexistent account")
    scenario += c1.updateAccountSnapshot(bob.address).run(sender = bob, level = bLevel.next())
    scenario.verify(c1.data.accCTokenBalance == sp.nat(0))
    scenario.verify(c1.data.accBorrowBalance == sp.nat(0))
    scenario.verify(c1.data.accExchangeRateMantissa == sp.nat(0))    

    scenario.h2("Test mint")
    scenario.h3("Mint allowed")
    DataRelevance.validateAccrueInterestRelevance(scenario, "mint", bLevel, alice, c1, c1.mint, 100)
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(100 * ctoken_decimals))
    scenario.h3("Mint not allowed")
    scenario += cmpt.setMintAllowed(sp.bool(False))
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.h3("Mint allowed again")
    scenario += cmpt.setMintAllowed(sp.bool(True))
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(1000).run(sender=bob, level=bLevel.current())
    scenario.verify(c1.data.ledger[bob.address].balance == sp.nat(1000 * ctoken_decimals))
    scenario.h3("Try mint in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.mint)).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h2("Test Borrow")
    scenario.h3("Borrow allowed")
    DataRelevance.validateAllRelevance(scenario, "borrow", bLevel, carl, c1, c1.borrow, 10, cmpt, c1.address, carl.address)
    scenario.verify(c1.data.ledger[carl.address].balance == sp.nat(0))
    scenario.verify(c1.data.borrows[carl.address].principal == sp.nat(10))
    scenario.h3("Borrow not allowed")
    scenario += cmpt.setBorrowAllowed(sp.bool(False))
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.borrow(10).run(sender=carl, level=bLevel.next(), valid=False)
    scenario.h3("Borrow allowed again")
    DataRelevance.updateAllRelevance(scenario, bLevel, carl, c1, cmpt, c1.address, carl.address)
    scenario += cmpt.setBorrowAllowed(sp.bool(True))
    scenario += c1.borrow(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(100 * ctoken_decimals))
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(10))
    scenario.h3("Try borrow with insufficient cash")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.borrow(1100 * ctoken_decimals + 1).run(sender=carl, level=bLevel.current(), valid=False)
    scenario.h3("Try borrow in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.borrow)).run(sender=alice, level=bLevel.current(), valid=False)
    
    scenario.h2("Test Redeem")
    scenario.h3("Redeem allowed")
    DataRelevance.validateAllRelevance(scenario, "redeem", bLevel, alice, c1, c1.redeem, 50 * ctoken_decimals, cmpt, c1.address, alice.address)
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(50 * ctoken_decimals))
    scenario.h3("Redeem not allowed")
    scenario += cmpt.setRedeemAllowed(sp.bool(False))
    DataRelevance.updateAllRelevance(scenario, bLevel, carl, c1, cmpt, c1.address, carl.address)
    scenario += c1.redeem(10 * ctoken_decimals).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.h3("Redeem allowed again")
    DataRelevance.updateAllRelevance(scenario, bLevel, carl, c1, cmpt, c1.address, carl.address)
    scenario += cmpt.setRedeemAllowed(sp.bool(True))
    scenario += c1.redeem(10 * ctoken_decimals).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(40 * ctoken_decimals))
    scenario.h3("Try redeem with insufficient balance")
    DataRelevance.updateAllRelevance(scenario, bLevel, carl, c1, cmpt, c1.address, carl.address)
    scenario += c1.redeem(50 * ctoken_decimals).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.h3("Redeem underlying")
    DataRelevance.updateAllRelevance(scenario, bLevel, carl, c1, cmpt, c1.address, carl.address)
    scenario += c1.redeemUnderlying(10).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.ledger[alice.address].balance == sp.nat(30188680)) # due to exchange rate changes: 10 underlying < 10 000 000 CToken
    scenario.h3("Try redeem in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.redeem)).run(sender=alice, level=bLevel.next(), valid=False)
    scenario.h3("Try redeem underlying in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.redeemUnderlying)).run(sender=alice, level=bLevel.next(), valid=False)
    
    scenario.h2("Test Repay borrow")
    scenario.h3("Repay borrow allowed")
    DataRelevance.validateAccrueInterestRelevance(scenario, "repayBorrow", bLevel, alice, c1, c1.repayBorrow, 1)
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(9))
    scenario.h3("Repay borrow not allowed")
    scenario += cmpt.setRepayBorrowAllowed(sp.bool(False))
    DataRelevance.updateAccrueInterest(scenario, bLevel, carl, c1)
    scenario += c1.repayBorrow(1).run(sender=alice, level=bLevel.current(), valid=False)
    scenario.h3("Repay borrow allowed again")
    DataRelevance.updateAccrueInterest(scenario, bLevel, carl, c1)
    scenario += cmpt.setRepayBorrowAllowed(sp.bool(True))
    scenario += c1.repayBorrow(1).run(sender=alice, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(8))
    scenario.h3("Repay borrow behalf")
    DataRelevance.updateAccrueInterest(scenario, bLevel, carl, c1)
    scenario += c1.repayBorrowBehalf(sp.record(borrower=alice.address, repayAmount=sp.nat(1))).run(sender=bob, level=bLevel.current())
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(7))
    scenario.h3("Repay more than borrowed")
    DataRelevance.updateAccrueInterest(scenario, bLevel, carl, c1)
    scenario += c1.repayBorrow(1007).run(sender=alice, level=bLevel.current())
    scenario.show(c1.data.borrows[alice.address].principal)
    scenario.verify(c1.data.borrows[alice.address].principal == sp.nat(0))
    scenario.h3("Try repayBorrow in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.redeem)).run(sender=alice, level=bLevel.current(), valid=False)
    

    scenario.h2("Test transfer")
    scenario.h3("No tokens to transfer")
    scenario += c1.transfer(from_=carl.address, to_=alice.address, value=100).run(sender=carl, level=bLevel.next(), valid=False)
    scenario.h3("No approved tokens to transfer")
    scenario += c1.transfer(from_=alice.address, to_=carl.address, value=100).run(sender=carl, level=bLevel.next(), valid=False)
    scenario.h3("Transfer successfully")
    scenario += c1.transfer(from_=alice.address, to_=carl.address, value=100).run(sender=alice, level=bLevel.next())
    scenario += c1.getBalance(sp.pair(carl.address, view_result.typed.targetNat)).run(sender=carl, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(100))
    scenario.h3("Approve and transfer successfully")
    scenario += c1.approve(spender=alice.address, value=100).run(sender=carl, level=bLevel.next())
    scenario += c1.getAllowance(sp.pair(sp.record(owner=carl.address, spender=alice.address), view_result.typed.targetNat)).run(sender=carl, level=bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(100))
    scenario += c1.transfer(from_=carl.address, to_=alice.address, value=100).run(sender=alice, level=bLevel.next())
    scenario.verify(c1.data.ledger[carl.address].balance == sp.nat(0))

    scenario.h2("Admin functions")   
    scenario.h3("Pending governance")  
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set pending governance", bLevel, admin, alice, c1.setPendingGovernance, bob.address)

    scenario.h3("Accept governance")
    scenario.h4("Not pending admin attempts to accept governance")
    scenario += c1.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.next(), valid=False)
    scenario.h4("Pending admin attempts to accept governance")
    scenario += c1.acceptGovernance(sp.unit).run(sender=bob, level=bLevel.next())
    scenario.verify(c1.data.administrator == bob.address)
    scenario.verify(c1.data.pendingAdministrator == sp.none)

    # [CONSISTENCY] return governance back to test account "admin"
    scenario += c1.setPendingGovernance(admin.address).run(sender=bob, level=bLevel.next())
    scenario += c1.acceptGovernance(sp.unit).run(sender=admin, level=bLevel.next())

    scenario.h3("Remove pending governance")
    # Bob is waiting for governance
    scenario += c1.setPendingGovernance(bob.address).run(sender=admin, level=bLevel.next())
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "remove pending governance", bLevel, admin, alice, c1.removePendingGovernance, sp.unit)
    scenario.verify(c1.data.pendingAdministrator == sp.none)
 
    scenario.h3("Set comptroller")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set comptroller", bLevel, admin, alice, c1.setComptroller, cmpt.address)
    scenario.verify(c1.data.comptroller == cmpt.address)

    scenario.h3("Set interest rate model")
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "set interest rate model", bLevel, admin, alice, c1.setInterestRateModel, irm.address)
    scenario.verify(c1.data.interestRateModel == irm.address)

    scenario.h3("Set reserve factor")
    reserveFactorArg = sp.nat(1)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "Set reserve factor", bLevel, admin, alice, c1.setReserveFactor, reserveFactorArg)
    scenario.verify(c1.data.reserveFactorMantissa == reserveFactorArg)

    scenario.h3("Add reserves")
    amountArg = sp.nat(10)
    scenario += c1.addReserves(amountArg).run(sender = alice, level = bLevel.next())
    scenario.h4("Try add reserves in callback")
    scenario += c1.getCash(sp.pair(sp.unit, c1.typed.addReserves)).run(sender=alice, level=bLevel.next(), valid=False)

    scenario.h3("Reduce reserves")
    amountArg = sp.nat(5)
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "reduce reserves", bLevel, admin, alice, c1.reduceReserves, amountArg)
    scenario.h4("Try to reduce insufficient")
    scenario += c1.reduceReserves(sp.nat(int(1e20))).run(sender = admin, level = bLevel.next(), valid=False)

    scenario.h3("Check hardResetOp")
    scenario += c1.setActiveOp(1).run(sender = admin, level = bLevel.next())
    scenario.verify(sp.len(c1.data.activeOperations) == sp.nat(1))    
    TestAdminFunctionality.checkAdminRequirementH4(scenario, "hardResetOp", bLevel, admin, alice, c1.hardResetOp, sp.unit)
    scenario.verify(sp.len(c1.data.activeOperations) == sp.nat(0))    


    #Test views
    scenario.h2("Test getBalanceOfUnderlying")
    scenario.h3("View stored balance")
    scenario += c1.getBalanceOfUnderlying(sp.pair(alice.address, view_result.typed.targetNat)).run(sender = alice, level = bLevel.next())
    scenario.verify_equal(view_result.data.last, sp.some(30))
    scenario.h3("Mint new tokens and check balance")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.mint(100).run(sender=alice, level=bLevel.current())
    scenario += c1.getBalanceOfUnderlying(sp.pair(alice.address, view_result.typed.targetNat)).run(sender = alice, level = bLevel.current())
    scenario.verify_equal(view_result.data.last, sp.some(130))
    scenario.h3("Try with nonexistent account")
    scenario += c1.getBalanceOfUnderlying(sp.pair(collateralToken, view_result.typed.targetNat)).run(sender = alice, level = bLevel.current(), valid=False)

    scenario.h2("Test getAccountSnapshot")
    DataRelevance.updateAccrueInterest(scenario, bLevel, alice, c1)
    scenario += c1.updateAccountSnapshot(alice.address).run(sender = alice, level = bLevel.current())
    scenario.verify(c1.data.accCTokenBalance == sp.nat(129723818))
    scenario.verify(c1.data.accBorrowBalance == sp.nat(0))
    scenario.verify(c1.data.accExchangeRateMantissa == sp.nat(1003785156984))    

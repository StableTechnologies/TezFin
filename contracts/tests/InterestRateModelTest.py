import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
RV = sp.io.import_script_from_url("file:contracts/tests//utils/ResultViewer.py")

@sp.add_test(name = "InterestRateModel_Tests")
def test():
    expScale = sp.nat(int(1e18))

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "florence")

    scenario.table_of_contents()
    scenario.h1("InterestRateModel tests")

    multiplierPerBlock = 180000000000 # 0.00000018
    baseRatePerBlock = 840000000000 # 0.00000084

    c1 = IRM.InterestRateModel(scale=expScale, multiplierPerBlock_=multiplierPerBlock, baseRatePerBlock_=baseRatePerBlock)
    scenario += c1

    view_result = RV.ViewerNat()
    scenario += view_result

    scenario.h2("Test getBorrowRate")
    scenario.h3("With zero params, result baseRatePerBlock")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(0), 
                                           borrows=sp.nat(0), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(baseRatePerBlock))
    scenario.h3("With zero borrows, result baseRatePerBlock")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(20), 
                                           borrows=sp.nat(0),
                                           reserves=sp.nat(10), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(baseRatePerBlock))
    scenario.h3("Only borrows, result multiplierPerBlock + baseRatePerBlock")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(0), 
                                           borrows=sp.nat(123), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(multiplierPerBlock + baseRatePerBlock))
    scenario.h3("Fail if reserves > (cash + borrows)")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(10), 
                                           borrows=sp.nat(10), 
                                           reserves=sp.nat(30), 
                                           cb=view_result.typed.targetNat)).run(valid=False)
    scenario.h3("Fail if reserves = (cash + borrows)")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(10), 
                                           borrows=sp.nat(10), 
                                           reserves=sp.nat(20), 
                                           cb=view_result.typed.targetNat)).run(valid=False)
    scenario.h3("Calculate BorrowRate 1")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(3), 
                                           borrows=sp.nat(5), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(952500000000))
    scenario.h3("Calculate BorrowRate 2")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(int(3e18)), 
                                           borrows=sp.nat(int(5e18)), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(952500000000))
    scenario.h3("Calculate BorrowRate 3")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(int(5e18)), 
                                           borrows=sp.nat(int(3e18)), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(907500000000))
    scenario.h3("Calculate BorrowRate 4")
    scenario += c1.getBorrowRate(sp.record(cash=sp.nat(5), 
                                           borrows=sp.nat(5), 
                                           reserves=sp.nat(2), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(952500000000))


    scenario.h2("Test getSupplyRate")
    scenario.h3("With zero params, result 0")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(0),
                                           borrows=sp.nat(0),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=sp.nat(0), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(0))
    scenario.h3("With reserveFactorMantissa = 1e18, result 0")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(10),
                                           borrows=sp.nat(10),
                                           reserves=sp.nat(10), 
                                           reserveFactorMantissa=sp.nat(int(1e18)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(0))
    scenario.h3("With zero borrows, result 0")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(10),
                                           borrows=sp.nat(0),
                                           reserves=sp.nat(5), 
                                           reserveFactorMantissa=sp.nat(int(1e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(0))
    scenario.h3("Fail if reserves > (cash + borrows)")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(10),
                                           borrows=sp.nat(10),
                                           reserves=sp.nat(30), 
                                           reserveFactorMantissa=sp.nat(10), 
                                           cb=view_result.typed.targetNat)).run(valid=False)
    scenario.h3("Fail if reserves = (cash + borrows)")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(10), 
                                           borrows=sp.nat(10), 
                                           reserves=sp.nat(20), 
                                           reserveFactorMantissa=sp.nat(10), 
                                           cb=view_result.typed.targetNat)).run(valid=False)
    scenario.h3("Calculate SupplyRate 1")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(500),
                                           borrows=sp.nat(300),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=sp.nat(int(1e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(306281250000))
    scenario.h3("Calculate SupplyRate 2")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(int(5e18)),
                                           borrows=sp.nat(int(3e18)),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=sp.nat(int(1e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(306281250000))
    scenario.h3("Calculate SupplyRate 4")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(30),
                                           borrows=sp.nat(50),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=sp.nat(int(1e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(535781250000))
    scenario.h3("Calculate SupplyRate 4")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(70),
                                           borrows=sp.nat(30),
                                           reserves=sp.nat(20), 
                                           reserveFactorMantissa=sp.nat(int(1e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(306281250000))
    scenario.h3("Calculate SupplyRate 5")
    scenario += c1.getSupplyRate(sp.record(cash=sp.nat(500),
                                           borrows=sp.nat(300),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=sp.nat(int(2e17)), 
                                           cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(272250000000))

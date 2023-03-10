# These test cases have been added to confirm that the Js Implementation of 
# BorrowRate and SupplyRate give the identical number for all significant digits
# for the inputs given below

import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
RV = sp.io.import_script_from_url("file:contracts/tests//utils/ResultViewer.py")

@sp.add_test(name = "Borrow_and_Supply_Rate_Js_Implementation_Test_Cases")
def test():
    expScale = sp.nat(int(1e18))

    # The parameters below have been adjusted to constraint a APY percent curve 
    # to stay between 0-~5 when the util is between 0-1

    scenario = sp.test_scenario()
    # scenario.add_flag("protocol", "ithaca")

    scenario.table_of_contents()
    scenario.h1("Test cases from the tests in the  JS implemetation for Supply and Borrow  rate")

    annualPeriods = 1051920
    baseRatePerBlock = 950642634 
    multiplierPerBlock = 46581489086 
    reserveFactorMantissa = 1000000000000000

    c2 = IRM.InterestRateModel(scale_=expScale, multiplierPerBlock_=multiplierPerBlock, baseRatePerBlock_=baseRatePerBlock)
    scenario += c2

    view_result = RV.ViewerNat()
    scenario += view_result

    scenario.h2("Test cases, to test if the JS implemetation for supply and  borrow rate is equivelant to the one in the contract for the market states below ")

    scenario.h3("Market State at 1k lent, 1 borrowed")

    lent = sp.mul(sp.nat(1000), expScale)
    borrowed = sp.mul(sp.nat(1), expScale)

    scenario.h4("Calculate BorrowRate")

    scenario += c2.getBorrowRate(sp.record(cash=lent, 
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))


    jsBorrowRateMantissa =  997177588 
    scenario.verify_equal(view_result.data.last , sp.some(jsBorrowRateMantissa))

    scenario.h3("Calculate SupplyRate")
    scenario += c2.getSupplyRate(sp.record(cash=lent,
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsSupplyRateMantissa = 995185 
    scenario.verify_equal(view_result.data.last, sp.some(jsSupplyRateMantissa))

    scenario.h3("Market State at 1k lent, 10 borrowed")
    
    lent = sp.mul(sp.nat(1000), expScale)
    borrowed = sp.mul(sp.nat(10), expScale)

    scenario.h4("Calculate BorrowRate")

    scenario += c2.getBorrowRate(sp.record(cash=lent, 
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    jsBorrowRateMantissa =  1411845496 
    scenario.verify_equal(view_result.data.last , sp.some(jsBorrowRateMantissa))

    
    scenario.h3("Calculate SupplyRate")
    scenario += c2.getSupplyRate(sp.record(cash=lent,
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsSupplyRateMantissa = 13964689
    scenario.verify_equal(view_result.data.last, sp.some(jsSupplyRateMantissa))

    scenario.h3("Market State at 1k lent , 100 borrowed")

    lent = sp.mul(sp.nat(1000), expScale)
    borrowed = sp.mul(sp.nat(100), expScale)

    scenario.h4("Calculate BorrowRate")

    scenario += c2.getBorrowRate(sp.record(cash=lent, 
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    jsBorrowRateMantissa =  5185323459 
    scenario.verify_equal(view_result.data.last , sp.some(jsBorrowRateMantissa))

    scenario.h3("Calculate SupplyRate")
    scenario += c2.getSupplyRate(sp.record(cash=lent,
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsSupplyRateMantissa = 470921648
    scenario.verify_equal(view_result.data.last, sp.some(jsSupplyRateMantissa))

    scenario.h3("Market State at 1k lent , 1k borrowed")

    lent = sp.mul(sp.nat(1000), expScale)
    borrowed = sp.mul(sp.nat(1000), expScale)

    scenario.h4("Calculate BorrowRate")

    scenario += c2.getBorrowRate(sp.record(cash=lent, 
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    jsBorrowRateMantissa =  24241387177 
    scenario.verify_equal(view_result.data.last , sp.some(jsBorrowRateMantissa))

    
    scenario.h3("Calculate SupplyRate")
    scenario += c2.getSupplyRate(sp.record(cash=lent,
                                           borrows=borrowed, 
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))

     
    jsSupplyRateMantissa = 12108572894
    scenario.verify_equal(view_result.data.last, sp.some(jsSupplyRateMantissa))

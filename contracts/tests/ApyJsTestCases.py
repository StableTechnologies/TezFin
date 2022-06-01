import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
RV = sp.io.import_script_from_url("file:contracts/tests//utils/ResultViewer.py")


@sp.add_test(name = "Apy_Js_Implementation_Test_Cases")
def test():
    expScale = sp.nat(int(1e18))

    # The parameters below have been adjusted to constraint a APY percent curve 
    # to stay between 0-~5 when the util is between 0-1

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "ithaca")

    scenario.table_of_contents()
    scenario.h1("Test cases from the tests in the  JS implemetation for  APY rate,  in commit 6a554d3819e7d950a62a2d4a10a6eddaa08f26e5")

    annualPeriods = 1051920
    baseRatePerBlock = 950642634 
    multiplierPerBlock = 46581489086 
    reserveFactorMantissa = 1000000000000000

    c2 = IRM.InterestRateModel(scale_=expScale, multiplierPerBlock_=multiplierPerBlock, baseRatePerBlock_=baseRatePerBlock)
    scenario += c2

    view_result = RV.ViewerNat()
    scenario += view_result

    scenario.h2("Test cases, to test if the JS implemetation for calculating APY uses the borrow rate  that is equivelant to the one in the contract for the inputs below ")

    scenario.h3("Market State at 1k lent, 1 borrowed")

    scenario.h4("Calculate BorrowRate From APY")
    scenario += c2.getBorrowRate(sp.record(cash=sp.nat(1000000000000000000000), 
                                           borrows=sp.nat(1000000000000000000), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    # the APY rates are in decimal form in JS we have to convert them back into
    # mantissa form  for use in tests 

    jsApyBorrowRateMatissa =  1048951048368960 #.00104895104836896
    scenario.verify_equal(view_result.data.last , sp.some(jsApyBorrowRateMatissa // annualPeriods))

    scenario.h3("Calculate SupplyRate From APY")
    scenario += c2.getSupplyRate(sp.record(cash=sp.nat(1000000000000000000000),
                                           borrows=sp.nat(1000000000000000000),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsApySupplyRateMatissa = 1046855005200 #.000001046855005200
    scenario.verify_equal(view_result.data.last, sp.some(jsApySupplyRateMatissa // annualPeriods))

    scenario.h3("Market State at 1k lent, 10 borrowed")

    scenario.h4("Calculate BorrowRate From APY")
    scenario += c2.getBorrowRate(sp.record(cash=sp.nat(1000000000000000000000), 
                                           borrows=sp.nat(10000000000000000000), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    # the APY rates are in decimal form in JS we have to convert them back into
    # mantissa form  for use in tests 

    jsApyBorrowRateMatissa =  1485148514152320       # .001485148514152320 
    scenario.verify_equal(view_result.data.last , sp.some(jsApyBorrowRateMatissa // annualPeriods))

    
    scenario.h3("Calculate SupplyRate From APY")
    scenario += c2.getSupplyRate(sp.record(cash=sp.nat(1000000000000000000000),
                                           borrows=sp.nat(10000000000000000000),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsApySupplyRateMatissa = 14689735652880           #.001468973565288000
    scenario.verify_equal(view_result.data.last, sp.some(jsApySupplyRateMatissa // annualPeriods))


    scenario.h3("Market State at 1k lent , 100 borrowed")

    scenario.h4("Calculate BorrowRate From APY")
    scenario += c2.getBorrowRate(sp.record(cash=sp.nat(1000000000000000000000), 
                                           borrows=sp.nat(100000000000000000000), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    # the APY rates are in decimal form in JS we have to convert them back into
    # mantissa form  for use in tests 

    jsApyBorrowRateMatissa =  5454545452991280       # .005454545452991280 
    scenario.verify_equal(view_result.data.last , sp.some(jsApyBorrowRateMatissa // annualPeriods))

    
    scenario.h3("Calculate SupplyRate From APY")
    scenario += c2.getSupplyRate(sp.record(cash=sp.nat(1000000000000000000000),
                                           borrows=sp.nat(100000000000000000000),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsApySupplyRateMatissa = 495371899964160        #.000495371899964160
    scenario.verify_equal(view_result.data.last, sp.some(jsApySupplyRateMatissa // annualPeriods))

    scenario.h3("Market State at 1k lent , 1k borrowed")

    scenario.h4("Calculate BorrowRate From APY")
    scenario += c2.getBorrowRate(sp.record(cash=sp.nat(1000000000000000000000), 
                                           borrows=sp.nat(1000000000000000000000), 
                                           reserves=sp.nat(0), 
                                           cb=view_result.typed.targetNat))

    # the APY rates are in decimal form in JS we have to convert them back into
    # mantissa form  for use in tests 

    jsApyBorrowRateMatissa =  25499999999229840       # .025499999999229840 
    scenario.verify_equal(view_result.data.last , sp.some(jsApyBorrowRateMatissa // annualPeriods))

    
    scenario.h3("Calculate SupplyRate From APY")
    scenario += c2.getSupplyRate(sp.record(cash=sp.nat(1000000000000000000000),
                                           borrows=sp.nat(1000000000000000000000),
                                           reserves=sp.nat(0), 
                                           reserveFactorMantissa=reserveFactorMantissa, 
                                           cb=view_result.typed.targetNat))
     
    jsApySupplyRateMatissa = 12737249998656480           #.012737249998656480#
    scenario.verify_equal(view_result.data.last, sp.some(jsApySupplyRateMatissa // annualPeriods))



import smartpy as sp

IRM = sp.io.import_script_from_url("file:contracts/InterestRateModel.py")
AdjustedIRM = sp.io.import_script_from_url("file:contracts/AdjustedInterestRateModel.py")
RV = sp.io.import_script_from_url("file:contracts/tests/utils/ResultViewer.py")

# Values from deploy/compile_targets/Config.json (CXTZ_IRM / CXTZ_AdjustedIRM).
MULTIPLIER_PER_BLOCK = 32610000000
BASE_RATE_PER_BLOCK = 0
JUMP_MULTIPLIER_PER_BLOCK = 875200000000
KINK = 700000000000000000
CASH_OFFSET = 20090000000

@sp.add_test(name = "AdjustedInterestRateModel_Tests")
def test():
    expScale = sp.nat(int(1e18))
    multiplierPerBlock = sp.nat(MULTIPLIER_PER_BLOCK)
    baseRatePerBlock = sp.nat(BASE_RATE_PER_BLOCK)
    kink = sp.nat(KINK)
    jumpMultiplierPerBlock = sp.nat(JUMP_MULTIPLIER_PER_BLOCK)
    cashOffset = sp.nat(CASH_OFFSET)

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("AdjustedInterestRateModel tests")

    standard = IRM.InterestRateModel(
        scale_=expScale,
        multiplierPerBlock_=multiplierPerBlock,
        baseRatePerBlock_=baseRatePerBlock,
        kink_=kink,
        jumpMultiplierPerBlock_=jumpMultiplierPerBlock)
    adjusted = AdjustedIRM.AdjustedInterestRateModel(
        scale_=expScale,
        multiplierPerBlock_=multiplierPerBlock,
        baseRatePerBlock_=baseRatePerBlock,
        kink_=kink,
        jumpMultiplierPerBlock_=jumpMultiplierPerBlock,
        cashOffset_=cashOffset)
    scenario += standard
    scenario += adjusted

    view_result = RV.ViewerNat()
    view_result_b = RV.ViewerNat()
    scenario += view_result
    scenario += view_result_b

    # Mainnet fXTZ snapshot (post-exploit, mutez).
    mainnet_cash = sp.nat(4281975000)
    mainnet_borrows = sp.nat(21534342300)
    mainnet_reserves = sp.nat(72695048)
    reserve_factor = sp.nat(50000000000000000)

    scenario.h2("Mainnet fXTZ post-exploit snapshot")
    scenario.h3("Standard IRM is in jump zone (high borrow rate)")
    scenario += standard.getBorrowRate(sp.record(
        cash=mainnet_cash,
        borrows=mainnet_borrows,
        reserves=mainnet_reserves,
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(sp.nat(142285078369)))

    scenario.h3("Adjusted IRM returns pre-exploit-like borrow rate")
    scenario += adjusted.getBorrowRate(sp.record(
        cash=mainnet_cash,
        borrows=mainnet_borrows,
        reserves=mainnet_reserves,
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(sp.nat(15321392198)))

    scenario.h3("Adjusted supply rate is materially lower than standard")
    scenario += standard.getSupplyRate(sp.record(
        cash=mainnet_cash,
        borrows=mainnet_borrows,
        reserves=mainnet_reserves,
        reserveFactorMantissa=reserve_factor,
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(sp.nat(113069356525)))
    scenario += adjusted.getSupplyRate(sp.record(
        cash=mainnet_cash,
        borrows=mainnet_borrows,
        reserves=mainnet_reserves,
        reserveFactorMantissa=reserve_factor,
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(sp.nat(6838632503)))

    scenario.h2("Zero cashOffset matches standard IRM")
    zero_offset = AdjustedIRM.AdjustedInterestRateModel(
        scale_=expScale,
        multiplierPerBlock_=multiplierPerBlock,
        baseRatePerBlock_=baseRatePerBlock,
        kink_=kink,
        jumpMultiplierPerBlock_=jumpMultiplierPerBlock,
        cashOffset_=sp.nat(0))
    scenario += zero_offset
    scenario += zero_offset.getBorrowRate(sp.record(
        cash=sp.nat(3),
        borrows=sp.nat(5),
        reserves=sp.nat(0),
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(sp.nat(20381250000)))
    scenario += standard.getBorrowRate(sp.record(
        cash=sp.nat(3),
        borrows=sp.nat(5),
        reserves=sp.nat(0),
        cb=view_result_b.typed.targetNat))
    scenario.verify_equal(view_result_b.data.last, view_result.data.last)

    scenario.h2("Zero borrows still yields base rate")
    scenario += adjusted.getBorrowRate(sp.record(
        cash=mainnet_cash,
        borrows=sp.nat(0),
        reserves=mainnet_reserves,
        cb=view_result.typed.targetNat))
    scenario.verify_equal(view_result.data.last, sp.some(baseRatePerBlock))

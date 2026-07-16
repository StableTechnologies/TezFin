import smartpy as sp

IRMErrors = sp.io.import_script_from_url(
    "file:contracts/errors/InterestRateModelErrors.py")
EC = IRMErrors.ErrorCodes

IRMInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/InterestRateModelInterface.py")


class AdjustedInterestRateModel(IRMInterface.InterestRateModelInterface):
    """Jump-rate IRM with a virtual cash offset for utilization only.

    Used on v3.0 fXTZ to normalize interest rates after the June 2026 borrow
    drain without changing real cash, borrow, redeem, or exchange-rate logic.

    Utilization formula:
      util = borrows / (cash + cashOffset + borrows - reserves)

    cashOffset is an immutable origination parameter, not a liquidity
    restoration. It intentionally inflates the utilization denominator so a
    drained pool does not sit in the IRM jump zone. The offset is not added to
    real cash and does not increase borrow capacity (CXTZ still uses sp.balance
    for checkCash). Changing it requires deploying and selecting another IRM.

    Security boundary:
      - cashOffset affects ONLY getBorrowRate / getSupplyRate utilization input.
      - CXTZ still uses sp.balance for getCashImpl(), checkCash(), exchangeRate,
        mint, redeem, and borrow transfers.
      - Lower rates slow interest accrual on totalBorrows; they do not enable the
        June 18 cached-cash repeated-redeem class of bugs (fXTZ is unaffected).
    """
    def __init__(self,
                 baseRatePerBlock_,
                 multiplierPerBlock_,
                 jumpMultiplierPerBlock_,
                 kink_,
                 scale_,
                 cashOffset_,
                 **extra_storage):
        self.init(
            scale=scale_,
            multiplierPerBlock=multiplierPerBlock_,
            baseRatePerBlock=baseRatePerBlock_,
            jumpMultiplierPerBlock=jumpMultiplierPerBlock_,
            kink=kink_,
            cashOffset=cashOffset_,
            **extra_storage
        )

    @sp.entry_point
    def getBorrowRate(self, params):
        sp.set_type(params, IRMInterface.TBorrowRateParams)
        utRate = self.utilizationRate(sp.record(
            cash=params.cash, borrows=params.borrows, reserves=params.reserves))
        result = self.calculateBorrowRate(utRate)
        sp.transfer(result, sp.mutez(0), params.cb)

    @sp.entry_point
    def getSupplyRate(self, params):
        sp.set_type(params, IRMInterface.TSupplyRateParams)
        oneMinusReserveFactor = sp.as_nat(
            self.data.scale - params.reserveFactorMantissa)
        utRate = self.utilizationRate(sp.record(
            cash=params.cash, borrows=params.borrows, reserves=params.reserves))
        borrowRate = self.calculateBorrowRate(utRate)
        rateToPool = borrowRate * oneMinusReserveFactor // self.data.scale
        result = utRate * rateToPool // self.data.scale
        sp.transfer(result, sp.mutez(0), params.cb)

    @sp.private_lambda(with_storage="read-only")
    def utilizationRate(self, params):
        sp.set_type(params, IRMInterface.TUtilizationParams)
        ur = sp.local('ur', sp.nat(0))
        sp.if params.borrows > sp.nat(0):
            adjustedCash = sp.compute(params.cash + self.data.cashOffset)
            divisor = sp.compute(sp.as_nat(adjustedCash + params.borrows - params.reserves))
            sp.verify(divisor > 0, EC.IRM_INSUFFICIENT_CASH)
            ur.value = params.borrows * self.data.scale // divisor
        sp.result(ur.value)

    @sp.private_lambda(with_storage="read-only")
    def calculateBorrowRate(self, utRate):
        sp.if utRate <= self.data.kink:
            sp.result(sp.compute(utRate * self.data.multiplierPerBlock // self.data.scale + self.data.baseRatePerBlock))
        sp.else:
            normalRate = sp.compute(
                self.data.kink * self.data.multiplierPerBlock // self.data.scale + self.data.baseRatePerBlock
            )
            excessUtil = sp.as_nat(utRate - self.data.kink)
            rate = sp.compute(
                excessUtil * self.data.jumpMultiplierPerBlock // self.data.scale + normalRate
            )
            sp.result(rate)

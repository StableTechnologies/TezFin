import bigInt from "big-integer";
// getSupplyRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token,
// precision of the CToken, returns the prevailing supply rate.
function getSupplyRate(
  loans: bigInt.BigInteger,
  balance: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const supplyRate = _calcSupplyRate(
    loans,
    balance,
    reserves,
    ctokenExpScale,
    irmExpScale,
    blockMultiplier,
    blockBaseRate,
    reserveFactor
  );
  return rescale(supplyRate, irmExpScale, ctokenExpScale);
}

function _calcSupplyRate(
  loans: bigInt.BigInteger,
  balance: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(loans, balance, reserves, irmExpScale);
  const borrowRate = _calcBorrowRate(
    loans,
    balance,
    reserves,
    ctokenExpScale,
    irmExpScale,
    blockMultiplier,
    blockBaseRate
  );
  const oneMinusReserveFactor = irmExpScale.minus(reserveFactor);
  const rateToPool = borrowRate
    .multiply(oneMinusReserveFactor)
    .divide(irmExpScale);

  const supplyRate = rateToPool.multiply(uRate).divide(irmExpScale);
  return supplyRate;
}

function rescale(
  mantissa: bigInt.BigInteger,
  mantissaScale: bigInt.BigInteger,
  newScale: bigInt.BigInteger
) {
  const numerator = mantissa.multiply(newScale);
  const rescaled = numerator.divide(mantissaScale);
  return rescaled;
}

export function getBorrowRate(
  loans: bigInt.BigInteger,
  balance: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const borrowRate = _calcBorrowRate(
    loans,
    balance,
    reserves,
    ctokenExpScale,
    irmExpScale,
    blockMultiplier,
    blockBaseRate
  );
  return rescale(borrowRate, irmExpScale, ctokenExpScale);
}

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
function _calcBorrowRate(
  loans: bigInt.BigInteger,
  balance: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(loans, balance, reserves, irmExpScale);
  const borrowRate = uRate
    .multiply(blockMultiplier)
    .divide(ctokenExpScale)
    .plus(blockBaseRate);
  return borrowRate;
}

function utilizationRate(
  loans: bigInt.BigInteger,
  balance: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  scale: bigInt.BigInteger
): bigInt.BigInteger {
  if (loans.lesserOrEquals(0)) {
    return bigInt.zero;
  }
  const divisor = balance.plus(loans).minus(reserves);
  if (divisor.eq(0)) {
    return bigInt.zero;
  }
  const utilizationRate = loans.multiply(scale).divide(divisor);
  return utilizationRate;
}

// checkTotalBorrows() - Given the last accrual block, the current accrual block,
// the old index, the old total borrows etc, returns what the total borrows now
// should be.
export function checkTotalBorrows(
  lastAccrualLevel,
  currentLevel,
  borrowIndex,
  borrows
) {
  const totalBorrows = 0;
	/*
    def doAccrueInterest(self, borrowRateMantissa):
        sp.set_type(borrowRateMantissa, sp.TNat)
        self.verifyIRM()
        self.verifyAndFinishActiveOp(OP.CTokenOperations.ACCRUE)
        sp.verify(borrowRateMantissa <=
                  self.data.borrowRateMaxMantissa, EC.CT_INVALID_BORROW_RATE)
        cash = self.getCashImpl()
        blockDelta = sp.as_nat(sp.level - self.data.accrualBlockNumber)

        simpleInterestFactor = sp.compute(self.mul_exp_nat(
            self.makeExp(borrowRateMantissa), blockDelta))
        interestAccumulated = sp.compute(self.mulScalarTruncate(
            simpleInterestFactor, self.data.totalBorrows))
        self.data.totalBorrows = interestAccumulated + self.data.totalBorrows
        self.data.totalReserves = self.mulScalarTruncateAdd(sp.record(mantissa=self.data.reserveFactorMantissa),
                                                            interestAccumulated,
                                                            self.data.totalReserves)
        self.data.borrowIndex = self.mulScalarTruncateAdd(
            simpleInterestFactor, self.data.borrowIndex, self.data.borrowIndex)
        self.data.accrualBlockNumber = sp.level

	 */
  return totalBorrows;
}

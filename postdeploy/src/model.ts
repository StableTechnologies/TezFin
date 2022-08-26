import bigInt from "big-integer";
// getSupplyRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token,
// precision of the CToken, returns the prevailing supply rate.
function getSupplyRate(
  loans: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const supplyRate = _calcSupplyRate(
    loans,
    cash,
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
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(loans, cash, reserves, irmExpScale);
  const borrowRate = _calcBorrowRate(
    loans,
    cash,
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
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const borrowRate = _calcBorrowRate(
    loans,
    cash,
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
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(loans, cash, reserves, irmExpScale);
  const borrowRate = uRate
    .multiply(blockMultiplier)
    .divide(ctokenExpScale)
    .plus(blockBaseRate);
  return borrowRate;
}

function utilizationRate(
  loans: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  scale: bigInt.BigInteger
): bigInt.BigInteger {
  if (loans.lesserOrEquals(0)) {
    return bigInt.zero;
  }
  const divisor = cash.plus(loans).minus(reserves);
  if (divisor.eq(0)) {
    return bigInt.zero;
  }
  const utilizationRate = loans.multiply(scale).divide(divisor);
  return utilizationRate;
}

interface TExp {
	mantissa: bigInt.BigInteger
}

function makeExp(value: bigInt.BigInteger): TExp {
	return {
		mantissa: value
	}
}
/*





    function mul_exp_nat( a, b){
        sp.set_type(a, TExp)
        sp.set_type(b, sp.TNat)
        return self.makeExp(a.mantissa * b)
	}

    function truncate( exp){
        sp.set_type(exp, TExp)
        return exp.mantissa // self.data.expScale
	}


    function mulScalarTruncate( a, scalar){
        sp.set_type(a, TExp)
        return self.truncate(self.mul_exp_nat(a, scalar))
	}


    function mulScalarTruncateAdd( a, scalar, addend){
        sp.set_type(a, TExp)
        sp.set_type(scalar, sp.TNat)
        sp.set_type(addend, sp.TNat)
        return self.mulScalarTruncate(a, scalar) + addend
	}

 
 */
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

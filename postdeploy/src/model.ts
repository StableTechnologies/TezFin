import bigInt from "big-integer";

// Exponential math function to be moved in a separate file
interface TExp {
  mantissa: bigInt.BigInteger;
}

function makeExp(value: bigInt.BigInteger): TExp {
  return {
    mantissa: value,
  };
}

function mul_exp_nat(a: TExp, b: bigInt.BigInteger) {
  return makeExp(a.mantissa.multiply(b));
}

function truncate(exponential: TExp, expScale: bigInt.BigInteger) {
  return exponential.mantissa.divide(expScale);
}

function mulScalarTruncate(
  a: TExp,
  scalar: bigInt.BigInteger,
  expScale: bigInt.BigInteger
) {
  return truncate(mul_exp_nat(a, scalar), expScale);
}


function mulScalarTruncateAdd(
  a: TExp,
  scalar: bigInt.BigInteger,
  addend: bigInt.BigInteger,
  expScale: bigInt.BigInteger
) {
  return mulScalarTruncate(a, scalar, expScale).add(addend);
}



// getSupplyRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token,
// precision of the CToken, returns the prevailing supply rate.
function getSupplyRate(
  loans: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const supplyRate = _calcSupplyRate(
    loans,
    cash,
    reserves,
    underlyingExpScale,
    irmExpScale,
    blockMultiplier,
    blockBaseRate,
    reserveFactor
  );
  return rescale(supplyRate, irmExpScale, underlyingExpScale);
}

function _calcSupplyRate(
  loans: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
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
    underlyingExpScale,
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
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const borrowRate = _calcBorrowRate(
    loans,
    cash,
    reserves,
    underlyingExpScale,
    irmExpScale,
    blockMultiplier,
    blockBaseRate
  );
  return rescale(borrowRate, irmExpScale, underlyingExpScale);
}

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
function _calcBorrowRate(
  loans: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  blockMultiplier: bigInt.BigInteger,
  blockBaseRate: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(loans, cash, reserves, irmExpScale);
  const borrowRate = uRate
    .multiply(blockMultiplier)
    .divide(underlyingExpScale)
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


//
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
  return totalBorrows;

}

function accrueInterestTotalBorrows(
  borrowRateMantissa: bigInt.BigInteger,
  borrowRateMaxMantissa: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  level: bigInt.BigInteger,
  accrualBlockNumber: bigInt.BigInteger,
  totalBorrows: bigInt.BigInteger
) {
  if (!borrowRateMantissa.lesserOrEquals(borrowRateMaxMantissa)) {
    throw new Error("INVALID BORROW RATE");
  }
  const blockDelta = level.minus(accrualBlockNumber);

  const simpleInterestFactor = mul_exp_nat(
    makeExp(borrowRateMantissa),
    blockDelta
  );
  const interestAccumulated = mulScalarTruncate(
    simpleInterestFactor,
    totalBorrows,
    underlyingExpScale
  );
  const totalBorrowsAfterInterest = interestAccumulated.add(totalBorrows);
  return totalBorrowsAfterInterest;
}

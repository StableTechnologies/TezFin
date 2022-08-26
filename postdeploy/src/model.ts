import bigInt from 'big-integer';
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


  const supplyRate =  _calcSupplyRate(
  loans,
  balance,
  reserves,
  ctokenExpScale,
  irmExpScale,
  blockMultiplier,
  blockBaseRate,
  reserveFactor,
)
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
	return supplyRate
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
  return borrowRate
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
  return totalBorrows;
}

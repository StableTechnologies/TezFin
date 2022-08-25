// getSupplyRate() - Given cash, borrows, etc from CToken storage, base rate per 
// block, etc from IRM storage, precision of the underlying token,
// precision of the CToken, returns the prevailing supply rate.
export function getSupplyRate(
  cash,
  borrows,
  baseRatePerBlock,
  underlyingExpScale,
  ctokenExpScale
) {
  const supplyRate = 0;
  return supplyRate;
}

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
export function getBorrowRate(
  cash,
  borrows,
  baseRatePerBlock,
  underlyingExpScale,
  ctokenExpScale
) {
  const borrowRate = 0;
  return borrowRate;
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

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

// 

// getSupplyRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token,
// precision of the CToken, returns the prevailing supply rate.
function _getSupplyRate(
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  multiplierPerBlock: bigInt.BigInteger,
  baseRatePerBlock: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const supplyRate = _calcSupplyRate(
    borrows,
    cash,
    reserves,
    ctokenExpScale,
    underlyingExpScale,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock,
    reserveFactor
  );
  return rescale(supplyRate, irmExpScale, ctokenExpScale);
}

function _calcSupplyRate(
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  multiplierPerBlock: bigInt.BigInteger,
  baseRatePerBlock: bigInt.BigInteger,
  reserveFactor: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(borrows, cash, reserves, irmExpScale);
	
  const borrowRateMantissa = _getBorrowRate(
    borrows,
    cash,
    reserves,
    ctokenExpScale,
    underlyingExpScale,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock
  );
  const oneMinusReserveFactor = irmExpScale.minus(reserveFactor);
  const rateToPool = borrowRateMantissa
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
  if (mantissaScale.eq(0)) {
    const rescaled = numerator.divide(mantissaScale);
    return rescaled;
  } else return bigInt.zero;
}
//type State = object;

interface State { ftokens: Object, accounts: Object };

interface Action {
  transformer: (state: State) => State;
}

const updateBorrowRate: Action = {
  transformer: (state) => getBorrowRates(state),
};
export function nextState(state: State, action: Action): State {
  return action.transformer(state);
}


function getBorrowRates(state: State): State {
  Object.keys(state.ftokens).forEach((token) => {
    const borrows = state[token].borrow.totalBorrows;
    const cash = state[token].currentCash;
    const reserves = state[token].totalReserves;
    const ctokenExpScale = state[token].halfExpScale;
    const underlyingExpScale = state[token].underlyingExpScale;
    const irm = state[token].interestRateModel;
    const irmExpScale = irm.scale;
    const multiplierPerBlock = irm.multiplierPerBlock;
    const baseRatePerBlock = irm.baseRatePerBlock;

    state[token].borrow.borrowRatePerBlock = _getBorrowRate(
      borrows,
      cash,
      reserves,
      ctokenExpScale,
      underlyingExpScale,
      irmExpScale,
      multiplierPerBlock,
      baseRatePerBlock
    );

  });
  return state;
}
//	return _getBorrowRate(data.totalBorrows, data.currentCash, data.totalReserves,
/* 
	function getBorrowRate(data: any,ctokenExpScale, underlyingExpScale): bigInt.BigInteger{
		return _getBorrowRate(data.totalBorrows, data.currentCash, data.totalReserves,
			d, data., data., data., data., data., data.,  
	}
*/

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
function _getBorrowRate(
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  multiplierPerBlock: bigInt.BigInteger,
  baseRatePerBlock: bigInt.BigInteger
): bigInt.BigInteger {
  const borrowRate = _calcBorrowRate(
    borrows,
    rescale(cash,underlyingExpScale,ctokenExpScale),
    reserves,
    ctokenExpScale,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock
  );
  /* rescaling is applied since we are assuming to set the baseratePerBlock and
   * multiplierperBlock for all ctokens at a constant exponential scale
*/
  return rescale(borrowRate, irmExpScale, ctokenExpScale);
}


function _calcBorrowRate(
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  multiplierPerBlock: bigInt.BigInteger,
  baseRatePerBlock: bigInt.BigInteger
): bigInt.BigInteger {
  const uRate = utilizationRate(borrows, cash, reserves, irmExpScale);
  const borrowRate = uRate
    .multiply(multiplierPerBlock)
    .divide(ctokenExpScale)
    .plus(baseRatePerBlock);
  return borrowRate;
}

function utilizationRate(
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  scale: bigInt.BigInteger
): bigInt.BigInteger {
  if (borrows.lesserOrEquals(0)) {
    return bigInt.zero;
  }
  const divisor = cash.plus(borrows).minus(reserves);
  if (divisor.eq(0)) {
    return bigInt.zero;
  }
  const utilizationRate = borrows.multiply(scale).divide(divisor);
  return utilizationRate;
}



//
// checkTotalBorrows() - Given the last accrual block, the current accrual block,
// the old index, the old total borrows etc, returns what the total borrows now
// should be.
export function checkTotalBorrows(
  borrowRateMaxMantissa: bigInt.BigInteger,
  underlyingExpScale: bigInt.BigInteger,
  ctokenExpScale: bigInt.BigInteger,
  level: bigInt.BigInteger,
  accrualBlockNumber: bigInt.BigInteger,
  totalBorrows: bigInt.BigInteger,
  borrows: bigInt.BigInteger,
  cash: bigInt.BigInteger,
  reserves: bigInt.BigInteger,
  irmExpScale: bigInt.BigInteger,
  multiplierPerBlock: bigInt.BigInteger,
  baseRatePerBlock: bigInt.BigInteger
) {
  const borrowRateMantissa = _getBorrowRate(
    borrows,
    cash,
    reserves,
    ctokenExpScale,
    underlyingExpScale,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock
  );

  const totalBorrowsAfterInterest = accrueInterestTotalBorrows(
    rescale(borrowRateMantissa, irmExpScale, underlyingExpScale),
    rescale(borrowRateMaxMantissa, irmExpScale, underlyingExpScale),
    underlyingExpScale,
    level,
    accrualBlockNumber,
    totalBorrows
  );

  return totalBorrowsAfterInterest;
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

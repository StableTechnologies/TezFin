import { State, state } from "./state";
import { marketTestData } from "./markets";
import { protoAddr } from "./protoaddr";
import { AssetType } from "tezoslendingplatformjs";
import bigInt from "big-integer";
import BigNumber from "bignumber.js";

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

function rescale(
  mantissa: bigInt.BigInteger,
  mantissaScale: bigInt.BigInteger,
  newScale: bigInt.BigInteger
) {
  console.log("\n", "mantissa : ", mantissa, "\n");
  const numerator = mantissa.multiply(newScale);
  console.log("\n", "numerator in rescale : ", numerator, "\n");
  if (!mantissaScale.eq(0)) {
    const rescaled = numerator.divide(mantissaScale);
    console.log("\n", "mantissaScale : ", mantissaScale, "\n");
    console.log(
      "\n",
      "rescaled numerator.divide(mantissaScale)in rescale: ",
      rescaled,
      "\n"
    );
    return rescaled;
  } else return bigInt.zero;
}

function mulScalarTruncateAdd(
  a: TExp,
  scalar: bigInt.BigInteger,
  addend: bigInt.BigInteger,
  expScale: bigInt.BigInteger
) {
  return mulScalarTruncate(a, scalar, expScale).add(addend);
}

interface BorrowRateParameter {
  borrows: bigInt.BigInteger;
  cash: bigInt.BigInteger;
  reserves: bigInt.BigInteger;
  ctokenExpScale: bigInt.BigInteger;
  underlyingExpScale: bigInt.BigInteger;
  irmExpScale: bigInt.BigInteger;
  multiplierPerBlock: bigInt.BigInteger;
  baseRatePerBlock: bigInt.BigInteger;
  token: AssetType;
}

function getBorrowRateParameters(
  state: State,
  token: string
): BorrowRateParameter {
  const markets = state.markets;
  const tokenDetails = state.protocolAddresses.underlying[token as AssetType];
  const tokenScale = bigInt(10).pow(tokenDetails.decimals);

  return {
    borrows: bigInt(markets[token].storage.borrow.totalBorrows),
    cash: bigInt(markets[token].storage.currentCash),
    reserves: bigInt(markets[token].storage.totalReserves),
    ctokenExpScale: bigInt(tokenScale),
    underlyingExpScale: bigInt(tokenScale),
    irmExpScale: bigInt(markets[token].rateModel.scale),
    multiplierPerBlock: bigInt(markets[token].rateModel.blockMultiplier),
    baseRatePerBlock: bigInt(markets[token].rateModel.blockRate),
    token: token as AssetType,
  };
}

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
function getBorrowRate(state: State, token: any): any {
  const borrowParams = getBorrowRateParameters(state, token);
  const borrowRate = _calcBorrowRate(borrowParams);
  /*
	console.log("\n", "irmExpScale : ", irmExpScale, "\n");
	console.log("\n", "borrowRate : ", borrowRate, "\n");
	*/

  /* rescaling is applied since we are assuming to set the baseratePerBlock and
   * multiplierperBlock for all ctokens at a constant exponential scale
   */

  console.log(
    "\n",
    "before scaling readable(borrowRate, irmExpScale)  : ",
    readable(borrowRate, borrowParams.irmExpScale),
    "\n"
  );
  const mantissa = rescale(
    borrowRate,
    borrowParams.irmExpScale,
    borrowParams.ctokenExpScale
  );
  console.log("\n", "mantissa in getBorrowRate : ", mantissa, "\n");
  return {
    mantissa: mantissa,
    withoutRescale: borrowRate,
    readable: readable(mantissa, borrowParams.irmExpScale),
    readableNonScaled: readable(borrowRate, borrowParams.irmExpScale),
    token: token,
  };
}

function _calcBorrowRate(
  borrowRateParams: BorrowRateParameter
): bigInt.BigInteger {
  const {
    borrows,
    cash,
    underlyingExpScale,
    ctokenExpScale,
    reserves,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock,
  } = borrowRateParams;
  const uRate = utilizationRate(borrows, cash, reserves, irmExpScale);
  console.log("\n", "uRate : ", uRate, "\n");

  const borrowRate = uRate
    .multiply(multiplierPerBlock)
    .divide(irmExpScale)
    .plus(baseRatePerBlock);
  console.log("\n", "borrowRate : ", borrowRate, "\n");

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
  console.log("\n", "utilizationRate : ", utilizationRate, "\n");
  console.log(
    "\n",
    "readable(utilizationRate,scale) : ",
    readable(utilizationRate, scale),
    "\n"
  );

  return utilizationRate;
}

function readableBorrowRateParams(params: BorrowRateParameter) {
  const {
    borrows,
    cash,
    underlyingExpScale,
    ctokenExpScale,
    reserves,
    irmExpScale,
    multiplierPerBlock,
    baseRatePerBlock,
  } = params;
  return {
    borrows: readable(borrows, ctokenExpScale),
    cash: readable(cash, underlyingExpScale),
    underlyingExpScale: (underlyingExpScale.toString().length - 1).toString(),
    ctokenExpScale: (ctokenExpScale.toString().length - 1).toString(),
    reserves: readable(reserves, ctokenExpScale),
    irmExpScale: (irmExpScale.toString().length - 1).toString(),
    multiplierPerBlock: readable(multiplierPerBlock, irmExpScale),
    baseRatePerBlock: readable(baseRatePerBlock, irmExpScale),
  };
}
function readable(mantissa, scale) {
  return new BigNumber(mantissa.toString()).div(scale.toString()).toString();
}
const mrkt: State = state(marketTestData, protoAddr);
/*
		{
		markets: marketTestData,
		protocolAddresses: protoAddr,
	};
	*/

/// delete

export function showBorrowRate(market, protocolAddresses, token) {
  const _state: State = state(market, protocolAddresses);
  const borrowRateParams = getBorrowRateParameters(_state, token);
  console.log(borrowRateParams);
  console.log(
    "\n",
    "readableBorrowRateParams(borrowRateParams) : ",
    readableBorrowRateParams(borrowRateParams),
    "\n"
  );

  console.log("\n", "BorrowRate : \n", getBorrowRate(_state, token), "\n");
}

interface AccrualParameters {
  borrowRateMantissa: bigInt.BigInteger;
  rateWithoutScaling: bigInt.BigInteger;
  borrowRateMaxMantissa: bigInt.BigInteger;
  irmExpScale: bigInt.BigInteger;
  underlyingExpScale: bigInt.BigInteger;
  level: bigInt.BigInteger;
  accrualBlockNumber: bigInt.BigInteger;
  totalBorrows: bigInt.BigInteger;
  token: AssetType;
}

function getAccrualParameters(
  state: State,
  level: bigInt.BigInteger,
  token: string
): AccrualParameters {
  const borrowParams = getBorrowRateParameters(state, token);
  const borrowRate = getBorrowRate(state, token);
  console.log("\n", "borrowRate in accrualParams : ", borrowRate, "\n");
  console.log("\n", "borrowRate.mantissa : ", borrowRate.mantissa, "\n");
  const markets = state.markets;
  const tokenDetails = state.protocolAddresses.underlying[token as AssetType];
  const tokenScale = bigInt(10).pow(tokenDetails.decimals);

  return {
    borrowRateMantissa: borrowRate.mantissa,
    rateWithoutScaling: borrowRate.withoutRescale,
    borrowRateMaxMantissa: bigInt(
      markets[token].storage.borrow.borrowRateMaxMantissa
    ),
    underlyingExpScale: borrowParams.underlyingExpScale,
    irmExpScale: borrowParams.irmExpScale,
    level: bigInt(level),
    accrualBlockNumber: bigInt(markets[token].storage.accrualBlockNumber),
    totalBorrows: borrowParams.borrows,
    token: token as AssetType,
  };
}

function accrueInterestTotalBorrows(accrualParameters: AccrualParameters) {
  const {
    borrowRateMantissa,
    rateWithoutScaling,
    borrowRateMaxMantissa,
    underlyingExpScale,
    irmExpScale,
    level,
    accrualBlockNumber,
    totalBorrows,
  } = accrualParameters;
  if (borrowRateMantissa.greaterOrEquals(borrowRateMaxMantissa)) {
    throw new Error("INVALID BORROW RATE");
  }
  console.log(
    "\n",
    " accrueInterest ...borrowRateMantissa  : ",
    borrowRateMantissa,
    "\n"
  );
  const blockDelta = level.minus(accrualBlockNumber);
  console.log("\n", "blockDelta : ", blockDelta, "\n");
  const simpleInterestFactor = mul_exp_nat(
    makeExp(borrowRateMantissa),
    blockDelta
  );
  console.log("\n", "simpleInterestFactor : ", simpleInterestFactor, "\n");
  const interestAccumulated = mulScalarTruncate(
    simpleInterestFactor,
    totalBorrows,
    underlyingExpScale
  );
  console.log("\n", "interestAccumulated : ", interestAccumulated, "\n");
  const totalBorrowsAfterInterest = interestAccumulated.add(totalBorrows);

  console.log("\n", " totalborrows  : ", totalBorrows, "\n");
  console.log(
    "\n",
    " totalborrows After Interest  : ",
    totalBorrowsAfterInterest,
    "\n"
  );

  console.log(
    "\n",
    " accrueInterest ...borrowRateMantissa  unscaled : ",
    rateWithoutScaling,
    "\n"
  );
  const _simpleInterestFactor = mul_exp_nat(
    makeExp(rateWithoutScaling),
    blockDelta
  );
  console.log(
    "\n",
    "simpleInterestFactor without scale : ",
    _simpleInterestFactor,
    "\n"
  );
  const _interestAccumulated = mulScalarTruncate(
    _simpleInterestFactor,
    totalBorrows,
    irmExpScale
  );
  console.log(
    "\n",
    "interestAccumulated without scale : ",
    _interestAccumulated,
    "\n"
  );
  const _totalBorrowsAfterInterest = _interestAccumulated.add(totalBorrows);

  console.log(
    "\n",
    " totalborrows After Interest  : ",
    _totalBorrowsAfterInterest,
    "\n"
  );
  return {
    scaled: totalBorrowsAfterInterest,
    notScaled: _totalBorrowsAfterInterest,
  };
}

export function calculateTotalBorrowBalance(
  market,
  protocolAddresses,
  level,
  token,
  borrowDelta,
  currentTotalInStorage
) {
  const _state: State = state(market, protocolAddresses);

  const borrowRateParams = getBorrowRateParameters(_state, token);
  const ctokenExpScale = getBorrowRateParameters(_state, token).ctokenExpScale;
  var accrualParams = getAccrualParameters(_state, bigInt(level), token);

  const borrowDeltaMantissa = ctokenExpScale.multiply(borrowDelta);
  //accrualParams.totalBorrows = accrualParams.totalBorrows.add(borrowDeltaMantissa);
  console.log("\n", "accrual : ", accrualParams, "\n");

  let totalBorrows = accrueInterestTotalBorrows(accrualParams);

  const mantissa = totalBorrows.notScaled.add(bigInt(borrowDeltaMantissa));
  const scaledMantissa = totalBorrows.scaled.add(bigInt(borrowDeltaMantissa));
  const readableNotScaled = readable(
    totalBorrows.notScaled.add(bigInt(borrowDeltaMantissa)),
    ctokenExpScale
  );
  const readableScaled = readable(
    totalBorrows.scaled.add(bigInt(borrowDeltaMantissa)),
    ctokenExpScale
  );
  const expected = mantissa;
  const deltaTotalBorrows = mantissa.subtract(bigInt(currentTotalInStorage));
  const irmExpScale = borrowRateParams.irmExpScale;
  const totalBorrowsBefore = accrualParams.totalBorrows;
  const blockDelta = accrualParams.accrualBlockNumber.subtract(
    accrualParams.level
  );

  console.log("/n deltaTotalBorrows", deltaTotalBorrows);
  const deltaAsBlocksOfAppliedInterest = deltaTotalBorrows
    .multiply(borrowRateParams.irmExpScale)
    .divide(accrualParams.totalBorrows)
    .divide(accrualParams.rateWithoutScaling);

  const calcBrate = accrualParams.rateWithoutScaling;
  const brateAppliedInStorage = calcBrate
    .multiply(blockDelta)
    .subtract(
      deltaTotalBorrows.multiply(irmExpScale).divide(totalBorrowsBefore)
    )
    .divide(blockDelta.add(deltaAsBlocksOfAppliedInterest));
  const brateDIff = accrualParams.rateWithoutScaling.subtract(
    brateAppliedInStorage
  );
  const readableBrateDiff = readable(brateDIff, irmExpScale);
  const readableBrateCalculated = readable(calcBrate, irmExpScale);
  const readableBrateApplied = readable(brateAppliedInStorage, irmExpScale);
  return {
    mantissa: mantissa,
    readableNotScaled: readableNotScaled,
    diffFromStroage: readable(deltaTotalBorrows, ctokenExpScale),
    diffAsNumOfBlocksInterest: deltaAsBlocksOfAppliedInterest,
    calcBrate: calcBrate,
    readableBrateCalculated: readableBrateCalculated,
    brateAppliedInStorage: brateAppliedInStorage,
    readableBrateApplied: readableBrateApplied,
    brateDIff: brateDIff,
    readableBrateDiff: readableBrateDiff,
    scaledMantissa: scaledMantissa,
    readableScaled: readableScaled,
  };
}

/*
showBorrowRate(marketTestData, protoAddr, "ETH");
console.log(
	"\n",
	'calculateTotalBorrowBalance(marketTestData, protoAddr, 1140974, "ETH")',
	calculateTotalBorrowBalance(marketTestData, protoAddr, 1140974, "ETH",0),
	"\n"
);
*/
export const getAccrualBlockNumber = (markets, token) => {
  return markets[token].storage.accrualBlockNumber;
};

export const getTotalBorrows = (markets, token, protocolAddresses) => {
  const ctokenScale = Math.pow(
    10,
    protocolAddresses.underlying[token].decimals
  );
  const totalBorrowMantissa = markets[token].storage.borrow.totalBorrows;
  return {
    totalBorrowMantissa: totalBorrowMantissa,
    readable: readable(totalBorrowMantissa, ctokenScale),
  };
};
// console.log('\n','getAccrualBlockNumber(marketTestData, "ETH") : ', getAccrualBlockNumber(marketTestData, "ETH"),'\n');

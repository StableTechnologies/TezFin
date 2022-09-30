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
	const numerator = mantissa.multiply(newScale);
	if (!mantissaScale.eq(0)) {
		const rescaled = numerator.divide(mantissaScale);
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
	const tokenDetails =
		state.protocolAddresses.underlying[token as AssetType];
	const tokenScale = bigInt(10).pow(tokenDetails.decimals);

	return {
		borrows: bigInt(markets[token].storage.borrow.totalBorrows),
		cash: bigInt(markets[token].storage.currentCash),
		reserves: bigInt(markets[token].storage.totalReserves),
		ctokenExpScale: bigInt(tokenScale),
		underlyingExpScale: bigInt(tokenScale),
		irmExpScale: bigInt(markets[token].rateModel.scale),
		multiplierPerBlock: bigInt(
			markets[token].rateModel.blockMultiplier
		),
		baseRatePerBlock: bigInt(markets[token].rateModel.blockRate),
		token: token as AssetType,
	};
}

// getBorrowRate() - Given cash, borrows, etc from CToken storage, base rate per
// block, etc from IRM storage, precision of the underlying token, precision of
// the CToken, returns the prevailing borrow rate.
function getBorrowRate(state: State, token: any): any {
	const {
		borrows,
		cash,
		underlyingExpScale,
		ctokenExpScale,
		reserves,
		irmExpScale,
		multiplierPerBlock,
		baseRatePerBlock,
	} = getBorrowRateParameters(state, token);
	const borrowRate = _calcBorrowRate(
		borrows,
		rescale(cash, underlyingExpScale, ctokenExpScale),
		reserves,
		ctokenExpScale,
		irmExpScale,
		multiplierPerBlock,
		baseRatePerBlock
	);
	/*
	console.log("\n", "irmExpScale : ", irmExpScale, "\n");
	console.log("\n", "borrowRate : ", borrowRate, "\n");
	*/

	/* rescaling is applied since we are assuming to set the baseratePerBlock and
	 * multiplierperBlock for all ctokens at a constant exponential scale
	 */

	const mantissa = rescale(borrowRate, irmExpScale, ctokenExpScale);
	return {
		mantissa: mantissa,
		humanReadable: new BigNumber(mantissa.toString())
			.div(ctokenExpScale.toString())
			.toString(),
		token: token,
	};
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
	/*
	console.log(
		"\n",
		borrows,
		cash,
		reserves,
		ctokenExpScale,
		irmExpScale,
		multiplierPerBlock,
		baseRatePerBlock,
		"\n"
	);
	*/
	const uRate = utilizationRate(borrows, cash, reserves, irmExpScale);
	/*
	console.log("\n", "uRate : ", uRate, "\n");

	 */
	const borrowRate = uRate
		.multiply(multiplierPerBlock)
		.divide(ctokenExpScale)
		.plus(baseRatePerBlock);
	/*
	console.log("\n", "borrowRate : ", borrowRate, "\n");

	 */
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

const mrkt: State = state(marketTestData, protoAddr);
/*
		{
		markets: marketTestData,
		protocolAddresses: protoAddr,
	};
	*/

/// delete
const borrowRateParams = getBorrowRateParameters(mrkt, "ETH");
console.log(borrowRateParams);

console.log(getBorrowRate(state(marketTestData, protoAddr), "ETH"));

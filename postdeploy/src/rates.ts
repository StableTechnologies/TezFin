import { State, state } from "./state";
import { marketTestData } from "./markets";
import { protoAddr } from "./protoaddr";
import { AssetType, FToken, TezosLendingPlatform } from "tezoslendingplatformjs";

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

function mulScalarTruncate(a: TExp, scalar: bigInt.BigInteger, expScale: bigInt.BigInteger) {
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

function getStorageAndIrm(state: State, token: string) {
	return {
		storage: state.markets[token].storage,
		irm: state.markets[token].rateModel,
	};
}

function getBorrowRateParameters(state: State, token: string): BorrowRateParameter {
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
	const storageAndIrm = getStorageAndIrm(state, token);

	const mantissa = FToken.getBorrowRate(storageAndIrm.storage, storageAndIrm.irm);

	return {
		mantissa: mantissa,
		readable: readable(mantissa, borrowParams.irmExpScale),
		readableNonScaled: readable(mantissa, borrowParams.irmExpScale),
		token: token,
	};
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
	borrowRateMaxMantissa: bigInt.BigInteger;
	borrowIndex: bigInt.BigInteger;
	irmExpScale: bigInt.BigInteger;
	underlyingExpScale: bigInt.BigInteger;
	level: bigInt.BigInteger;
	accrualBlockNumber: bigInt.BigInteger;
	totalBorrows: bigInt.BigInteger;
	token: AssetType;
}

function getAccrualParameters(state: State, level: bigInt.BigInteger, token: string): AccrualParameters {
	const borrowParams = getBorrowRateParameters(state, token);
	const borrowRate = getBorrowRate(state, token);
	const markets = state.markets;

	return {
		borrowRateMantissa: borrowRate.mantissa,
		borrowRateMaxMantissa: bigInt(markets[token].storage.borrow.borrowRateMaxMantissa),
		borrowIndex: bigInt(markets[token].storage.borrow.borrowIndex),
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
		borrowRateMaxMantissa,
		borrowIndex,
		underlyingExpScale,
		irmExpScale,
		level,
		accrualBlockNumber,
		totalBorrows,
	} = accrualParameters;
	if (borrowRateMantissa.greaterOrEquals(borrowRateMaxMantissa)) {
		throw new Error("INVALID BORROW RATE");
	}
	const blockDelta = level.minus(accrualBlockNumber);
	const simpleInterestFactor = mul_exp_nat(makeExp(borrowRateMantissa), blockDelta);
	const _borrowIndex = mulScalarTruncateAdd(simpleInterestFactor, borrowIndex, borrowIndex, irmExpScale);
	const interestAccumulated = mulScalarTruncate(simpleInterestFactor, totalBorrows, irmExpScale);
	const totalBorrowsAfterInterest = interestAccumulated.add(totalBorrows);

	return {
		totalBorrows: totalBorrowsAfterInterest,
		borrowIndex: _borrowIndex,
	};
}
function calculateAccountBalance(accountPrincipal, borrowIndex, InterestIndex) {
	console.log("\n", "InterestIndex : ", InterestIndex, "\n");
	if (bigInt(accountPrincipal).eq(bigInt.zero)) {
		return bigInt.zero;
	} else {
		const principalTimesIndex = bigInt(accountPrincipal).multiply(bigInt(borrowIndex));
		return principalTimesIndex.divide(bigInt(InterestIndex));
	}
}
export function calculateTotalBorrowBalance(
	market,
	protocolAddresses,
	level,
	token,
	borrowDelta,
	currentTotalInStorage,
	accountLastData,
	accountBorrowsNow,
	acceptedError = 0
) {
	const _state: State = state(market, protocolAddresses);

	const borrowRateParams = getBorrowRateParameters(_state, token);
	const ctokenExpScale = getBorrowRateParameters(_state, token).ctokenExpScale;
	var accrualParams = getAccrualParameters(_state, bigInt(level), token);

	const borrowDeltaMantissa = ctokenExpScale.multiply(borrowDelta);

	let totalBorrows = accrueInterestTotalBorrows(accrualParams);

	const mantissa = totalBorrows.totalBorrows.add(bigInt(borrowDeltaMantissa));
	const readableTotalBorrow = readable(
		totalBorrows.totalBorrows.add(bigInt(borrowDeltaMantissa)),
		ctokenExpScale
	);
	const deltaTotalBorrows = mantissa.subtract(bigInt(currentTotalInStorage));
	const irmExpScale = borrowRateParams.irmExpScale;

	var deltaAsBlocksOfAppliedInterest = bigInt.zero;
	if (!accrualParams.totalBorrows.eq(bigInt.zero)) {
		deltaAsBlocksOfAppliedInterest = deltaTotalBorrows
			.multiply(borrowRateParams.irmExpScale)
			.divide(accrualParams.totalBorrows)
			.divide(accrualParams.borrowRateMantissa);
	}
	const calcBrate = accrualParams.borrowRateMantissa;

	const readableBrateCalculated = readable(calcBrate, irmExpScale);
	const accountBorrows = calculateAccountBalance(
		accountLastData.borrowPrincipal,
		totalBorrows.borrowIndex,
		accountLastData.borrowIndex
	).add(bigInt(borrowDeltaMantissa));
	const accountDiff = accountBorrows.subtract(bigInt(accountBorrowsNow));
	const e = new BigNumber(acceptedError).multipliedBy(new BigNumber(ctokenExpScale.toString()));
	const pass =
		accountDiff.leq(bigInt(e.integerValue().toString())) &&
		deltaTotalBorrows.leq(bigInt(e.integerValue().toString()));
	return {
		mantissa: mantissa,
		readableTotalBorrow: readableTotalBorrow,
		diffFromStroage: readable(deltaTotalBorrows, ctokenExpScale),
		diffAsNumOfBlocksInterest: deltaAsBlocksOfAppliedInterest,
		calcBrate: calcBrate,
		readableBrateCalculated: readableBrateCalculated,
		accountBorrowPrincipal: accountBorrows,
		accountPrincipalInStorage: accountBorrowsNow,
		diffFromModel: accountDiff,
		pass: pass,
	};
}

export const getAccrualBlockNumber = (markets, token) => {
	return markets[token].storage.accrualBlockNumber;
};

export const getTotalBorrows = (markets, token, protocolAddresses) => {
	const ctokenScale = Math.pow(10, protocolAddresses.underlying[token].decimals);
	const totalBorrowMantissa = markets[token].storage.borrow.totalBorrows;
	return {
		totalBorrowMantissa: totalBorrowMantissa,
		readable: readable(totalBorrowMantissa, ctokenScale),
	};
};

export async function borrowRateTest(
	keystore,
	token,
	borrowActionDelta,
	borrowAction,
	comptroller,
	protocolAddresses,
	tezosNode,
	market,
	acceptedError = "0"
) {
	async function printBorrowRate(token) {
		let mrkt = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses!, tezosNode);
		showBorrowRate(mrkt, protocolAddresses, token);
	}

	async function totalBorrowsCalculated(
		mrkt,
		token,
		borrowDelta,
		protocolAddresses,
		accountAddress,
		accountLastData,
		acceptedError
	) {
		//GET accrual number and total borrows from storage
		const accrualBlock = await accrualBlockNumber(token);
		const totalBorrows = await totalBorrowsInStorage(token, protocolAddresses);
		const accountNow = await getTokenDetailsForAccount(accountAddress, token);
		//caluculateTotal borrows passing last market and this accrual
		const calcBorrowBalance = calculateTotalBorrowBalance(
			mrkt,
			protocolAddresses,
			accrualBlock,
			token,
			borrowDelta,
			totalBorrows.totalBorrowMantissa,
			accountLastData,
			accountNow.borrowPrincipal,
			acceptedError
		);
		console.log("\n", "calcBorrowBalance : ", calcBorrowBalance, "\n");
		console.log("\n", "totalBorrows(in storage) : ", totalBorrows, "\n");
		return {
			calculated: calcBorrowBalance,
			storageMarket: totalBorrows,
			stroageAccount: accountNow.borrowPrincipal,
		};
	}
	async function getTokenDetailsForAccount(accountAddress, token) {
		const data = await TezosLendingPlatform.GetFtokenBalancesNoMod(accountAddress, market, tezosNode);
		return data[token];
	}
	async function totalBorrowsInStorage(token, protocolAddresses) {
		let mrkt = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses!, tezosNode);
		return getTotalBorrows(mrkt, token, protocolAddresses);
	}
	async function accrualBlockNumber(token) {
		let mrkt = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses!, tezosNode);
		return getAccrualBlockNumber(mrkt, token);
	}
	const errOutOfExpectedRange = "Borrows calculated vs in Storage have a greater error than accepted";
	try {
		console.log("\n", "in borrow test : ", "\n");
		const mrkt = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses!, tezosNode);
		const account = await getTokenDetailsForAccount(keystore.publicKeyHash, "USD");
		await borrowAction;
		//GET accrual number and total borrows from storage
		//caluculateTotal borrows passing last market and this accrual
		//compare two borrows
		const borrowModel = await totalBorrowsCalculated(
			mrkt,
			token,
			borrowActionDelta,
			protocolAddresses,
			keystore.publicKeyHash,
			account,
			acceptedError
		);
		if (!borrowModel.calculated.pass) {
			console.log("\n Calculations for Borrows \n", borrowModel);

			throw errOutOfExpectedRange;
		} else {
			console.log("\n Calculations for Borrows \n", borrowModel);
			return;
		}
	} catch (e) {
		throw e;
	}
}

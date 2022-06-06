import bigInt from "big-integer";
import { BigNumber } from 'bignumber.js';

/*
    * @description Interface for exponentialy scaled numbers
    *
    * @param mantissa 
    * @param decimal 
    * @param expScale
    */

type scaledNumber = 
	{t: "MantissaWithScale" , mantissa: bigInt.BigInteger, expScale: bigInt.BigInteger}
	| {t: "DecimalWithScale" , decimal: BigNumber, expScale: bigInt.BigInteger}


export function mantissaWithScale(mantissa: bigInt.BigInteger, expScale: bigInt.BigInteger): scaledNumber {
	return {
		t: "MantissaWithScale",
		mantissa,
		expScale,
	}
}

export function decimalWithScale(decimal: BigNumber, expScale: bigInt.BigInteger): scaledNumber {
	return {
		t: "DecimalWithScale",
		decimal,
		expScale,
	}
}

export interface ExpNum {
	mantissa: bigInt.BigInteger,
	decimal: BigNumber,
	expScale: bigInt.BigInteger,
}


export function toExpNum(numWithScale: scaledNumber): ExpNum {
	switch (numWithScale.t) {
		case "MantissaWithScale":
			return {
				mantissa: numWithScale.mantissa,
				decimal: new BigNumber(numWithScale.mantissa.toString()).div(numWithScale.expScale.toString()),
				expScale: numWithScale.expScale,
			};
		case "DecimalWithScale":
			return {
				mantissa: bigInt(numWithScale.decimal.multipliedBy(numWithScale.expScale.toString()).toFixed(0,1).toString()),
				decimal: numWithScale.decimal,
				expScale: numWithScale.expScale,
			};

	}
}


// Warning! the below functions expect two ExpNum's two have the same scale 
// does not check scaling or rescale them

export function mulExp(a: ExpNum, b: ExpNum): ExpNum{
	const aMulb = a.mantissa.multiply(b.mantissa);
	const truncate = aMulb.divide(a.expScale);
	return toExpNum(mantissaWithScale(truncate, a.expScale))
}

export function divExp(a: ExpNum, b: ExpNum): ExpNum{
	const aDivb = b.mantissa.equals(0) ? bigInt(0) :  a.mantissa.divide(b.mantissa);
	const rescale = aDivb.multiply(a.expScale);
	return toExpNum(mantissaWithScale(rescale, a.expScale))
}

export function addExp(a: ExpNum, b: ExpNum): ExpNum{
	const aAddb = a.mantissa.add(b.mantissa);
	return toExpNum(mantissaWithScale(aAddb, a.expScale))
}

export function subExp(a: ExpNum, b: ExpNum): ExpNum{
	const aSubb = a.mantissa.add(b.mantissa);
	return toExpNum(mantissaWithScale(aSubb, a.expScale))
}


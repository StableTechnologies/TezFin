import { FToken } from "./FToken";
import { BigNumber } from "bignumber.js";
import bigInt from "big-integer";

const expect = require("chai").expect;

interface ExchangeRateTest {
  args: ExchangeRateArgs;
  expected: number;
  precision: number;
}

interface ExchangeRateArgs {
  totalSupply: number;
  totalBorrows: number;
  initialExchangeRateMantissa: number;
  totalReserves: number;
  currentCash: number;
}

function getStorage(args: ExchangeRateArgs): FToken.storage {
  return {
    accrualBlockNumber: 0,
    administrator: "",
    balancesMapId: 0,
    supply: {
      totalSupply: bigInt(args.totalSupply),
      supplyRatePerBlock: bigInt(0),
    },
    borrow: {
      totalBorrows: bigInt(args.totalBorrows),
      borrowIndex: bigInt(0),
      borrowRateMaxMantissa: bigInt(0),
      borrowRatePerBlock: bigInt(0),
    },
    comptrollerAddress: "",
    expScale: bigInt(0),
    halfExpScale: bigInt(0),
    initialExchangeRateMantissa: bigInt(args.initialExchangeRateMantissa),
    interestRateModel: "",
    pendingAdministrator: "",
    reserveFactorMantissa: bigInt(0),
    reserveFactorMaxMantissa: bigInt(0),
    totalReserves: bigInt(args.totalReserves),
    currentCash: bigInt(args.currentCash),
  };
}

function getExchangeRate(args: ExchangeRateArgs): number {
  const _storage = getStorage(args);
  return FToken.getExchangeRate(_storage);
}

describe("getExchangeRate(storage)", function () {
  const tests: ExchangeRateTest[] = [
    {
      args: {
        totalSupply: 100,
        currentCash: 100,
        totalBorrows: 0,
        totalReserves: 0,
        initialExchangeRateMantissa: 1.0,
      },
      expected: 1.0,
      precision: 3
    },
    {
      args: {
        totalSupply: 100,
        currentCash: 50,
        totalBorrows: 50,
        totalReserves: 0,
        initialExchangeRateMantissa: 1.0,
      },
      expected: 1.0,
      precision: 3
    },
    {
      args: {
        totalSupply: 100,
        currentCash: 50,
        totalBorrows: 51,
        totalReserves: 0.1,
        initialExchangeRateMantissa: 1.0,
      },
      expected: 1.009,
      precision: 3
    },
    {
      args: {
        totalSupply: 9.64,
        currentCash: 50,
        totalBorrows: 51,
        totalReserves: 0.1,
        initialExchangeRateMantissa: 1.0,
      },
      expected: 1.009,
      precision: 3
    },
  ];

  tests.forEach((test: ExchangeRateTest) => {
    it(`The Exchange Rate : 
		  ((${test.args.currentCash})underlyingBalance + (${test.args.totalBorrows})totalBorrows - (${test.args.totalReserves})totalReserves) / (${test.args.totalSupply})totalSupply 
		  \n should equal: ${test.expected})`, function () {
      const res = getExchangeRate(test.args).toFixed(test.precision);
      expect(res).to.equal(test.expected.toFixed(test.precision));
    });
  });
});



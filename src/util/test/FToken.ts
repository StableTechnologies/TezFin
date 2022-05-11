import { FToken } from "../src/FToken";
import { BigNumber } from "bignumber.js";
import bigInt from "big-integer";

const expect = require("chai").expect;

interface ExchangeRateTest {
  args: ExchangeRateArgs;
  expected: number;
}

interface ExchangeRateArgs {
  totalSupply: number;
  totalBorrows: number;
  initialExchangeRateMantissa: number;
  totalReserves: number;
  currentCash: number;
  expScale: number;
}

function getStorage(args: ExchangeRateArgs): FToken.Storage {
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
    expScale: bigInt(args.expScale),
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

function getExchangeRate(args: ExchangeRateArgs): BigNumber {
  const _storage: FToken.Storage = getStorage(args);
  return FToken.GetExchangeRate(_storage);
}

describe("getExchangeRate(storage)", function () {
  const tests: ExchangeRateTest[] = [
    {
      args: {
        totalSupply: 100,
        currentCash: 100,
        totalBorrows: 0,
        totalReserves: 0,
        initialExchangeRateMantissa: 1,
        expScale: 3,
      },
      expected: 1.0,
    },
    {
      args: {
        totalSupply: 100,
        currentCash: 50,
        totalBorrows: 50,
        totalReserves: 0,
        initialExchangeRateMantissa: 1,
        expScale: 3,
      },
      expected: 1.0,
    },
    {
      args: {
        totalSupply: 1000,
        currentCash: 500,
        totalBorrows: 510,
        totalReserves: 1,
        initialExchangeRateMantissa: 1,
        expScale: 3,
      },
      expected: 1.009,
    },
    {
      args: {
        totalSupply: 6000,
        currentCash: 964,
        totalBorrows: 5100,
        totalReserves: 10,
        initialExchangeRateMantissa: 1,
        expScale: 3,
      },
      expected: 1.009,
    },
  ];

  tests.forEach((test: ExchangeRateTest) => {
    it(`
	  The Exchange Rate calculated: ${getExchangeRate(test.args)}

	  -----------Formula ----------

		  ((${test.args.currentCash})underlyingBalance + (${
      test.args.totalBorrows
    })totalBorrows - (${test.args.totalReserves})totalReserves) / (${
      test.args.totalSupply
    })totalSupply 

	  -----------Formula ----------
        
	should equal expected: ${test.expected}`, function () {
      const res = getExchangeRate(test.args);
      const _expected = new BigNumber(test.expected.toString());
      expect(res.eq(_expected)).to.equal(true);
    });
  });
});

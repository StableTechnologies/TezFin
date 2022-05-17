import { FToken } from "../src/FToken";
import { BigNumber } from "bignumber.js";
import bigInt from "big-integer";

const expect = require("chai").expect;

interface ExchangeRateTest {
  args: ExchangeRateArgs;
  desc: string;
  expected: number | string;
}

interface ExchangeRateArgs {
  totalSupply: number | string;
  totalBorrows: number | string;
  initialExchangeRateMantissa: number | string;
  totalReserves: number | string;
  currentCash: number | string;
  expScale: number | string;
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
  return FToken.getExchangeRate(_storage);
}

describe("getExchangeRate(storage)", function () {
  const tests: ExchangeRateTest[] = [
    {
      desc: "Test case from issue #132",
      args: {
        totalSupply: "100",
        currentCash: 100,
        totalBorrows: 0,
        totalReserves: 0,
        initialExchangeRateMantissa: 1,
        expScale: 1,
      },
      expected: 1.0,
    },
    {
      desc: "Test case from issue #132",
      args: {
        totalSupply: 100,
        currentCash: 50,
        totalBorrows: 50,
        totalReserves: 0,
        initialExchangeRateMantissa: 1,
        expScale: 1,
      },
      expected: 1.0,
    },
    {
      desc: "Test case from issue #132 scaled expScale/initialExchangeRateMantissa by 1000 for 3 decimal places",
      args: {
        totalSupply: 1000,
        currentCash: 500,
        totalBorrows: 510,
        totalReserves: 1,
        initialExchangeRateMantissa: 1000,
        expScale: 1000,
      },
      expected: 1.009,
    },
    {
      desc: "Test case from issue #132 scaled by 1000",
      args: {
        totalSupply: 6000,
        currentCash: 964,
        totalBorrows: 5100,
        totalReserves: 10,
        initialExchangeRateMantissa: 1000,
        expScale: 1000,
      },
      expected: 1.009,
    },
    {
      desc: "Testing property when the numerator is zero",
      args: {
        totalSupply: 1000,
        currentCash: 100,
        totalBorrows: 0,
        totalReserves: 100,
        initialExchangeRateMantissa: 234,
        expScale: 100,
      },
      expected: 0,
    },
    {
      desc: "Testing property division by zero and retuning initialExhangeRate when totla supply is 0",
      args: {
        totalSupply: 0,
        currentCash: 1,
        totalBorrows: 1,
        totalReserves: 0,
        initialExchangeRateMantissa: 234,
        expScale: 100,
      },
      expected: 2.34,
    },
    {
      desc: "Test case, data from BTC FToken storage ",
      args: {
        totalSupply: 4396775725,
        currentCash: 4398793844,
        totalBorrows: 1057953,
        totalReserves: 0,
	initialExchangeRateMantissa: '1000000000000000000',
        expScale: '1000000000000000000'
      },
	    expected: '1.000699619947069281'
    },
    {
      desc: "Test case, data from ETH FToken storage ",
      args: {
	      totalSupply: '106113817386805698284' ,
        currentCash: '98981987064168614410',
        totalBorrows: '7716971958727265793',
        totalReserves: 0,
        initialExchangeRateMantissa: '1000000000000000000',
        expScale: '1000000000000000000',
      },
      expected: '1.005514283158405524',
    },
    {
      desc: "Test case, data from USD FToken storage ",
      args: {
	      totalSupply: '21769247144' ,
        currentCash: '1347030412',
        totalBorrows: '22601098095',
        totalReserves: 0,
        initialExchangeRateMantissa: '1000000000000000000',
        expScale: '1000000000000000000',
      },
      expected: '1.100089881316843761',
    },
  ];

  tests.forEach((test: ExchangeRateTest) => {
    it(`-------------------------------------------------------------

          ${test.desc}


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

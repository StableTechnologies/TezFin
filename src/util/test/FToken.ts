import { FToken } from "../src/FToken";
import { InterestRateModel } from "../src/contracts/InterestRateModel";
import { BigNumber } from "bignumber.js";
import bigInt from "big-integer";

const expect = require("chai").expect;
interface GetPrecisionTest {
  expScale: number | string;
  expected: number | string;
}

const precisionTests: GetPrecisionTest[] = [
  {
    expScale: "100",
    expected: 2,
  },
  {
    expScale: "10",
    expected: 1,
  },
  {
    expScale: "1000000000000000000",
    expected: 18,
  },
  {
    expScale: "1",
    expected: 0,
  },
];

function getPrecision(test: GetPrecisionTest): number {
  return FToken.getPrecision(bigInt(test.expScale));
}

precisionTests.forEach((test: GetPrecisionTest) => {
  it(`-------------------------------------------------------------



	  Exponential Scale: ${test.expScale.toString()}
	  The precision calculation: 
        * log's base is 10

	  -----------Formula ----------
	
	log(${test.expScale}) / log(10)

	  -----------Formula ----------
        
	should equal expected: ${test.expected}`, function () {
    const res = getPrecision(test);
    expect(res).to.equal(test.expected);
  });
});

interface APYtest {
  args: APYargs;
  desc: string;
  expected: {
    borrowAPY: number | string;
    supplyAPY: number | string;
  };
}

interface APYargs {
  supplyRatePerBlock: number | string;
  borrowRatePerBlock: number | string;
  annualPeriod: number | string;
  expScale: number | string;
  interestRateModel: {
    blockRate: number | string;
    blockMultiplier: number | string;
    scale: number | string;
  };
}

function getStorageApyTest(
  args: APYargs
): [FToken.Storage, InterestRateModel.Storage] {
  const fTokenStorage: FToken.Storage = {
    accrualBlockNumber: 0,
    administrator: "",
    balancesMapId: 0,
    supply: {
      totalSupply: bigInt(0),
      supplyRatePerBlock: bigInt(args.supplyRatePerBlock),
    },
    borrow: {
      totalBorrows: bigInt(0),
      borrowIndex: bigInt(0),
      borrowRateMaxMantissa: bigInt(0),
      borrowRatePerBlock: bigInt(args.borrowRatePerBlock),
    },
    comptrollerAddress: "",
    expScale: bigInt(args.expScale),
    halfExpScale: bigInt(0),
    initialExchangeRateMantissa: bigInt(0),
    interestRateModel: "",
    pendingAdministrator: "",
    reserveFactorMantissa: bigInt(0),
    reserveFactorMaxMantissa: bigInt(0),
    totalReserves: bigInt(0),
    currentCash: bigInt(0),
  };

  const interestRateModelStorage: InterestRateModel.Storage = {
    blockRate: bigInt(args.interestRateModel.blockRate),
    blockMultiplier: bigInt(args.interestRateModel.blockMultiplier),
    scale: bigInt(args.interestRateModel.blockRate),
  };

  return [fTokenStorage, interestRateModelStorage];
}

function getBorrowRate(args: APYargs): BigNumber {
  const _storage = getStorageApyTest(args);
  const ftokenStorage: FToken.Storage = _storage[0];
  const interestRateModelStorage: InterestRateModel.Storage = _storage[1];

  return FToken.GetBorrowRate(ftokenStorage, interestRateModelStorage);
}

describe("APY calculation GetBorrowRate/GetSupplyRate", function () {
  const tests: APYtest[] = [
    {
      desc: "Test case from USD FToken storage",
      args: {
        supplyRatePerBlock: "0",
        borrowRatePerBlock: "5000000000000",
        annualPeriod: "1051920",
        expScale: "1000000000000000000",
        interestRateModel: {
          blockRate: "840000000000",
          blockMultiplier: "180000000000",
          scale: "1000000000000000000",
        },
      },
      expected: {
        borrowAPY: "5.256",
        supplyAPY: "0",
      },
    },
  ];

  tests.forEach((test: APYtest) => {
    it(`-------------------------------------------------------------

          ${test.desc}


	  The Borrow Rate calculated: ${getBorrowRate(test.args)}

	  -----------Formula ----------
	  APYborrow = (borrowRatePerBlock = ${new BigNumber(
      test.args.borrowRatePerBlock
    ).div(test.args.expScale)}) * (annualPeriod = ${test.args.annualPeriod})

	  -----------Formula ----------
        
	should equal expected: ${test.expected.borrowAPY}`, function () {
      const res = getBorrowRate(test.args);
      const _expected = new BigNumber(test.expected.borrowAPY.toString());
      expect(res.eq(_expected)).to.equal(true);
    });
  });
});

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
        initialExchangeRateMantissa: "1000000000000000000",
        expScale: "1000000000000000000",
      },
      expected: "1.000699619947069281",
    },
    {
      desc: "Test case, data from ETH FToken storage ",
      args: {
        totalSupply: "106113817386805698284",
        currentCash: "98981987064168614410",
        totalBorrows: "7716971958727265793",
        totalReserves: 0,
        initialExchangeRateMantissa: "1000000000000000000",
        expScale: "1000000000000000000",
      },
      expected: "1.005514283158405524",
    },
    {
      desc: "Test case, data from USD FToken storage ",
      args: {
        totalSupply: "21769247144",
        currentCash: "1347030412",
        totalBorrows: "22601098095",
        totalReserves: 0,
        initialExchangeRateMantissa: "1000000000000000000",
        expScale: "1000000000000000000",
      },
      expected: "1.100089881316843761",
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

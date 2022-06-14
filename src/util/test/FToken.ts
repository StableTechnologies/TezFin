import { BigNumber } from 'bignumber.js';
import bigInt from 'big-integer';
import { FToken } from '../src/FToken';
import { InterestRateModel } from '../src/contracts/InterestRateModel';

const { expect } = require('chai');

interface GetPrecisionTest {
  desc?: string;
  expScale: number | string;
  expected: number | string;
}

const precisionTests: GetPrecisionTest[] = [
    {
        expScale: '100',
        expected: 2
    },
    {
        expScale: '10',
        expected: 1
    },
    {
        expScale: '1000000000000000000',
        expected: 18
    },
    {
        expScale: '1',
        expected: 0
    },
    {
        expScale: '0',
        expected: 0
    }
];

function getPrecision(test: GetPrecisionTest): number {
    return FToken.getPrecision(bigInt(test.expScale));
}

precisionTests.forEach((test: GetPrecisionTest) => {
    it(`-------------------------------------------------------------


          ${test.desc}

	  Exponential Scale: ${test.expScale.toString()}
	  The precision calculation: 
        * expScale base is 10

	  -----------Formula ----------
	
	log(${test.expScale}) / log(10)

	  -----------Formula ----------
        
	should equal expected: ${test.expected}`, () => {
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
  reserveFactorMantissa: number | string;
  annualPeriod: number | string;
  currentCash: number | string;
  totalBorrows: number | string;
  totalReserves: number | string;
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
        administrator: '',
        balancesMapId: 0,
        supply: {
            totalSupply: bigInt(0),
            supplyRatePerBlock: bigInt(0)
        },
        borrow: {
            totalBorrows: bigInt(args.totalBorrows),
            borrowIndex: bigInt(0),
            borrowRateMaxMantissa: bigInt(0),
            borrowRatePerBlock: bigInt(0)
        },
        comptrollerAddress: '',
        expScale: bigInt(args.expScale),
        halfExpScale: bigInt(0),
        initialExchangeRateMantissa: bigInt(0),
        interestRateModel: '',
        pendingAdministrator: '',
        reserveFactorMantissa: bigInt(args.reserveFactorMantissa),
        reserveFactorMaxMantissa: bigInt(0),
        totalReserves: bigInt(args.totalReserves),
        currentCash: bigInt(args.currentCash)
    };

    const interestRateModelStorage: InterestRateModel.Storage = {
        blockRate: bigInt(args.interestRateModel.blockRate),
        blockMultiplier: bigInt(args.interestRateModel.blockMultiplier),
        scale: bigInt(args.interestRateModel.scale)
    };

    return [fTokenStorage, interestRateModelStorage];
}

function getBorrowRate(args: APYargs): bigInt.BigInteger {
    const _storage = getStorageApyTest(args);
    const ftokenStorage: FToken.Storage = _storage[0];
    const interestRateModelStorage: InterestRateModel.Storage = _storage[1];

    return FToken.GetBorrowRate(ftokenStorage, interestRateModelStorage);
}
function getSupplyRate(args: APYargs): bigInt.BigInteger {
    const _storage = getStorageApyTest(args);
    const ftokenStorage: FToken.Storage = _storage[0];
    const interestRateModelStorage: InterestRateModel.Storage = _storage[1];

    return FToken.GetSupplyRate(ftokenStorage, interestRateModelStorage);
}

describe('APY calculation GetBorrowRate/GetSupplyRate', () => {
    const tests: APYtest[] = [
	  {
            desc: 'Test case with 1k lent, 1 borrowed',
            args: {
                reserveFactorMantissa: '1000000000000000',
                currentCash: '1000000000000000000000',
                totalBorrows: '1000000000000000000',
                totalReserves: '0',
                annualPeriod: '1051920',
                expScale: '1000000000000000000',
                interestRateModel: {
                    blockRate: '950642634',
                    blockMultiplier: '46581489086',
                    scale: '1000000000000000000'
                }
            },
            expected: {
                borrowAPY: '1048951048368960',
                supplyAPY: '1046855005200'
            }
	  },
	  {
            desc: 'Test case with 1k lent, 10 borrowed',
            args: {
                reserveFactorMantissa: '1000000000000000',
                currentCash: '1000000000000000000000',
                totalBorrows: '10000000000000000000',
                totalReserves: '0',
                annualPeriod: '1051920',
                expScale: '1000000000000000000',
                interestRateModel: {
                    blockRate: '950642634',
                    blockMultiplier: '46581489086',
                    scale: '1000000000000000000'
                }
            },
            expected: {
                borrowAPY: '1485148514152320',
                supplyAPY: '14689735652880'
            }
        },
	  {
            desc: 'Test case with 1k lent, 100 borrowed',
            args: {
                reserveFactorMantissa: '1000000000000000',
                currentCash: '1000000000000000000000',
                totalBorrows: '100000000000000000000',
                totalReserves: '0',
                annualPeriod: '1051920',
                expScale: '1000000000000000000',
                interestRateModel: {
                    blockRate: '950642634',
                    blockMultiplier: '46581489086',
                    scale: '1000000000000000000'
                }
            },
            expected: {
                borrowAPY: '5454545452991280',
                supplyAPY: '495371899964160'
            }
        },
	  {
            desc: 'Test case with 1k lent, 1k borrowed',
            args: {
                reserveFactorMantissa: '1000000000000000',
                currentCash: '1000000000000000000000',
                totalBorrows: '1000000000000000000000',
                totalReserves: '0',
                annualPeriod: '1051920',
                expScale: '1000000000000000000',
                interestRateModel: {
                    blockRate: '950642634',
                    blockMultiplier: '46581489086',
                    scale: '1000000000000000000'
                }
            },
            expected: {
                borrowAPY: '25499999999229840',
                supplyAPY: '12737249998656480'
            }
        }

    ];

    tests.forEach((test: APYtest) => {
        it(`-------------------------------------------------------------

          ${test.desc}

	  -----------Formula ----------
	  AYPborrow = borrowRatePerBlock * (annualPeriod = ${test.args.annualPeriod}) 
	  AYPborrow% = AYPborrow / expScale

	  -----------Formula ----------
        
	  The APYBorrow% calculated: ${getBorrowRate(test.args)}
	  should equal expected: ${test.expected.borrowAPY}`, () => {
            const res = getBorrowRate(test.args);
            const _expected = test.expected.borrowAPY;
            expect(res.toString()).to.equal(_expected);
        });
    });

    tests.forEach((test: APYtest) => {
        it(`-------------------------------------------------------------

          ${test.desc}

	  -----------Formula ----------
	  APYsupply = supplyRatePerBlock * (annualPeriod = ${test.args.annualPeriod})

	  AYPsupply% = AYPborrow  / expScale

	  -----------Formula ----------
        
	  The APYsupply rate calculated: ${getSupplyRate(test.args)}
	  should equal expected: ${test.expected.supplyAPY}`, () => {
            const res = getSupplyRate(test.args);
            const _expected = test.expected.supplyAPY;
            expect(res.toString()).to.equal(_expected);
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
        administrator: '',
        balancesMapId: 0,
        supply: {
            totalSupply: bigInt(args.totalSupply),
            supplyRatePerBlock: bigInt(0)
        },
        borrow: {
            totalBorrows: bigInt(args.totalBorrows),
            borrowIndex: bigInt(0),
            borrowRateMaxMantissa: bigInt(0),
            borrowRatePerBlock: bigInt(0)
        },
        comptrollerAddress: '',
        expScale: bigInt(args.expScale),
        halfExpScale: bigInt(0),
        initialExchangeRateMantissa: bigInt(args.initialExchangeRateMantissa),
        interestRateModel: '',
        pendingAdministrator: '',
        reserveFactorMantissa: bigInt(0),
        reserveFactorMaxMantissa: bigInt(0),
        totalReserves: bigInt(args.totalReserves),
        currentCash: bigInt(args.currentCash)
    };
}

function getExchangeRate(args: ExchangeRateArgs): BigNumber {
    const _storage: FToken.Storage = getStorage(args);
    return FToken.getExchangeRate(_storage);
}

describe('getExchangeRate(storage)', () => {
    const tests: ExchangeRateTest[] = [
        {
            desc: 'Test case from issue #132',
            args: {
                totalSupply: '100',
                currentCash: 100,
                totalBorrows: 0,
                totalReserves: 0,
                initialExchangeRateMantissa: 1,
                expScale: 1
            },
            expected: 1.0
        },
        {
            desc: 'Test case from issue #132',
            args: {
                totalSupply: 100,
                currentCash: 50,
                totalBorrows: 50,
                totalReserves: 0,
                initialExchangeRateMantissa: 1,
                expScale: 1
            },
            expected: 1.0
        },
        {
            desc: 'Test case from issue #132 scaled expScale/initialExchangeRateMantissa by 1000 for 3 decimal places',
            args: {
                totalSupply: 1000,
                currentCash: 500,
                totalBorrows: 510,
                totalReserves: 1,
                initialExchangeRateMantissa: 1000,
                expScale: 1000
            },
            expected: 1.009
        },
        {
            desc: 'Test case from issue #132 scaled by 1000',
            args: {
                totalSupply: 6000,
                currentCash: 964,
                totalBorrows: 5100,
                totalReserves: 10,
                initialExchangeRateMantissa: 1000,
                expScale: 1000
            },
            expected: 1.009
        },
        {
            desc: 'Testing property when the numerator is zero',
            args: {
                totalSupply: 1000,
                currentCash: 100,
                totalBorrows: 0,
                totalReserves: 100,
                initialExchangeRateMantissa: 234,
                expScale: 100
            },
            expected: 0
        },
        {
            desc: 'Testing property division by zero and retuning initialExhangeRate when totla supply is 0',
            args: {
                totalSupply: 0,
                currentCash: 1,
                totalBorrows: 1,
                totalReserves: 0,
                initialExchangeRateMantissa: 234,
                expScale: 100
            },
            expected: 2.34
        },
        {
            desc: 'Test case, data from BTC FToken storage ',
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
            desc: 'Test case, data from ETH FToken storage ',
            args: {
                totalSupply: '106113817386805698284',
                currentCash: '98981987064168614410',
                totalBorrows: '7716971958727265793',
                totalReserves: 0,
                initialExchangeRateMantissa: '1000000000000000000',
                expScale: '1000000000000000000'
            },
            expected: '1.005514283158405524'
        },
        {
            desc: 'Test case, data from USD FToken storage ',
            args: {
                totalSupply: '21769247144',
                currentCash: '1347030412',
                totalBorrows: '22601098095',
                totalReserves: 0,
                initialExchangeRateMantissa: '1000000000000000000',
                expScale: '1000000000000000000'
            },
            expected: '1.100089881316843761'
        }
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
        
	should equal expected: ${test.expected}`, () => {
            const res = getExchangeRate(test.args);
            const _expected = new BigNumber(test.expected.toString());
            expect(res.eq(_expected)).to.equal(true);
        });
    });
});

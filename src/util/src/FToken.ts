import { AssetType, TokenStandard } from './enum';
import {
    ConseilOperator,
    ConseilQuery,
    ConseilQueryBuilder,
    KeyStore,
    Signer,
    TezosContractUtils,
    TezosMessageUtils,
    TezosNodeReader,
    TezosNodeWriter,
    TezosParameterFormat,
    Transaction,
} from 'conseiljs';

import { BigNumber } from 'bignumber.js';
import { InterestRateModel } from './contracts/InterestRateModel';
import { JSONPath } from 'jsonpath-plus';
import { ProtocolAddresses, UnderlyingAsset } from './types';
import bigInt from 'big-integer';
import Decimal from 'decimal.js';
import { TezosLendingPlatform } from './TezosLendingPlatform';

export namespace FToken {
    /*
     * @description
     *
     * @param
     */
    export interface Storage {
        accrualBlockNumber: number;
        administrator: string;
        balancesMapId: number;
        supply: {
            numSuppliers?: number;
            totalSupply: bigInt.BigInteger;
            supplyRatePerBlock: bigInt.BigInteger;
        };
        borrow: {
            numBorrowers?: number;
            totalBorrows: bigInt.BigInteger;
            borrowIndex: bigInt.BigInteger;
            borrowRateMaxMantissa: bigInt.BigInteger;
            borrowRatePerBlock: bigInt.BigInteger;
        };
        comptrollerAddress: string;
        expScale: bigInt.BigInteger;
        halfExpScale: bigInt.BigInteger;
        initialExchangeRateMantissa: bigInt.BigInteger;
        protocolSeizeShareMantissa: bigInt.BigInteger;
        interestRateModel: string;
        pendingAdministrator: string | undefined;
        reserveFactorMantissa: bigInt.BigInteger;
        reserveFactorMaxMantissa: bigInt.BigInteger;
        totalReserves: bigInt.BigInteger;
        currentCash: bigInt.BigInteger;
    }

    /*
     * @description
     *
     * @param
     * @param
     */
    export async function GetStorage(
        fTokenAddress: string,
        underlying: UnderlyingAsset,
        server: string,
        type: TokenStandard,
    ): Promise<Storage> {
        switch (type) {
            case TokenStandard.FA12: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({
                    path: '$.args[0].args[0].args[0].args[2].int',
                    json: storageResult,
                })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[2].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === 'None' ? undefined : adminJsonPrase;
                const protocolSeizeShareMantissa = JSONPath({
                    path: '$.args[0].args[1].args[3].int',
                    json: storageResult,
                })[0];
                const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(underlying, fTokenAddress, server);
                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({
                        path: '$.args[0].args[0].args[0].args[0].args[0].int',
                        json: storageResult,
                    })[0],
                    administrator: JSONPath({
                        path: '$.args[0].args[0].args[0].args[1].string',
                        json: storageResult,
                    })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[2].args[2].int', json: storageResult })[0],
                        ),
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0],
                        ),
                        borrowRateMaxMantissa: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0],
                        ),
                        borrowRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0],
                        ),
                    },
                    protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
                    comptrollerAddress: JSONPath({
                        path: '$.args[0].args[0].args[1].args[2].string',
                        json: storageResult,
                    })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0],
                    ),
                    initialExchangeRateMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0],
                    ),
                    interestRateModel: JSONPath({ path: '$.args[0].args[1].args[1].string', json: storageResult })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0],
                    ),
                    reserveFactorMaxMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0],
                    ),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: cash,
                };
            }
            case TokenStandard.FA2: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({
                    path: '$.args[0].args[0].args[0].args[2].int',
                    json: storageResult,
                })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[1].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === 'None' ? undefined : adminJsonPrase;
                const protocolSeizeShareMantissa = JSONPath({
                    path: '$.args[0].args[1].args[2].int',
                    json: storageResult,
                })[0];
                const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(underlying, fTokenAddress, server);
                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({
                        path: '$.args[0].args[0].args[0].args[0].args[0].int',
                        json: storageResult,
                    })[0],
                    administrator: JSONPath({
                        path: '$.args[0].args[0].args[0].args[1].string',
                        json: storageResult,
                    })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0],
                        ),
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0],
                        ),
                        borrowRateMaxMantissa: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0],
                        ),
                        borrowRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0],
                        ),
                    },
                    protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
                    comptrollerAddress: JSONPath({
                        path: '$.args[0].args[0].args[1].args[2].string',
                        json: storageResult,
                    })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0],
                    ),
                    initialExchangeRateMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0],
                    ),
                    interestRateModel: JSONPath({
                        path: '$.args[0].args[1].args[0].args[2].string',
                        json: storageResult,
                    })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[3].int', json: storageResult })[0],
                    ),
                    reserveFactorMaxMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0],
                    ),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: cash,
                };
            }
            case TokenStandard.XTZ: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({
                    path: '$.args[0].args[0].args[0].args[2].int',
                    json: storageResult,
                })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[1].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === 'None' ? undefined : adminJsonPrase;
                const spendableBalance = await TezosNodeReader.getSpendableBalanceForAccount(server, fTokenAddress);
                const protocolSeizeShareMantissa = JSONPath({
                    path: '$.args[0].args[1].args[2].int',
                    json: storageResult,
                })[0];

                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({
                        path: '$.args[0].args[0].args[0].args[0].args[0].int',
                        json: storageResult,
                    })[0],
                    administrator: JSONPath({
                        path: '$.args[0].args[0].args[0].args[1].string',
                        json: storageResult,
                    })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0],
                        ),
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0],
                        ),
                        borrowRateMaxMantissa: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0],
                        ),
                        borrowRatePerBlock: bigInt(
                            JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0],
                        ),
                    },
                    protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
                    comptrollerAddress: JSONPath({ path: '$.args[0].args[0].args[2].string', json: storageResult })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[4].int', json: storageResult })[0]),
                    initialExchangeRateMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0],
                    ),
                    interestRateModel: JSONPath({
                        path: '$.args[0].args[1].args[0].args[1].string',
                        json: storageResult,
                    })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[1].args[3].int', json: storageResult })[0],
                    ),
                    reserveFactorMaxMantissa: bigInt(
                        JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0],
                    ),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: bigInt(spendableBalance),
                };
            }
        }
    }

    /*
     * @description TODO
     *
     * @param
     */
    export function makeSuppliersQuery(balancesMapId: number): ConseilQuery {
        let suppliersQuery = ConseilQueryBuilder.blankQuery();
        suppliersQuery = ConseilQueryBuilder.addFields(suppliersQuery, 'key', 'value', 'operation_group_id');
        suppliersQuery = ConseilQueryBuilder.addPredicate(suppliersQuery, 'big_map_id', ConseilOperator.EQ, [
            balancesMapId,
        ]);
        // TODO: get all values with value.balance > 0
        suppliersQuery = ConseilQueryBuilder.setLimit(suppliersQuery, 10_000);
        return suppliersQuery;
    }

    /*
     * @description TODO
     *
     * @param
     */
    export function makeBorrowersQuery(balancesMapId: number): ConseilQuery {
        let borrowersQuery = ConseilQueryBuilder.blankQuery();
        borrowersQuery = ConseilQueryBuilder.addFields(borrowersQuery, 'key', 'value', 'operation_group_id');
        borrowersQuery = ConseilQueryBuilder.addPredicate(borrowersQuery, 'big_map_id', ConseilOperator.EQ, [
            balancesMapId,
        ]);
        // TODO: get all values with value.principal > 0
        borrowersQuery = ConseilQueryBuilder.setLimit(borrowersQuery, 10_000);
        return borrowersQuery;
    }

    /*
     * @description
     *
     * @param storage
     */
    export function GetCash(storage: Storage): bigInt.BigInteger {
        return bigInt(0); // storage.supply.totalSupply.minus(storage.borrow.totalBorrows.minus(storage.totalReserves));
    }

    /**
     * @description Given a token storage,it returns the  exchangeRate with 0 adjustment but correct precision
     *
     * @param ftokenBalance The ammount of FTokens
     * @param storage The FToken storage
     * @returns underlyingBalance as BigNumber
     */
    export function applyExchangeRate(ftokenBalance: bigInt.BigInteger, storage: Storage): BigNumber {
        const exchangeRate = getExchangeRate(storage);

        return _calcApplyExchangeRate(ftokenBalance, exchangeRate, storage.expScale);
    }

    /**
     * @description Given a token storage,it returns the  exchangeRate with 0 adjustment but correct precision
     *
     * @param storage The FToken storage
     * @returns exchangeRate as BigNumber
     */
    export function getExchangeRate(storage: Storage): BigNumber {
        const expScale = Decimal.log(storage.expScale.toString());
        const log10 = Decimal.log(10);
        const decimalPlaces = expScale.div(log10);

        const exchangeRate = _calcExchangeRateAdjusted(
            0,
            storage.initialExchangeRateMantissa,
            storage.currentCash,
            storage.borrow.totalBorrows,
            storage.totalReserves,
            storage.supply.totalSupply,
            storage.expScale,
        );
        return new BigNumber(exchangeRate.toFixed(parseInt(decimalPlaces.toString())));
    }

    /**
     * @description   Once the supplyRate Mantissa is calculated, The APY mantissa
     *                is computed and  multiplied by 100 to get APY percent.
     *
     *
     *
     * @param storage FToken storage.
     * @param irStorage InterestRateModel storage.
     * @returns supplyApy percent Mantissa as bigInt.BigInteger
     */
    export function getSupplyRateApy(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        const _blockRate = getSupplyRate(storage, irStorage);
        return _calcAnnualizedRate(_blockRate, irStorage.scale).multiply(100);
    }

    /**
     * @description  The rate calculation here is based on the getSupplyRate
     *               function of the InterestRateModel contract.
     *
     * @param storage FToken storage.
     * @param irStorage InterestRateModel storage.
     * @returns supplyRate Mantissa as bigInt.BigInteger
     */
    export function getSupplyRate(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        return _calcSupplyRate(
            storage.borrow.totalBorrows,
            storage.currentCash,
            storage.totalReserves,
            irStorage.scale,
            irStorage.blockMultiplier,
            irStorage.blockRate,
            storage.reserveFactorMantissa,
        );
    }

    /**
     * @description  The rate calculation here is based on the getBorrowRate
     *                function of the InterestRateModel contract.
     *
     * @param storage FToken storage.
     * @param irStorage InterestRateModel storage.
     * @returns borrowRate  Mantissa as bigInt.BigInteger
     */
    export function getBorrowRate(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        return _calcBorrowRate(
            storage.borrow.totalBorrows,
            storage.currentCash,
            storage.totalReserves,
            irStorage.scale,
            irStorage.blockMultiplier,
            irStorage.blockRate,
        );
    }

    /**
     * @description   Once the borrowRate Mantissa is calculated, The APY mantissa
     *                is computed and multiplied by 100 to get APY percent.
     *
     * @param storage FToken storage.
     * @param irStorage InterestRateModel storage.
     * @returns borrowAPY percent Mantissa as bigInt.BigInteger
     */
    export function getBorrowRateApy(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        const _blockRate = getBorrowRate(storage, irStorage);

        if (_blockRate.greaterOrEquals(storage.borrow.borrowRateMaxMantissa)) {
            return _calcAnnualizedRate(storage.borrow.borrowRateMaxMantissa, irStorage.scale).multiply(100);
        }

        return _calcAnnualizedRate(_blockRate, irStorage.scale).multiply(100);
    }

    /**
     * @description  Get the dynamic borrow rate apy function, that takes the additional amount to be borrowed
     *               and adds it to total borrows to calculate the borrow rate apy.
     *
     *
     * @param storage FToken storage.
     * @param irStorage InterestRateModel storage.
     * @returns a function that takes the amount to be borrowed and returns the borrowAPY percent Mantissa as bigInt.BigInteger
     */

    export function getDynamicBorrowRateApyFn(
        storage: Storage,
        irStorage: InterestRateModel.Storage,
    ): (borrowAmount: bigInt.BigInteger) => bigInt.BigInteger {
        return (additionalAmount: bigInt.BigInteger) => {
            const _storage = {
                ...storage,
                borrow: {
                    ...storage.borrow,
                    totalBorrows: storage.borrow.totalBorrows.plus(additionalAmount),
                },
            };
            return getBorrowRateApy(_storage, irStorage);
        };
    }

    /**
     * @description  Calculates the borrowRatePerBlock matissa as per the contract code using the fomula:
     *
     *  borrowRatePerBlock = (utilizationRate * blockMultiplier / scale) + blockBaseRate
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale  the exponential scale all the mantissa's are in
     * @param blockmultiplier rate line slope, order of magnitude of scale.
     * @param blockbaserate per-block interest rate, order of magnitude of scale.
     * @returns borrowrateperblock as bigInt.BigInteger
     */
    function _calcBorrowRate(
        loans: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        scale: bigInt.BigInteger,
        blockMultiplier: bigInt.BigInteger,
        blockBaseRate: bigInt.BigInteger,
    ): bigInt.BigInteger {
        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);

        return utilizationRate.multiply(blockMultiplier).divide(scale).plus(blockBaseRate);
    }

    /**
     * @description Calculates the utilizationRate as per the contract code using this formula:
     *
     *  utilizationRate = (loan * scale) / ( balance + loans - reserves)
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale  The exponential scale all the matissa's are in
     * @returns utilizationRate as BigInteger
     */
    function _calcUtilizationRate(
        loans: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        scale: bigInt.BigInteger,
    ): bigInt.BigInteger {
        if (loans.lesserOrEquals(0)) {
            return bigInt.zero;
        }

        const divisor = balance.plus(loans).minus(reserves);

        if (divisor.eq(0)) {
            return bigInt.zero;
        }

        const utilizationRate = loans.multiply(scale).divide(divisor);

        return utilizationRate;
    }

    /**
     * @description  Calculates the supplyRatePerBlock matissa using the fomula below
     *
     *    oneMinusReserveFactor = scale - reserveFactor
     *
     *    rateToPool = borrowRate * oneMinusReserveFactor / scale
     *
     *    supplyRatePerBlock =  rateToPool * utilizationRate / poolRateDenominator
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale  The exponential scale all the matissa's are in
     * @param blockMultiplier Rate line slope, order of magnitude of scale.
     * @param blockBaseRate Per-block interest rate, order of magnitude of scale.
     * @param reserveFactor Reserve share order of magnitude of scale.
     * @returns supplyRatePerBlock as bigInt.BigInteger
     */
    function _calcSupplyRate(
        loans: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        scale: bigInt.BigInteger,
        blockMultiplier: bigInt.BigInteger,
        blockBaseRate: bigInt.BigInteger,
        reserveFactor: bigInt.BigInteger,
    ): bigInt.BigInteger {
        const _scale = bigInt(scale);

        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);
        const borrowRate = _calcBorrowRate(loans, balance, reserves, scale, blockMultiplier, blockBaseRate);
        const oneMinusReserveFactor = _scale.minus(reserveFactor);

        const rateToPool = borrowRate.multiply(oneMinusReserveFactor).divide(scale);

        return rateToPool.multiply(utilizationRate).divide(scale);
    }

    /**
     * @description Calculates the exchange rate based on the formula :
     * ( underlyingBalance + totalBorrows - reserves ) / totalSupply
     *
     * @param adjustment TODO
     * @param initialExhangeRateMantissa  Initial exchangeRate's mantissa
     * @param balance Underlying balance of the collateral token.
     * @param borrows Total amount of borrowed assets of a given collateral token.
     * @param reserves Reserves of the collateral token.
     * @param totalSupply Total supply of the Ftoken.
     * @param expScale The scale all the mantissa's are in.
     * @returns exchangeRate as BigNumber
     */
    function _calcExchangeRateAdjusted(
        adjustment: number,
        initialExhangeRateMantissa: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        borrows: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        totalSupply: bigInt.BigInteger,
        expScale: bigInt.BigInteger,
    ): BigNumber {
        const _adjustment = bigInt(adjustment);
        if (bigInt(totalSupply).greater(0)) {
            const _cash = bigInt(balance).minus(adjustment);
            const _num = _cash.add(borrows).minus(reserves);
            const _zero = bigInt(0);
            const _exchangeRate = new BigNumber(_num.toString()).div(totalSupply.toString());
            return _exchangeRate;
        } else {
            return new BigNumber(initialExhangeRateMantissa.toString()).div(expScale.toString());
        }
    }

    /**
     * @description Applies the exchange rate and returns underlying based on the formula :
     *
     *  underlyingBalance = exchangeRate * ftokenBalance
     *
     * @param ftokenBalance Amount of FTokens a user has
     * @param exchangeRate  The exchange rate for the token.
     * @param expScale The scale all the mantissa's are in.
     * @returns underlyingBalance  as BigNumber
     */
    function _calcApplyExchangeRate(
        ftokenBalance: bigInt.BigInteger,
        exchangeRate: BigNumber,
        expScale: bigInt.BigInteger,
    ): BigNumber {
        const underlyingBalance = new BigNumber(ftokenBalance.toString()).multipliedBy(exchangeRate);
        return underlyingBalance;
    }

    /**
     * @description get the no. of blocks created in a single day (24hrs)
     * @param {number} blocksPerMinute - the number of blocks per minute
     */
    function _blocksPerDay(blocksPerMinute: number) {
        return Math.round(24 * 60 * blocksPerMinute);
    }

    /**
     * @description Calculates the APY from the Supply or Borrow rate
     * @param rate Periodic (per-block) supply or borrow interest rate.
     * @param blocksPerDay 24*60*4.
     * @param noOfDaysInYear 365.
     * @returns annualrate APY rate Mantissa as BigInteger.
     */
    function _calcAnnualizedRate(
        rate: bigInt.BigInteger,
        expScale: bigInt.BigInteger,
        blocksPerDay = _blocksPerDay(6),
        noOfDaysInYear = 365,
    ): bigInt.BigInteger {
        // https://docs.compound.finance/v2/#protocol-math
        // APY = ((((Rate / Mantissa * Blocks Per Day + 1) ^ Days Per Year)) - 1) * 100
        const apyrate = new BigNumber(rate.toString())
            .multipliedBy(blocksPerDay)
            .div(expScale.toString())
            .plus(1)
            .pow(noOfDaysInYear)
            .minus(1)
            .multipliedBy(expScale.toString())
            .toFixed(0);
        return bigInt(apyrate);
    }

    /**
     * @description Calculates the interest accrued from the last accrual block to the current block.
     *              The storage is modified to reflect the application of DoAccrueInterest in the contract.
     * @param borrowRate Periodic (per-block) borrow interest rate.
     * @param blockLevel Current block level.
     * @param storage FToken storage.
     * @returns storage FToken storage.
     */
    export function SimulateAccrueInterest(
        borrowRate: bigInt.BigInteger,
        blockLevel: number,
        storage: Storage,
    ): Storage {
        if (borrowRate > storage.borrow.borrowRateMaxMantissa) {
            return storage;
        }
        const blockDelta = blockLevel - storage.accrualBlockNumber;
        const simpleInterestFactor = borrowRate.multiply(blockDelta);
        const interestAccumulated = simpleInterestFactor.multiply(storage.borrow.totalBorrows).divide(storage.expScale);
        storage.borrow.totalBorrows = storage.borrow.totalBorrows.plus(interestAccumulated);
        storage.totalReserves = storage.reserveFactorMantissa
            .multiply(interestAccumulated)
            .divide(storage.expScale)
            .add(storage.totalReserves);
        storage.borrow.borrowIndex = simpleInterestFactor
            .multiply(storage.borrow.borrowIndex)
            .divide(storage.expScale)
            .add(storage.borrow.borrowIndex);
        storage.accrualBlockNumber = blockLevel;
        return storage;
    }

    /** @description Creates a function that Calculates the total outstanding borrow repay amount.
     *  @param  loanPrincipal Total amount of borrowed assets of a given collateral token.
     *  @param  loanInterestIndex Borrow index of the loan.
     *  @param  storage FToken storage.
     *  @returns The total outstanding borrow repay amount as bigInt.BigInteger
     **/
    export function getTotalBorrowRepayAmount(
        loanPrincipal: bigInt.BigInteger,
        loanInterestIndex: bigInt.BigInteger,
        storage: Storage,
    ): bigInt.BigInteger {
        const principalPlusInterest = _applyBorrowInterestToPrincipal(
            loanPrincipal,
            loanInterestIndex,
            storage.borrow.borrowIndex,
        );
        return principalPlusInterest;
    }

    /** @description Calculates the interest accrued from the last accrual block to the current block,
     *               by applying Index Adjustment to the principal.
     *   @param  loanPrincipal Total amount of borrowed assets of a given collateral token.
     *   @param  loanInterestIndex Borrow index of the loan.
     *   @param currentBorrowIndex Current borrow index.
     *   @returns (loan + interestAccumulated) as bigInt.BigInteger
     **/
    function _applyBorrowInterestToPrincipal(
        loanPrincipal: bigInt.BigInteger,
        loanInterestIndex: bigInt.BigInteger,
        currentBorrowIndex: bigInt.BigInteger,
    ): bigInt.BigInteger {
        if (loanInterestIndex.eq(0)) {
            return bigInt(0);
        }
        const principalTimesIndex = loanPrincipal.multiply(currentBorrowIndex);
        return principalTimesIndex.divide(loanInterestIndex);
    }

    /*
     * @description
     *
     * @param assetType
     * @param supplyBalanceUnderlying Total underlying token amount supplied, fTokenBalance * exchangeRate
     * @param supplyBalanceUsd Total USD value of funds supplied
     * @param loanBalanceUnderlying Total underlying token amount borrowed
     * @param loanBalanceUsd Total USD value of funds borrowed
     * @param collateral True if market is collateralized, false otherwise
     * @param loanPrincipal Total amount of borrowed assets for an account
     * @param loanInterestIndex Borrow index of the loan.
     */
    export interface Balance {
        assetType: AssetType;
        approvals?: { [address: string]: bigInt.BigInteger };
        supplyBalanceUnderlying: bigInt.BigInteger;
        supplyBalanceUsd?: bigInt.BigInteger;
        loanBalanceUnderlying: bigInt.BigInteger;
        loanBalanceUsd?: bigInt.BigInteger;
        collateral?: boolean;
        loanPrincipal: bigInt.BigInteger;
        loanInterestIndex: bigInt.BigInteger;
    }

    export type BalanceMap = { [assetType: string]: Balance };

    /*
     * @description
     *
     * @param
     */
    export async function GetBalance(
        account: string,
        assetType: AssetType,
        currentIndex: bigInt.BigInteger,
        balancesMapId: number,
        server: string,
    ): Promise<Balance> {
        try {
            const balanceResult = await queryBalance(account, balancesMapId, server);
            return parseBalanceResult(balanceResult, currentIndex, assetType);
        } catch (e) {
            return parseBalanceResult({}, currentIndex, assetType);
        }
    }

    /*
     * @description
     *
     * @param
     */
    export const normalizeToIndex = {
        supply: function (
            amount: bigInt.BigInteger,
            prevIndex: bigInt.BigInteger,
            currentIndex: bigInt.BigInteger,
        ): bigInt.BigInteger {
            return amount;
        },
        borrow: function (
            amount: bigInt.BigInteger,
            prevIndex: bigInt.BigInteger,
            currentIndex: bigInt.BigInteger,
        ): bigInt.BigInteger {
            if (bigInt(prevIndex).eq(0)) {
                return bigInt(0);
            }
            return amount.multiply(currentIndex.divide(prevIndex));
        },
    };
    borrow: {
      numBorrowers?: number;
      totalBorrows: bigInt.BigInteger;
      borrowIndex: bigInt.BigInteger;
      borrowRateMaxMantissa: bigInt.BigInteger;
      borrowRatePerBlock: bigInt.BigInteger;
    };
    comptrollerAddress: string;
    expScale: bigInt.BigInteger;
    halfExpScale: bigInt.BigInteger;
    initialExchangeRateMantissa: bigInt.BigInteger;
    protocolSeizeShareMantissa: bigInt.BigInteger;
    interestRateModel: string;
    pendingAdministrator: string | undefined;
    reserveFactorMantissa: bigInt.BigInteger;
    reserveFactorMaxMantissa: bigInt.BigInteger;
    totalReserves: bigInt.BigInteger;
    currentCash: bigInt.BigInteger;
  }

  /*
   * @description
   *
   * @param
   * @param
   */
  export async function GetStorage(
    fTokenAddress: string,
    underlying: UnderlyingAsset,
    server: string,
    type: TokenStandard
  ): Promise<Storage> {
    switch (type) {
      case TokenStandard.FA12: {
        const storageResult = await TezosNodeReader.getContractStorage(
          server,
          fTokenAddress
        );
        const balancesMapId = JSONPath({
          path: "$.args[0].args[0].args[0].args[2].int",
          json: storageResult,
        })[0];
        const adminJsonPrase = JSONPath({
          path: "$.args[0].args[1].args[2].prim",
          json: storageResult,
        })[0];
        const pendingAdministrator: string | undefined =
          adminJsonPrase === "None" ? undefined : adminJsonPrase;
        const protocolSeizeShareMantissa = JSONPath({
          path: "$.args[0].args[1].args[3].int",
          json: storageResult,
        })[0];
        const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(
          underlying,
          fTokenAddress,
          server
        );
        // TODO: implement numSuppliers and numBorrowers
        // get numSuppliers
        // const suppliersQuery = makeSuppliersQuery(balancesMapId);
        // get numBorrowers
        // const borrowersQuery = makeBorrowersQuery(balancesMapId);
        return {
          accrualBlockNumber: JSONPath({
            path: "$.args[0].args[0].args[0].args[0].args[0].int",
            json: storageResult,
          })[0],
          administrator: JSONPath({
            path: "$.args[0].args[0].args[0].args[1].string",
            json: storageResult,
          })[0],
          balancesMapId: balancesMapId,
          supply: {
            totalSupply: bigInt(
              JSONPath({
                path: "$.args[0].args[5].int",
                json: storageResult,
              })[0]
            ),
            supplyRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[2].args[2].int",
                json: storageResult,
              })[0]
            ),
          },
          borrow: {
            totalBorrows: bigInt(
              JSONPath({
                path: "$.args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowIndex: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowRateMaxMantissa: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[0].int",
                json: storageResult,
              })[0]
            ),
            borrowRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[1].int",
                json: storageResult,
              })[0]
            ),
          },
          protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
          comptrollerAddress: JSONPath({
            path: "$.args[0].args[0].args[1].args[2].string",
            json: storageResult,
          })[0],
          expScale: bigInt(
            JSONPath({
              path: "$.args[0].args[0].args[3].int",
              json: storageResult,
            })[0]
          ),
          halfExpScale: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[0].args[0].int",
              json: storageResult,
            })[0]
          ),
          initialExchangeRateMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[0].args[1].int",
              json: storageResult,
            })[0]
          ),
          interestRateModel: JSONPath({
            path: "$.args[0].args[1].args[1].string",
            json: storageResult,
          })[0],
          pendingAdministrator: pendingAdministrator,
          reserveFactorMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[2].args[0].int",
              json: storageResult,
            })[0]
          ),
          reserveFactorMaxMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[2].args[1].int",
              json: storageResult,
            })[0]
          ),
          totalReserves: bigInt(
            JSONPath({ path: "$.args[0].args[4].int", json: storageResult })[0]
          ),
          currentCash: cash,
        };
      }
      case TokenStandard.FA2: {
        const storageResult = await TezosNodeReader.getContractStorage(
          server,
          fTokenAddress
        );
        const balancesMapId = JSONPath({
          path: "$.args[0].args[0].args[0].args[2].int",
          json: storageResult,
        })[0];
        const adminJsonPrase = JSONPath({
          path: "$.args[0].args[1].args[1].prim",
          json: storageResult,
        })[0];
        const pendingAdministrator: string | undefined =
          adminJsonPrase === "None" ? undefined : adminJsonPrase;
        const protocolSeizeShareMantissa = JSONPath({
          path: "$.args[0].args[1].args[2].int",
          json: storageResult,
        })[0];
        const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(
          underlying,
          fTokenAddress,
          server
        );
        // TODO: implement numSuppliers and numBorrowers
        // get numSuppliers
        // const suppliersQuery = makeSuppliersQuery(balancesMapId);
        // get numBorrowers
        // const borrowersQuery = makeBorrowersQuery(balancesMapId);
        return {
          accrualBlockNumber: JSONPath({
            path: "$.args[0].args[0].args[0].args[0].args[0].int",
            json: storageResult,
          })[0],
          administrator: JSONPath({
            path: "$.args[0].args[0].args[0].args[1].string",
            json: storageResult,
          })[0],
          balancesMapId: balancesMapId,
          supply: {
            totalSupply: bigInt(
              JSONPath({
                path: "$.args[0].args[5].int",
                json: storageResult,
              })[0]
            ),
            supplyRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[2].args[1].int",
                json: storageResult,
              })[0]
            ),
          },
          borrow: {
            totalBorrows: bigInt(
              JSONPath({
                path: "$.args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowIndex: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowRateMaxMantissa: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[0].int",
                json: storageResult,
              })[0]
            ),
            borrowRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[1].int",
                json: storageResult,
              })[0]
            ),
          },
          protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
          comptrollerAddress: JSONPath({
            path: "$.args[0].args[0].args[1].args[2].string",
            json: storageResult,
          })[0],
          expScale: bigInt(
            JSONPath({
              path: "$.args[0].args[0].args[3].int",
              json: storageResult,
            })[0]
          ),
          halfExpScale: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[0].args[0].int",
              json: storageResult,
            })[0]
          ),
          initialExchangeRateMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[0].args[1].int",
              json: storageResult,
            })[0]
          ),
          interestRateModel: JSONPath({
            path: "$.args[0].args[1].args[0].args[2].string",
            json: storageResult,
          })[0],
          pendingAdministrator: pendingAdministrator,
          reserveFactorMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[3].int",
              json: storageResult,
            })[0]
          ),
          reserveFactorMaxMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[2].args[0].int",
              json: storageResult,
            })[0]
          ),
          totalReserves: bigInt(
            JSONPath({ path: "$.args[0].args[4].int", json: storageResult })[0]
          ),
          currentCash: cash,
        };
      }
      case TokenStandard.XTZ: {
        const storageResult = await TezosNodeReader.getContractStorage(
          server,
          fTokenAddress
        );
        const balancesMapId = JSONPath({
          path: "$.args[0].args[0].args[0].args[2].int",
          json: storageResult,
        })[0];
        const adminJsonPrase = JSONPath({
          path: "$.args[0].args[1].args[1].prim",
          json: storageResult,
        })[0];
        const pendingAdministrator: string | undefined =
          adminJsonPrase === "None" ? undefined : adminJsonPrase;
        const spendableBalance =
          await TezosNodeReader.getSpendableBalanceForAccount(
            server,
            fTokenAddress
          );
        const protocolSeizeShareMantissa = JSONPath({
          path: "$.args[0].args[1].args[2].int",
          json: storageResult,
        })[0];

        // TODO: implement numSuppliers and numBorrowers
        // get numSuppliers
        // const suppliersQuery = makeSuppliersQuery(balancesMapId);
        // get numBorrowers
        // const borrowersQuery = makeBorrowersQuery(balancesMapId);
        return {
          accrualBlockNumber: JSONPath({
            path: "$.args[0].args[0].args[0].args[0].args[0].int",
            json: storageResult,
          })[0],
          administrator: JSONPath({
            path: "$.args[0].args[0].args[0].args[1].string",
            json: storageResult,
          })[0],
          balancesMapId: balancesMapId,
          supply: {
            totalSupply: bigInt(
              JSONPath({
                path: "$.args[0].args[5].int",
                json: storageResult,
              })[0]
            ),
            supplyRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[2].args[1].int",
                json: storageResult,
              })[0]
            ),
          },
          borrow: {
            totalBorrows: bigInt(
              JSONPath({
                path: "$.args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowIndex: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[0].args[3].int",
                json: storageResult,
              })[0]
            ),
            borrowRateMaxMantissa: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[0].int",
                json: storageResult,
              })[0]
            ),
            borrowRatePerBlock: bigInt(
              JSONPath({
                path: "$.args[0].args[0].args[1].args[1].int",
                json: storageResult,
              })[0]
            ),
          },
          protocolSeizeShareMantissa: bigInt(protocolSeizeShareMantissa),
          comptrollerAddress: JSONPath({
            path: "$.args[0].args[0].args[2].string",
            json: storageResult,
          })[0],
          expScale: bigInt(
            JSONPath({
              path: "$.args[0].args[0].args[3].int",
              json: storageResult,
            })[0]
          ),
          halfExpScale: bigInt(
            JSONPath({
              path: "$.args[0].args[0].args[4].int",
              json: storageResult,
            })[0]
          ),
          initialExchangeRateMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[0].args[0].int",
              json: storageResult,
            })[0]
          ),
          interestRateModel: JSONPath({
            path: "$.args[0].args[1].args[0].args[1].string",
            json: storageResult,
          })[0],
          pendingAdministrator: pendingAdministrator,
          reserveFactorMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[1].args[3].int",
              json: storageResult,
            })[0]
          ),
          reserveFactorMaxMantissa: bigInt(
            JSONPath({
              path: "$.args[0].args[2].args[0].int",
              json: storageResult,
            })[0]
          ),
          totalReserves: bigInt(
            JSONPath({ path: "$.args[0].args[4].int", json: storageResult })[0]
          ),
          currentCash: bigInt(spendableBalance),
        };
      }
    }
  }

  /*
   * @description TODO
   *
   * @param
   */
  export function makeSuppliersQuery(balancesMapId: number): ConseilQuery {
    let suppliersQuery = ConseilQueryBuilder.blankQuery();
    suppliersQuery = ConseilQueryBuilder.addFields(
      suppliersQuery,
      "key",
      "value",
      "operation_group_id"
    );
    suppliersQuery = ConseilQueryBuilder.addPredicate(
      suppliersQuery,
      "big_map_id",
      ConseilOperator.EQ,
      [balancesMapId]
    );
    // TODO: get all values with value.balance > 0
    suppliersQuery = ConseilQueryBuilder.setLimit(suppliersQuery, 10_000);
    return suppliersQuery;
  }

  /*
   * @description TODO
   *
   * @param
   */
  export function makeBorrowersQuery(balancesMapId: number): ConseilQuery {
    let borrowersQuery = ConseilQueryBuilder.blankQuery();
    borrowersQuery = ConseilQueryBuilder.addFields(
      borrowersQuery,
      "key",
      "value",
      "operation_group_id"
    );
    borrowersQuery = ConseilQueryBuilder.addPredicate(
      borrowersQuery,
      "big_map_id",
      ConseilOperator.EQ,
      [balancesMapId]
    );
    // TODO: get all values with value.principal > 0
    borrowersQuery = ConseilQueryBuilder.setLimit(borrowersQuery, 10_000);
    return borrowersQuery;
  }

  /*
   * @description
   *
   * @param storage
   */
  export function GetCash(storage: Storage): bigInt.BigInteger {
    return bigInt(0); // storage.supply.totalSupply.minus(storage.borrow.totalBorrows.minus(storage.totalReserves));
  }

  /**
   * @description Given a token storage,it returns the  exchangeRate with 0 adjustment but correct precision
   *
   * @param ftokenBalance The ammount of FTokens
   * @param storage The FToken storage
   * @returns underlyingBalance as BigNumber
   */
  export function applyExchangeRate(
    ftokenBalance: bigInt.BigInteger,
    storage: Storage
  ): BigNumber {
    const exchangeRate = getExchangeRate(storage);

    return _calcApplyExchangeRate(
      ftokenBalance,
      exchangeRate,
      storage.expScale
    );
  }

  /**
   * @description Given a token storage,it returns the  exchangeRate with 0 adjustment but correct precision
   *
   * @param storage The FToken storage
   * @returns exchangeRate as BigNumber
   */
  export function getExchangeRate(storage: Storage): BigNumber {
    const expScale = Decimal.log(storage.expScale.toString());
    const log10 = Decimal.log(10);
    const decimalPlaces = expScale.div(log10);

    const exchangeRate = _calcExchangeRateAdjusted(
      0,
      storage.initialExchangeRateMantissa,
      storage.currentCash,
      storage.borrow.totalBorrows,
      storage.totalReserves,
      storage.supply.totalSupply,
      storage.expScale
    );
    return new BigNumber(
      exchangeRate.toFixed(parseInt(decimalPlaces.toString()))
    );
  }

  /**
   * @description   Once the supplyRate Mantissa is calculated, The APY mantissa
   *                is computed and  multiplied by 100 to get APY percent.
   *
   *
   *
   * @param storage FToken storage.
   * @param irStorage InterestRateModel storage.
   * @returns supplyApy percent Mantissa as bigInt.BigInteger
   */
  export function getSupplyRateApy(
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): bigInt.BigInteger {
    const _blockRate = getSupplyRate(storage, irStorage);
    return _calcAnnualizedRate(_blockRate, irStorage.scale).multiply(100);
  }

  /**
   * @description  The rate calculation here is based on the getSupplyRate
   *               function of the InterestRateModel contract.
   *
   * @param storage FToken storage.
   * @param irStorage InterestRateModel storage.
   * @returns supplyRate Mantissa as bigInt.BigInteger
   */
  export function getSupplyRate(
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): bigInt.BigInteger {
    return _calcSupplyRate(
      storage.borrow.totalBorrows,
      storage.currentCash,
      storage.totalReserves,
      irStorage.scale,
      irStorage.blockMultiplier,
      irStorage.blockRate,
      storage.reserveFactorMantissa
    );
  }

  /**
   * @description  The rate calculation here is based on the getBorrowRate
   *                function of the InterestRateModel contract.
   *
   * @param storage FToken storage.
   * @param irStorage InterestRateModel storage.
   * @returns borrowRate  Mantissa as bigInt.BigInteger
   */
  export function getBorrowRate(
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): bigInt.BigInteger {
    return _calcBorrowRate(
      storage.borrow.totalBorrows,
      storage.currentCash,
      storage.totalReserves,
      irStorage.scale,
      irStorage.blockMultiplier,
      irStorage.blockRate
    );
  }

  /**
   * @description   Once the borrowRate Mantissa is calculated, The APY mantissa
   *                is computed and multiplied by 100 to get APY percent.
   *
   * @param storage FToken storage.
   * @param irStorage InterestRateModel storage.
   * @returns borrowAPY percent Mantissa as bigInt.BigInteger
   */
  export function getBorrowRateApy(
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): bigInt.BigInteger {
    const _blockRate = getBorrowRate(storage, irStorage);

    if (_blockRate.greaterOrEquals(storage.borrow.borrowRateMaxMantissa)) {
      return _calcAnnualizedRate(
        storage.borrow.borrowRateMaxMantissa,
        irStorage.scale
      ).multiply(100);
    }

    return _calcAnnualizedRate(_blockRate, irStorage.scale).multiply(100);
  }

  /**
   * @description  Get the dynamic borrow rate apy function, that takes the additional amount to be borrowed
   *               and adds it to total borrows to calculate the borrow rate apy.
   *
   *
   * @param storage FToken storage.
   * @param irStorage InterestRateModel storage.
   * @returns a function that takes the amount to be borrowed and returns the borrowAPY percent Mantissa as bigInt.BigInteger
   */

  export function getDynamicBorrowRateApyFn(
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): (borrowAmount: bigInt.BigInteger) => bigInt.BigInteger {
    return (additionalAmount: bigInt.BigInteger) => {
      const _storage = {
        ...storage,
        borrow: {
          ...storage.borrow,
          totalBorrows: storage.borrow.totalBorrows.plus(additionalAmount),
        },
      };
      return getBorrowRateApy(_storage, irStorage);
    };
  }

  /**
   * @description  Calculates the borrowRatePerBlock matissa as per the contract code using the fomula:
   *
   *  borrowRatePerBlock = (utilizationRate * blockMultiplier / scale) + blockBaseRate
   *
   * @param loans Total amount of borrowed assets of a given collateral token.
   * @param balance Underlying balance of the collateral token.
   * @param reserves Reserves of the collateral token.
   * @param scale  the exponential scale all the mantissa's are in
   * @param blockmultiplier rate line slope, order of magnitude of scale.
   * @param blockbaserate per-block interest rate, order of magnitude of scale.
   * @returns borrowrateperblock as bigInt.BigInteger
   */
  function _calcBorrowRate(
    loans: bigInt.BigInteger,
    balance: bigInt.BigInteger,
    reserves: bigInt.BigInteger,
    scale: bigInt.BigInteger,
    blockMultiplier: bigInt.BigInteger,
    blockBaseRate: bigInt.BigInteger
  ): bigInt.BigInteger {
    const utilizationRate = _calcUtilizationRate(
      loans,
      balance,
      reserves,
      scale
    );

    return utilizationRate
      .multiply(blockMultiplier)
      .divide(scale)
      .plus(blockBaseRate);
  }

  /**
   * @description Calculates the utilizationRate as per the contract code using this formula:
   *
   *  utilizationRate = (loan * scale) / ( balance + loans - reserves)
   *
   * @param loans Total amount of borrowed assets of a given collateral token.
   * @param balance Underlying balance of the collateral token.
   * @param reserves Reserves of the collateral token.
   * @param scale  The exponential scale all the matissa's are in
   * @returns utilizationRate as BigInteger
   */
  function _calcUtilizationRate(
    loans: bigInt.BigInteger,
    balance: bigInt.BigInteger,
    reserves: bigInt.BigInteger,
    scale: bigInt.BigInteger
  ): bigInt.BigInteger {
    if (loans.lesserOrEquals(0)) {
      return bigInt.zero;
    }

    const divisor = balance.plus(loans).minus(reserves);

    if (divisor.eq(0)) {
      return bigInt.zero;
    }

    const utilizationRate = loans.multiply(scale).divide(divisor);

    return utilizationRate;
  }

  /**
   * @description  Calculates the supplyRatePerBlock matissa using the fomula below
   *
   *    oneMinusReserveFactor = scale - reserveFactor
   *
   *    rateToPool = borrowRate * oneMinusReserveFactor / scale
   *
   *    supplyRatePerBlock =  rateToPool * utilizationRate / poolRateDenominator
   *
   * @param loans Total amount of borrowed assets of a given collateral token.
   * @param balance Underlying balance of the collateral token.
   * @param reserves Reserves of the collateral token.
   * @param scale  The exponential scale all the matissa's are in
   * @param blockMultiplier Rate line slope, order of magnitude of scale.
   * @param blockBaseRate Per-block interest rate, order of magnitude of scale.
   * @param reserveFactor Reserve share order of magnitude of scale.
   * @returns supplyRatePerBlock as bigInt.BigInteger
   */
  function _calcSupplyRate(
    loans: bigInt.BigInteger,
    balance: bigInt.BigInteger,
    reserves: bigInt.BigInteger,
    scale: bigInt.BigInteger,
    blockMultiplier: bigInt.BigInteger,
    blockBaseRate: bigInt.BigInteger,
    reserveFactor: bigInt.BigInteger
  ): bigInt.BigInteger {
    const _scale = bigInt(scale);

    const utilizationRate = _calcUtilizationRate(
      loans,
      balance,
      reserves,
      scale
    );
    const borrowRate = _calcBorrowRate(
      loans,
      balance,
      reserves,
      scale,
      blockMultiplier,
      blockBaseRate
    );
    const oneMinusReserveFactor = _scale.minus(reserveFactor);

    const rateToPool = borrowRate.multiply(oneMinusReserveFactor).divide(scale);

    return rateToPool.multiply(utilizationRate).divide(scale);
  }

  /**
   * @description Calculates the exchange rate based on the formula :
   * ( underlyingBalance + totalBorrows - reserves ) / totalSupply
   *
   * @param adjustment TODO
   * @param initialExhangeRateMantissa  Initial exchangeRate's mantissa
   * @param balance Underlying balance of the collateral token.
   * @param borrows Total amount of borrowed assets of a given collateral token.
   * @param reserves Reserves of the collateral token.
   * @param totalSupply Total supply of the Ftoken.
   * @param expScale The scale all the mantissa's are in.
   * @returns exchangeRate as BigNumber
   */
  function _calcExchangeRateAdjusted(
    adjustment: number,
    initialExhangeRateMantissa: bigInt.BigInteger,
    balance: bigInt.BigInteger,
    borrows: bigInt.BigInteger,
    reserves: bigInt.BigInteger,
    totalSupply: bigInt.BigInteger,
    expScale: bigInt.BigInteger
  ): BigNumber {
    const _adjustment = bigInt(adjustment);
    if (bigInt(totalSupply).greater(0)) {
      const _cash = bigInt(balance).minus(adjustment);
      const _num = _cash.add(borrows).minus(reserves);
      const _zero = bigInt(0);
      const _exchangeRate = new BigNumber(_num.toString()).div(
        totalSupply.toString()
      );
      return _exchangeRate;
    } else {
      return new BigNumber(initialExhangeRateMantissa.toString()).div(
        expScale.toString()
      );
    }
  }

  /**
   * @description Applies the exchange rate and returns underlying based on the formula :
   *
   *  underlyingBalance = exchangeRate * ftokenBalance
   *
   * @param ftokenBalance Amount of FTokens a user has
   * @param exchangeRate  The exchange rate for the token.
   * @param expScale The scale all the mantissa's are in.
   * @returns underlyingBalance  as BigNumber
   */
  function _calcApplyExchangeRate(
    ftokenBalance: bigInt.BigInteger,
    exchangeRate: BigNumber,
    expScale: bigInt.BigInteger
  ): BigNumber {
    const underlyingBalance = new BigNumber(
      ftokenBalance.toString()
    ).multipliedBy(exchangeRate);
    return underlyingBalance;
  }

  /**
   * @description get the no. of blocks created in a single day (24hrs)
   * @param {number} blocksPerMinute - the number of blocks per minute
   */
  function _blocksPerDay(blocksPerMinute: number) {
    return Math.round(24 * 60 * blocksPerMinute);
  }

  /**
   * @description Calculates the APY from the Supply or Borrow rate
   * @param rate Periodic (per-block) supply or borrow interest rate.
   * @param blocksPerDay 24*60*4.
   * @param noOfDaysInYear 365.
   * @returns annualrate APY rate Mantissa as BigInteger.
   */
  function _calcAnnualizedRate(
    rate: bigInt.BigInteger,
    expScale: bigInt.BigInteger,
    blocksPerDay = _blocksPerDay(4),
    noOfDaysInYear = 365
  ): bigInt.BigInteger {
    // https://docs.compound.finance/v2/#protocol-math
    // APY = ((((Rate / Mantissa * Blocks Per Day + 1) ^ Days Per Year)) - 1) * 100
    const apyrate = new BigNumber(rate.toString())
      .multipliedBy(blocksPerDay)
      .div(expScale.toString())
      .plus(1)
      .pow(noOfDaysInYear)
      .minus(1)
      .multipliedBy(expScale.toString())
      .toFixed(0);
    return bigInt(apyrate);
  }

  /**
   * @description Calculates the interest accrued from the last accrual block to the current block.
   *              The storage is modified to reflect the application of DoAccrueInterest in the contract.
   * @param borrowRate Periodic (per-block) borrow interest rate.
   * @param blockLevel Current block level.
   * @param storage FToken storage.
   * @returns storage FToken storage.
   */
  function _calcAccrueInterest(
    borrowRate: bigInt.BigInteger,
    blockLevel: number,
    storage: Storage
  ): Storage {
    if (borrowRate > storage.borrow.borrowRateMaxMantissa) {
      return storage;
    }
    const blockDelta = blockLevel - storage.accrualBlockNumber;
    const simpleInterestFactor = borrowRate.multiply(blockDelta);
    const interestAccumulated = simpleInterestFactor
      .multiply(storage.borrow.totalBorrows)
      .divide(storage.expScale);
    storage.borrow.totalBorrows =
      storage.borrow.totalBorrows.plus(interestAccumulated);
    storage.totalReserves = storage.reserveFactorMantissa
      .multiply(interestAccumulated)
      .divide(storage.expScale)
      .add(storage.totalReserves);
    storage.borrow.borrowIndex = simpleInterestFactor
      .multiply(storage.borrow.borrowIndex)
      .divide(storage.expScale)
      .add(storage.borrow.borrowIndex);
    storage.accrualBlockNumber = blockLevel;
    return storage;
  }

  /** @description Creates a function that Calculates the total outstanding borrow repay amount by simulating the accrual of interest up to
   *             the current block level plus an error block delta.
   *  @param  loanPrincipal Total amount of borrowed assets of a given collateral token.
   *  @param  loanInterestIndex Borrow index of the loan.
   *  @param  currentBlockLevel Current block level.
   *  @param  storage FToken storage.
   *  @param  irStorage InterestRateModel storage.
   *  @returns  a function that takes an error block delta and returns the total outstanding borrow repay amount as bigInt.BigInteger
   **/
  export function getTotalBorrowRepayAmountBlockDeltaFn(
    loanPrincipal: bigInt.BigInteger,
    loanInterestIndex: bigInt.BigInteger,
    currentBlockLevel: number,
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): (errorAsBlockDelta: number) => bigInt.BigInteger {
    return (errorAsBlockDelta: number = 0) => {
      return _calcTotalOutstandingBorrowRepayAmount(
        currentBlockLevel + 1 + errorAsBlockDelta,
        loanPrincipal,
        loanInterestIndex,
        storage,
        irStorage
      );
    };
  }
  /** @description Calculates the total outstanding borrow repay amount by
   *             simulating the accrual of interest up to the expected block level the repay will be made.
   *  @param  expectedBlockLevel Expected block level at which the borrow will be repaid.
   *  @param  borrowPrincipal Total amount of borrowed assets of a given collateral token.
   *  @param  borrowInterestIndex Borrow index of the loan.
   *  @param  storage FToken storage.
   *  @param  irStorage InterestRateModel storage.
   *  @returns (loan + interestAccumulated) as bigInt.BigInteger
   **/
  function _calcTotalOutstandingBorrowRepayAmount(
    expectedBlockLevel: number,
    borrowPrincipal: bigInt.BigInteger,
    borrowInterestIndex: bigInt.BigInteger,
    storage: Storage,
    irStorage: InterestRateModel.Storage
  ): bigInt.BigInteger {
    const borrowRate = getBorrowRate(storage, irStorage);
    const storageAfterAccrue = _calcAccrueInterest(
      borrowRate,
      expectedBlockLevel,
      storage
    );
    const principalPlusInterest = _applyBorrowInterestToPrincipal(
      borrowPrincipal,
      borrowInterestIndex,
      storageAfterAccrue.borrow.borrowIndex
    );
    return principalPlusInterest;
  }

  /** @description Calculates the interest accrued from the last accrual block to the current block,
   *               by applying Index Adjustment to the principal.
   *   @param  loanPrincipal Total amount of borrowed assets of a given collateral token.
   *   @param  loanInterestIndex Borrow index of the loan.
   *   @param currentBorrowIndex Current borrow index.
   *   @returns (loan + interestAccumulated) as bigInt.BigInteger
   **/
  function _applyBorrowInterestToPrincipal(
    loanPrincipal: bigInt.BigInteger,
    loanInterestIndex: bigInt.BigInteger,
    currentBorrowIndex: bigInt.BigInteger
  ): bigInt.BigInteger {
    if (loanInterestIndex.eq(0)) {
      return bigInt(0);
    }
    const principalTimesIndex = loanPrincipal.multiply(currentBorrowIndex);
    return principalTimesIndex.divide(loanInterestIndex);
  }

  /*
   * @description
   *
   * @param assetType
   * @param supplyBalanceUnderlying Total underlying token amount supplied, fTokenBalance * exchangeRate
   * @param supplyBalanceUsd Total USD value of funds supplied
   * @param loanBalanceUnderlying Total underlying token amount borrowed
   * @param loanBalanceUsd Total USD value of funds borrowed
   * @param collateral True if market is collateralized, false otherwise
   * @param loanPrincipal Total amount of borrowed assets for an account
   * @param loanInterestIndex Borrow index of the loan.
   */
  export interface Balance {
    assetType: AssetType;
    approvals?: { [address: string]: bigInt.BigInteger };
    supplyBalanceUnderlying: bigInt.BigInteger;
    supplyBalanceUsd?: bigInt.BigInteger;
    loanBalanceUnderlying: bigInt.BigInteger;
    loanBalanceUsd?: bigInt.BigInteger;
    collateral?: boolean;
    loanPrincipal: bigInt.BigInteger;
    loanInterestIndex: bigInt.BigInteger;
  }

  export type BalanceMap = { [assetType: string]: Balance };

  /*
   * @description
   *
   * @param
   */
  export async function GetBalance(
    account: string,
    assetType: AssetType,
    currentIndex: bigInt.BigInteger,
    balancesMapId: number,
    server: string
  ): Promise<Balance> {
    try {
      const balanceResult = await queryBalance(account, balancesMapId, server);
      return parseBalanceResult(balanceResult, currentIndex, assetType);
    } catch (e) {
      return parseBalanceResult({}, currentIndex, assetType);
    }
  }

  /*
   * @description
   *
   * @param
   */
  export const normalizeToIndex = {
    supply: function (
      amount: bigInt.BigInteger,
      prevIndex: bigInt.BigInteger,
      currentIndex: bigInt.BigInteger
    ): bigInt.BigInteger {
      return amount;
    },
    borrow: function (
      amount: bigInt.BigInteger,
      prevIndex: bigInt.BigInteger,
      currentIndex: bigInt.BigInteger
    ): bigInt.BigInteger {
      if (bigInt(prevIndex).eq(0)) {
        return bigInt(0);
      }
      return amount.multiply(currentIndex.divide(prevIndex));
    },
  };

  /*
   * @description Queries a big_map for a value associated with an address-type key.
   */
  async function queryBalance(
    account: string,
    balancesMapId: number,
    server: string
  ): Promise<any> {
    const packedKey = TezosMessageUtils.encodeBigMapKey(
      Buffer.from(TezosMessageUtils.writePackedData(account, "address"), "hex")
    );
    const mapResult = await TezosNodeReader.getValueForBigMapKey(
      server,
      balancesMapId,
      packedKey
    );

    return mapResult || {};
  }

  /*
   * @description
   *
   * @parameters
   */
  export function parseBalanceResult(
    balanceInfo: any,
    currentIndex: bigInt.BigInteger,
    assetType: AssetType
  ): Balance {
    const borrowIndex =
      JSONPath({ path: "$.args[0].args[0].int", json: balanceInfo })[0] || 0;
    const borrowPrincipal =
      JSONPath({ path: "$.args[0].args[1].int", json: balanceInfo })[0] || 0;
    const supplyPrincipal =
      JSONPath({ path: "$.args[2].int", json: balanceInfo })[0] || 0;

    // TODO: parse approvals
    // return 0 balance if uninitialized in contract
    return {
      assetType: assetType,
      supplyBalanceUnderlying:
        supplyPrincipal === undefined
          ? bigInt(0)
          : normalizeToIndex.supply(
              bigInt(supplyPrincipal),
              bigInt(1_000_000),
              currentIndex
            ),
      loanBalanceUnderlying:
        borrowPrincipal === undefined
          ? bigInt(0)
          : normalizeToIndex.borrow(
              bigInt(borrowPrincipal),
              borrowIndex,
              currentIndex
            ),
      loanPrincipal:
        borrowPrincipal === undefined ? bigInt(0) : bigInt(borrowPrincipal),
      loanInterestIndex:
        borrowIndex === undefined ? bigInt(0) : bigInt(borrowIndex),
    };
  }

  /*
   * @description Return the operation for invoking the accrueInterest entrypoint of the given fToken address
   *
   * @param counter Current account counter
   * @param fTokenAddress The relevant FToken contract address
   * @param keyStore
   * @param fee
   * @param gas
   * @param freight
   */
  export function AccrueInterestOpGroup(
    collaterals: AssetType[],
    protocolAddresses: ProtocolAddresses,
    counter: number,
    pkh: string,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction[] {
    const entrypoint = "accrueInterest";
    const parameters = "Unit";
    let ops: Transaction[] = [];
    for (const collateral of collaterals) {
      ops.push(
        TezosNodeWriter.constructContractInvocationOperation(
          pkh,
          counter,
          protocolAddresses.fTokens[collateral],
          0,
          0,
          freight,
          gas,
          entrypoint,
          parameters,
          TezosParameterFormat.Michelson
        )
      );
    }
    return ops;
  }

  /*
   * Invoke only the accrueInterest entrypoint.
   *
   * @param
   */
  export async function AccrueInterest(
    markets: AssetType[],
    protocolAddresses: ProtocolAddresses,
    server: string,
    signer: Signer,
    keystore: KeyStore,
    fee: number,
    gas: number = 200_000,
    freight: number = 20_000
  ): Promise<string> {
    // get account counter
    const counter = await TezosNodeReader.getCounterForAccount(
      server,
      keystore.publicKeyHash
    );
    let ops: Transaction[] = AccrueInterestOpGroup(
      markets,
      protocolAddresses,
      counter,
      keystore.publicKeyHash,
      gas,
      freight
    );
    const opGroup = await TezosNodeWriter.prepareOperationGroup(
      server,
      keystore,
      counter,
      ops,
      true
    );
    // send operation
    const operationResult = await TezosNodeWriter.sendOperation(
      server,
      opGroup,
      signer
    );
    return TezosContractUtils.clearRPCOperationGroupHash(
      operationResult.operationGroupID
    );
  }

  /*
   * Mint entrypoint parameters
   *
   * @param amount The amount to fTokens to mint
   */
  export interface MintPair {
    underlying: AssetType;
    amount: number;
  }

  /*
   * Liquidate entrypoint parameters
   *
   */
  export interface LiquidateDetails {
    supplyCollateral: AssetType;
    seizeCollateral: AssetType;
    borrower: string;
    amount: number;
  }

  /*
   * Convert MintPair to Michelson string
   *
   * @param
   */
  export function MintPairMichelson(mint: MintPair): string {
    return `${mint.amount}`;
  }

  /*
   * Returns the operation for invoking the mint entrypoint of the given fToken address
   *
   * @param mint Invocation parameters
   * @param counter Current account counter
   * @param fTokenAddress The relevant FToken contract address
   * @param keyStore
   * @param fee
   * @param gas
   * @param freight
   */
  export function MintOperation(
    mint: MintPair,
    counter: number,
    fTokenAddress: string,
    pkh: string,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction {
    const entrypoint = "mint";
    const parameters = MintPairMichelson(mint);
    const xtzAmount = mint.underlying == AssetType.XTZ ? mint.amount : 0;

    return TezosNodeWriter.constructContractInvocationOperation(
      pkh,
      counter,
      fTokenAddress,
      xtzAmount,
      0,
      freight,
      gas,
      entrypoint,
      parameters,
      TezosParameterFormat.Michelson
    );
  }

  export function LiquidateOperation(
    details: LiquidateDetails,
    counter: number,
    protocolAddresses: ProtocolAddresses,
    pkh: string,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction {
    const entrypoint = "liquidateBorrow";
    const parameters = `(Pair "${details.borrower}"(Pair "${
      protocolAddresses.fTokens[details.seizeCollateral]
    }" ${details.amount}))`;
    const xtzAmount =
      details.supplyCollateral == AssetType.XTZ ? details.amount : 0;

    return TezosNodeWriter.constructContractInvocationOperation(
      pkh,
      counter,
      protocolAddresses.fTokens[details.supplyCollateral],
      xtzAmount,
      0,
      freight,
      gas,
      entrypoint,
      parameters,
      TezosParameterFormat.Michelson
    );
  }

  /*
   * Redeem entrypoint parameters
   *
   * @param amount The amount of fTokens to redeem
   */
  export interface RedeemPair {
    underlying: AssetType;
    amount: number;
    amountInUnderlying: boolean | undefined;
  }

  /*
   * Description
   *
   * @param
   */
  function RedeemPairMichelson(redeem: RedeemPair): string {
    return `${redeem.amount}`;
  }

  /*
   * Description
   *
   * @param
   */
  export function RedeemOperation(
    redeem: RedeemPair,
    counter: number,
    fTokenAddress: string,
    pkh: string,
    fee: number,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction {
    let entrypoint = "redeem";
    if (redeem.amountInUnderlying === true) {
      entrypoint = "redeemUnderlying";
    }
    const parameters = RedeemPairMichelson(redeem);
    return TezosNodeWriter.constructContractInvocationOperation(
      pkh,
      counter,
      fTokenAddress,
      0,
      fee,
      freight,
      gas,
      entrypoint,
      parameters,
      TezosParameterFormat.Michelson
    );
  }

  /*
   * Description
   *
   * @param
   */
  export interface BorrowPair {
    underlying: AssetType;
    amount: number;
  }

  /*
   * Description
   *
   * @param
   */
  export function BorrowPairMichelson(borrow: BorrowPair): string {
    return `${borrow.amount}`;
  }

  /*
   * Description
   *
   * @param
   */
  export function BorrowOperation(
    borrow: BorrowPair,
    counter: number,
    fTokenAddress: string,
    pkh: string,
    fee: number,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction {
    const entrypoint = "borrow";
    const parameters = BorrowPairMichelson(borrow);
    return TezosNodeWriter.constructContractInvocationOperation(
      pkh,
      counter,
      fTokenAddress,
      0,
      fee,
      freight,
      gas,
      entrypoint,
      parameters,
      TezosParameterFormat.Michelson
    );
  }

  /*
   * Description
   *
   * @param
   */
  export interface RepayBorrowPair {
    underlying: AssetType;
    amount: number;
  }

  /*
   * Description
   *
   * @param
   */
  export function RepayBorrowPairMichelson(
    repayBorrow: RepayBorrowPair
  ): string {
    return `${repayBorrow.amount}`;
  }

  /*
   * Description
   *
   * @param
   */
  export function RepayBorrowOperation(
    repayBorrow: RepayBorrowPair,
    counter: number,
    fTokenAddress: string,
    pkh: string,
    fee: number,
    gas: number = 200_000,
    freight: number = 20_000
  ): Transaction {
    const entrypoint = "repayBorrow";
    const parameters = RepayBorrowPairMichelson(repayBorrow);
    const xtzAmount =
      repayBorrow.underlying == AssetType.XTZ ? repayBorrow.amount : 0;

    return TezosNodeWriter.constructContractInvocationOperation(
      pkh,
      counter,
      fTokenAddress,
      xtzAmount,
      fee,
      freight,
      gas,
      entrypoint,
      parameters,
      TezosParameterFormat.Michelson
    );
  }
}

import { AssetType, TokenStandard } from './enum';
import { ConseilOperator, ConseilQuery, ConseilQueryBuilder, KeyStore, Signer, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Transaction } from 'conseiljs';

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
    export async function GetStorage(fTokenAddress: string, underlying: UnderlyingAsset, server: string, type: TokenStandard): Promise<Storage> {
        switch (type) {
            case TokenStandard.FA12: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({ path: '$.args[0].args[0].args[0].args[2].int', json: storageResult })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[2].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === "None" ? undefined : adminJsonPrase;
                const protocolSeizeShareMantissa = JSONPath({ path: '$.args[0].args[1].args[3].int', json: storageResult })[0];
                const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(underlying, fTokenAddress, server);
                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({ path: '$.args[0].args[0].args[0].args[0].args[0].int', json: storageResult })[0],
                    administrator: JSONPath({ path: '$.args[0].args[0].args[0].args[1].string', json: storageResult })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[2].args[2].int', json: storageResult })[0])
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0]),
                        borrowRateMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0]),
                        borrowRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0])
                    },
                    comptrollerAddress: JSONPath({ path: '$.args[0].args[0].args[1].args[2].string', json: storageResult })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0]),
                    initialExchangeRateMantissa: bigInt(JSONPath({ path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0]),
                    interestRateModel: JSONPath({ path: '$.args[0].args[1].args[1].string', json: storageResult })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0]),
                    reserveFactorMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0]),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: cash
                };
            }
            case TokenStandard.FA2: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({ path: '$.args[0].args[0].args[0].args[2].int', json: storageResult })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[1].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === "None" ? undefined : adminJsonPrase;
                const protocolSeizeShareMantissa = JSONPath({ path: '$.args[0].args[1].args[2].int', json: storageResult })[0];
                const cash = await TezosLendingPlatform.GetUnderlyingBalanceToken(underlying, fTokenAddress, server);
                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({ path: '$.args[0].args[0].args[0].args[0].args[0].int', json: storageResult })[0],
                    administrator: JSONPath({ path: '$.args[0].args[0].args[0].args[1].string', json: storageResult })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0])
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0]),
                        borrowRateMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0]),
                        borrowRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0])
                    },
                    comptrollerAddress: JSONPath({ path: '$.args[0].args[0].args[1].args[2].string', json: storageResult })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0]),
                    initialExchangeRateMantissa: bigInt(JSONPath({ path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0]),
                    interestRateModel: JSONPath({ path: '$.args[0].args[1].args[0].args[2].string', json: storageResult })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(JSONPath({ path: '$.args[0].args[1].args[3].int', json: storageResult })[0]),
                    reserveFactorMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0]),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: cash
                };
            }
            case TokenStandard.XTZ: {
                const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
                const balancesMapId = JSONPath({ path: '$.args[0].args[0].args[0].args[2].int', json: storageResult })[0];
                const adminJsonPrase = JSONPath({ path: '$.args[0].args[1].args[1].prim', json: storageResult })[0];
                const pendingAdministrator: string | undefined = adminJsonPrase === "None" ? undefined : adminJsonPrase;
                const spendableBalance = await TezosNodeReader.getSpendableBalanceForAccount(server, fTokenAddress);
                const protocolSeizeShareMantissa = JSONPath({ path: '$.args[0].args[1].args[2].int', json: storageResult })[0];
                
                // TODO: implement numSuppliers and numBorrowers
                // get numSuppliers
                // const suppliersQuery = makeSuppliersQuery(balancesMapId);
                // get numBorrowers
                // const borrowersQuery = makeBorrowersQuery(balancesMapId);
                return {
                    accrualBlockNumber: JSONPath({ path: '$.args[0].args[0].args[0].args[0].args[0].int', json: storageResult })[0],
                    administrator: JSONPath({ path: '$.args[0].args[0].args[0].args[1].string', json: storageResult })[0],
                    balancesMapId: balancesMapId,
                    supply: {
                        totalSupply: bigInt(JSONPath({ path: '$.args[0].args[5].int', json: storageResult })[0]),
                        supplyRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[2].args[1].int', json: storageResult })[0])
                    },
                    borrow: {
                        totalBorrows: bigInt(JSONPath({ path: '$.args[0].args[3].int', json: storageResult })[0]),
                        borrowIndex: bigInt(JSONPath({ path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0]),
                        borrowRateMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0]),
                        borrowRatePerBlock: bigInt(JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0])
                    },
                    comptrollerAddress: JSONPath({ path: '$.args[0].args[0].args[2].string', json: storageResult })[0],
                    expScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0]),
                    halfExpScale: bigInt(JSONPath({ path: '$.args[0].args[0].args[4].int', json: storageResult })[0]),
                    initialExchangeRateMantissa: bigInt(JSONPath({ path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0]),
                    interestRateModel: JSONPath({ path: '$.args[0].args[1].args[0].args[1].string', json: storageResult })[0],
                    pendingAdministrator: pendingAdministrator,
                    reserveFactorMantissa: bigInt(JSONPath({ path: '$.args[0].args[1].args[3].int', json: storageResult })[0]),
                    reserveFactorMaxMantissa: bigInt(JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0]),
                    totalReserves: bigInt(JSONPath({ path: '$.args[0].args[4].int', json: storageResult })[0]),
                    currentCash: bigInt(spendableBalance)
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
        suppliersQuery = ConseilQueryBuilder.addPredicate(suppliersQuery, 'big_map_id', ConseilOperator.EQ, [balancesMapId]);
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
        borrowersQuery = ConseilQueryBuilder.addPredicate(borrowersQuery, 'big_map_id', ConseilOperator.EQ, [balancesMapId]);
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

	    const exchangeRate = _calcExchangeRateAdjusted(0, storage.initialExchangeRateMantissa, storage.currentCash, storage.borrow.totalBorrows , storage.totalReserves, storage.supply.totalSupply, storage.expScale);
	    return new BigNumber(exchangeRate.toFixed(parseInt(decimalPlaces.toString())))
    }

    /*
     * @description The rate calculation here is based on the getSupplyRate function of the InterestRateModel contract.
     *
     * @param storage
     */
    export function GetSupplyRate(storage: Storage, irStorage: InterestRateModel.Storage): BigNumber {
        const _blockRate = _calcSupplyRate(storage.borrow.totalBorrows, storage.currentCash, storage.totalReserves, irStorage.scale, irStorage.blockMultiplier, irStorage.blockRate, storage.reserveFactorMantissa);

        return _calcAnnualizedRate(_blockRate, irStorage.scale);
    }

    /*
     * @description  The rate calculation here is based on the getBorrowRate function of the InterestRateModel contract.
     *
     * @param storage
     */
    export function GetBorrowRate(storage: Storage, irStorage: InterestRateModel.Storage): BigNumber {
	    
        const _blockRate = _calcBorrowRate(storage.borrow.totalBorrows, storage.currentCash, storage.totalReserves, irStorage.scale, irStorage.blockMultiplier, irStorage.blockRate);

        return _calcAnnualizedRate(_blockRate, irStorage.scale);
    }

    /**
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale Token decimals, 18 for Eth, 8 for BTC, 6 for XTZ, expressed as 1e<decimals>.
     * @param blockMultiplier Rate line slope, order of magnitude of scale.
     * @param blockBaseRate Per-block interest rate, order of magnitude of scale.
     * @returns
     */
    function _calcBorrowRate(loans, balance, reserves, scale, blockMultiplier, blockBaseRate) {
        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);

        const _blockMultiplier = bigInt(blockMultiplier);
        const _blockBaseRate = bigInt(blockBaseRate);
        const _scale = bigInt(scale);

        const r = utilizationRate.multiply(_blockMultiplier).divide(_scale).plus(_blockBaseRate);

        return r;
    }

    /**
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale Token decimals, 18 for Eth, 8 for BTC, 6 for XTZ, expressed as 1e<decimals>.
     * @returns
     */
	function _calcUtilizationRate(loans, balance, reserves, scale): bigInt.BigInteger {
        const _loans = bigInt(loans);

        if (_loans.eq(0)) { return bigInt.zero; }

        const _balance = bigInt(balance);
        const _reserves = bigInt(reserves);
        const _scale = bigInt(scale);

	const _divisor = _balance.plus(_loans).minus(reserves);

        const urate = _loans.multiply(_scale).divide(_divisor);

        return urate;
    }

    /**
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale Token decimals, 18 for Eth, 8 for BTC, 6 for XTZ, expressed as 1e<decimals>.
     * @param blockMultiplier Rate line slope, order of magnitude of scale.
     * @param blockBaseRate Per-block interest rate, order of magnitude of scale.
     * @param reserveFactor Reserve share order of magnitude of scale.
     * @returns
     */
    function _calcSupplyRate(loans, balance, reserves, scale, blockMultiplier, blockBaseRate, reserveFactor) {
        const _scale = bigInt(scale)

        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);
        const borrowRate = _calcBorrowRate(loans, balance, reserves, scale, blockMultiplier, blockBaseRate)
        const poolShare = _scale.minus(reserveFactor);

        const poolRateNumerator = borrowRate.multiply(poolShare).multiply(utilizationRate);
        const poolRateDenominator = _scale.multiply(_scale);

        return poolRateNumerator.divide(poolRateDenominator);
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
	function _calcExchangeRateAdjusted(adjustment: number, initialExhangeRateMantissa: bigInt.BigInteger, balance: bigInt.BigInteger, borrows: bigInt.BigInteger, reserves: bigInt.BigInteger, totalSupply: bigInt.BigInteger, expScale: bigInt.BigInteger ): BigNumber {
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
	function _calcApplyExchangeRate(ftokenBalance: bigInt.BigInteger, exchangeRate: BigNumber, expScale: bigInt.BigInteger ): BigNumber {
		const underlyingBalance = new BigNumber(ftokenBalance.toString()).multipliedBy(exchangeRate);
		return underlyingBalance;
    }
    
     /**
     * @description Takes the exponential scale and returns the implied precision as number :
     *
     *  precision = log(expScale) / log(logBase)
     *
     * @param expScale The scale all the mantissa's are in.
     * @returns precision as number
     */
     export  function getPrecision(expScale: bigInt.BigInteger): number {

	    const _expScale = Decimal.log(expScale.toString());
	    const log10 = Decimal.log(10);
	    const decimalPlaces = _expScale.div(log10).round();

	    return parseInt(decimalPlaces.toString())

	}

    /**
     *
     * @param rate Periodic (per-block) interest rate.
     * @param annualPeriods 365.25*24*60*2.
     * @returns Annual rate as a percentage.
     */
	function _calcAnnualizedRate(rate: bigInt.BigInteger, expScale: bigInt.BigInteger, annualPeriods = 1051920): BigNumber {
        const _precision = getPrecision(expScale);
	const _rate = new BigNumber(rate.toString());//.div(expScale.toString());
	const _annualPeriods = new BigNumber(annualPeriods);
	const _apyRate = _rate.multipliedBy(annualPeriods).div(expScale.toString()).decimalPlaces(_precision);
        const apyPercent = _apyRate.multipliedBy(100);


        return apyPercent //_apyBorrow.div(expScale.toString()).decimalPlaces(_precision);
        //return _apyBorrow.div(expScale.toString()).decimalPlaces(_precision);
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
     */
    export interface Balance {
        assetType: AssetType;
        approvals?: { [address: string]: bigInt.BigInteger };
        supplyBalanceUnderlying: bigInt.BigInteger;
        supplyBalanceUsd?: bigInt.BigInteger;
        loanBalanceUnderlying: bigInt.BigInteger;
        loanBalanceUsd?: bigInt.BigInteger;
        collateral?: boolean;
    }

    export type BalanceMap = { [assetType: string]: Balance };

    /*
     * @description
     *
     * @param
     */
    export async function GetBalance(account: string, assetType: AssetType, currentIndex: bigInt.BigInteger, balancesMapId: number, server: string): Promise<Balance> {
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
        supply : function (amount: bigInt.BigInteger, prevIndex: bigInt.BigInteger, currentIndex: bigInt.BigInteger): bigInt.BigInteger {
            return amount;
        },
        borrow : function (amount: bigInt.BigInteger, prevIndex: bigInt.BigInteger, currentIndex: bigInt.BigInteger): bigInt.BigInteger {
            if (bigInt(prevIndex).eq(0)) { return bigInt(0); }
            return amount.multiply(currentIndex.divide(prevIndex));
        }
    }

    /*
     * @description Queries a big_map for a value associated with an address-type key.
     */
    async function queryBalance(account: string, balancesMapId: number, server: string): Promise<any> {
        const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(account, 'address'), 'hex'));
        const mapResult = await TezosNodeReader.getValueForBigMapKey(server, balancesMapId, packedKey);

        return mapResult || {};
    }

    /*
     * @description
     *
     * @parameters
     */
    export function parseBalanceResult(balanceInfo: any, currentIndex: bigInt.BigInteger, assetType: AssetType): Balance {
        const borrowIndex = JSONPath({ path: '$.args[0].args[0].int', json: balanceInfo })[0] || 0;
        const borrowPrincipal = JSONPath({ path: '$.args[0].args[1].int', json: balanceInfo })[0] || 0;
        const supplyPrincipal = JSONPath({ path: '$.args[2].int', json: balanceInfo })[0] || 0;

        // TODO: parse approvals
        // return 0 balance if uninitialized in contract
        return {
            assetType: assetType,
            supplyBalanceUnderlying: supplyPrincipal === undefined ? bigInt(0) : normalizeToIndex.supply(bigInt(supplyPrincipal), bigInt(1_000_000), currentIndex),
            loanBalanceUnderlying: borrowPrincipal === undefined ? bigInt(0) : normalizeToIndex.borrow(bigInt(borrowPrincipal), borrowIndex, currentIndex)
        }
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
    export function AccrueInterestOpGroup(collaterals: AssetType[], protocolAddresses: ProtocolAddresses, counter: number, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        const entrypoint = 'accrueInterest';
        const parameters = 'Unit'
        let ops: Transaction[] = [];
        for (const collateral of collaterals) {
            ops.push(TezosNodeWriter.constructContractInvocationOperation(pkh, counter, protocolAddresses.fTokens[collateral], 0, 0, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson));
        }
        return ops;
    }

    /*
     * Invoke only the accrueInterest entrypoint.
     *
     * @param
     */
    export async function AccrueInterest(markets: AssetType[], protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = AccrueInterestOpGroup(markets, protocolAddresses, counter, keystore.publicKeyHash, gas, freight);
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
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
    export function MintOperation(mint: MintPair, counter: number, fTokenAddress: string, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'mint';
        const parameters = MintPairMichelson(mint);
        const xtzAmount = mint.underlying == AssetType.XTZ ? mint.amount : 0;

        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, xtzAmount, 0, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
    }

    /*
     * Redeem entrypoint parameters
     *
     * @param amount The amount of fTokens to redeem
     */
    export interface RedeemPair {
        underlying: AssetType;
        amount: number;
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
    export function RedeemOperation(redeem: RedeemPair, counter: number, fTokenAddress: string, pkh: string, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'redeem';
        const parameters = RedeemPairMichelson(redeem);
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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
    export function BorrowOperation(borrow: BorrowPair, counter: number, fTokenAddress: string, pkh: string, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'borrow';
        const parameters = BorrowPairMichelson(borrow);
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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
    export function RepayBorrowPairMichelson(repayBorrow: RepayBorrowPair): string {
        return `${repayBorrow.amount}`;
    }

    /*
     * Description
     *
     * @param
     */
    export function RepayBorrowOperation(repayBorrow: RepayBorrowPair, counter: number, fTokenAddress: string, pkh: string, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'repayBorrow';
        const parameters = RepayBorrowPairMichelson(repayBorrow);
        const xtzAmount = repayBorrow.underlying == AssetType.XTZ ? repayBorrow.amount : 0;

        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, xtzAmount, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
    }
}

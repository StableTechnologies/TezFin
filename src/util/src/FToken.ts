import { TransferParams } from '@taquito/taquito';
import { packDataBytes, unpackDataBytes } from '@taquito/michel-codec';
import { encodeExpr } from '@taquito/utils';
import { getContract, getToolkit } from './toolkit';
import { AssetType, TokenStandard } from './enum';
import BigNumber from 'bignumber.js';
import { InterestRateModel } from './contracts/InterestRateModel';
import { Network, ProtocolAddresses, UnderlyingAsset } from './types';
import bigInt from 'big-integer';
import Decimal from 'decimal.js';
import { blocksPerMinute } from './const';
import log from 'loglevel';

export namespace FToken {

    export interface Storage {
        accrualBlockNumber: number;
        administrator: string;
        supply: {
            totalSupply: bigInt.BigInteger;
            supplyRatePerBlock: bigInt.BigInteger;
        };
        borrow: {
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

    /**
     * Read fToken storage using Taquito contract.storage() auto-deserialization.
     */
    export async function GetStorage(
        fTokenAddress: string,
        underlying: UnderlyingAsset,
        server: string,
        _type: TokenStandard,
    ): Promise<Storage> {
        const contract = await getContract(server, fTokenAddress);
        const storage: any = await contract.storage();

        // Get underlying cash held by the fToken contract
        let currentCash: bigInt.BigInteger;
        if (underlying.tokenStandard === TokenStandard.XTZ) {
            const toolkit = getToolkit(server);
            const balance = await toolkit.tz.getBalance(fTokenAddress);
            currentCash = bigInt(balance.toString());
        } else {
            currentCash = await getUnderlyingBalance(underlying, fTokenAddress, server);
        }

        return {
            accrualBlockNumber: Number(storage.accrualBlockNumber.toString()),
            administrator: storage.administrator,
            supply: {
                totalSupply: bigInt(storage.totalSupply.toString()),
                supplyRatePerBlock: bigInt(storage.supplyRatePerBlock.toString()),
            },
            borrow: {
                totalBorrows: bigInt(storage.totalBorrows.toString()),
                borrowIndex: bigInt(storage.borrowIndex.toString()),
                borrowRateMaxMantissa: bigInt(storage.borrowRateMaxMantissa.toString()),
                borrowRatePerBlock: bigInt(storage.borrowRatePerBlock.toString()),
            },
            comptrollerAddress: storage.comptroller,
            expScale: bigInt(storage.expScale.toString()),
            halfExpScale: bigInt(storage.halfExpScale.toString()),
            initialExchangeRateMantissa: bigInt(storage.initialExchangeRateMantissa.toString()),
            protocolSeizeShareMantissa: bigInt(storage.protocolSeizeShareMantissa.toString()),
            interestRateModel: storage.interestRateModel,
            pendingAdministrator: storage.pendingAdministrator || undefined,
            reserveFactorMantissa: bigInt(storage.reserveFactorMantissa.toString()),
            reserveFactorMaxMantissa: bigInt(storage.reserveFactorMaxMantissa.toString()),
            totalReserves: bigInt(storage.totalReserves.toString()),
            currentCash,
        };
    }

    // --- Balance reading ---
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

    /**
     * Get account balance in a given fToken market using BigMap.get().
     */
    export async function GetBalance(
        account: string,
        assetType: AssetType,
        currentIndex: bigInt.BigInteger,
        fTokenAddress: string,
        server: string,
    ): Promise<Balance> {
        try {
            const contract = await getContract(server, fTokenAddress);
            const storage: any = await contract.storage();

            let supplyBalance = bigInt(0);
            let borrowPrincipal = bigInt(0);
            let borrowIndex = bigInt(0);

            // Read ledger (supply balance)
            const ledgerEntry = await storage.ledger.get(account);
            if (ledgerEntry) {
                supplyBalance = bigInt(ledgerEntry.balance.toString());
            }

            // Read borrows
            const borrowEntry = await storage.borrows.get(account);
            if (borrowEntry) {
                borrowPrincipal = bigInt(borrowEntry.principal.toString());
                borrowIndex = bigInt(borrowEntry.interestIndex.toString());
            }

            return {
                assetType,
                supplyBalanceUnderlying: supplyBalance,
                loanBalanceUnderlying: borrowIndex.eq(0)
                    ? bigInt(0)
                    : borrowPrincipal.multiply(currentIndex).divide(borrowIndex),
                loanPrincipal: borrowPrincipal,
                loanInterestIndex: borrowIndex,
            };
        } catch (e) {
            return {
                assetType,
                supplyBalanceUnderlying: bigInt(0),
                loanBalanceUnderlying: bigInt(0),
                loanPrincipal: bigInt(0),
                loanInterestIndex: bigInt(0),
            };
        }
    }

    export const normalizeToIndex = {
        supply: function (
            amount: bigInt.BigInteger,
            _prevIndex: bigInt.BigInteger,
            _currentIndex: bigInt.BigInteger,
        ): bigInt.BigInteger {
            return amount;
        },
        borrow: function (
            amount: bigInt.BigInteger,
            prevIndex: bigInt.BigInteger,
            currentIndex: bigInt.BigInteger,
        ): bigInt.BigInteger {
            if (bigInt(prevIndex).eq(0)) return bigInt(0);
            return amount.multiply(currentIndex.divide(prevIndex));
        },
    };

    // --- Pure math functions ---

    export function GetCash(_storage: Storage): bigInt.BigInteger {
        return bigInt(0);
    }

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
    export function getSupplyRateApy(storage: Storage, irStorage: InterestRateModel.Storage, network: Network): bigInt.BigInteger {
        const _blockRate = getSupplyRate(storage, irStorage);
        return _calcAnnualizedRate(_blockRate, irStorage.scale, _blocksPerDay(blocksPerMinute[network])).multiply(100);
    }

    export function getSupplyRate(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        return _calcSupplyRate(
            storage.borrow.totalBorrows,
            storage.currentCash,
            storage.totalReserves,
            irStorage.scale,
            irStorage.blockMultiplier,
            irStorage.blockRate,
            irStorage.jumpMultiplier,
            irStorage.kink,
            storage.reserveFactorMantissa,
        );
    }

    export function getBorrowRate(storage: Storage, irStorage: InterestRateModel.Storage): bigInt.BigInteger {
        return _calcBorrowRate(
            storage.borrow.totalBorrows,
            storage.currentCash,
            storage.totalReserves,
            irStorage.scale,
            irStorage.blockMultiplier,
            irStorage.blockRate,
            irStorage.jumpMultiplier,
            irStorage.kink,
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
    export function getBorrowRateApy(storage: Storage, irStorage: InterestRateModel.Storage, network: Network): bigInt.BigInteger {
        const _blockRate = getBorrowRate(storage, irStorage);

        if (_blockRate.greaterOrEquals(storage.borrow.borrowRateMaxMantissa)) {
            return _calcAnnualizedRate(storage.borrow.borrowRateMaxMantissa, irStorage.scale, _blocksPerDay(blocksPerMinute[network])).multiply(100);
        }

        return _calcAnnualizedRate(_blockRate, irStorage.scale, _blocksPerDay(blocksPerMinute[network])).multiply(100);
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
        network: Network,
    ): (borrowAmount: bigInt.BigInteger) => bigInt.BigInteger {
        return (additionalAmount: bigInt.BigInteger) => {
            const _storage = {
                ...storage,
                borrow: { ...storage.borrow, totalBorrows: storage.borrow.totalBorrows.plus(additionalAmount) },
            };
            return getBorrowRateApy(_storage, irStorage, network);
        };
    }

    export function SimulateAccrueInterest(
        borrowRate: bigInt.BigInteger,
        blockLevel: number,
        storage: Storage,
    ): Storage {
        if (borrowRate > storage.borrow.borrowRateMaxMantissa) return storage;
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

    export function getTotalBorrowRepayAmount(
        loanPrincipal: bigInt.BigInteger,
        loanInterestIndex: bigInt.BigInteger,
        storage: Storage,
    ): bigInt.BigInteger {
        return _applyBorrowInterestToPrincipal(loanPrincipal, loanInterestIndex, storage.borrow.borrowIndex);
    }

    // --- Internal math ---

    /**
     * @description Calculates the borrowRatePerBlock mantissa as per the Jump Rate Model contract code.
     *
     * Before kink: borrowRatePerBlock = (utilizationRate * multiplierPerBlock / scale) + baseRatePerBlock
     * After kink:  borrowRatePerBlock = normalRate + ((utilizationRate - kink) * jumpMultiplierPerBlock / scale)
     *
     * @param loans Total amount of borrowed assets of a given collateral token.
     * @param balance Underlying balance of the collateral token.
     * @param reserves Reserves of the collateral token.
     * @param scale The exponential scale all the mantissa's are in (1e18).
     * @param multiplierPerBlock Rate line slope before kink, order of magnitude of scale.
     * @param baseRatePerBlock Per-block interest rate at 0% utilization, order of magnitude of scale.
     * @param jumpMultiplierPerBlock Rate line slope after kink, order of magnitude of scale.
     * @param kink The utilization point at which the jump multiplier is applied, order of magnitude of scale.
     * @returns borrowRatePerBlock as bigInt.BigInteger
     */
    function _calcBorrowRate(
        loans: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        scale: bigInt.BigInteger,
        multiplierPerBlock: bigInt.BigInteger,
        baseRatePerBlock: bigInt.BigInteger,
        jumpMultiplierPerBlock: bigInt.BigInteger,
        kink: bigInt.BigInteger,
    ): bigInt.BigInteger {
        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);
        if (utilizationRate.lesserOrEquals(kink)) {
            return utilizationRate.multiply(multiplierPerBlock).divide(scale).plus(baseRatePerBlock);
        }
        const normalRate = kink.multiply(multiplierPerBlock).divide(scale).plus(baseRatePerBlock);
        const excessUtil = utilizationRate.minus(kink);
        return excessUtil.multiply(jumpMultiplierPerBlock).divide(scale).plus(normalRate);
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
        if (loans.lesserOrEquals(0)) return bigInt.zero;
        const divisor = balance.plus(loans).minus(reserves);
        if (divisor.eq(0)) return bigInt.zero;
        return loans.multiply(scale).divide(divisor);
    }

    function _calcSupplyRate(
        loans: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        scale: bigInt.BigInteger,
        blockMultiplier: bigInt.BigInteger,
        blockBaseRate: bigInt.BigInteger,
        jumpMultiplierPerBlock: bigInt.BigInteger,
        kink: bigInt.BigInteger,
        reserveFactor: bigInt.BigInteger,
    ): bigInt.BigInteger {
        const utilizationRate = _calcUtilizationRate(loans, balance, reserves, scale);
        const borrowRate = _calcBorrowRate(loans, balance, reserves, scale, blockMultiplier, blockBaseRate, jumpMultiplierPerBlock, kink);
        const oneMinusReserveFactor = bigInt(scale).minus(reserveFactor);
        const rateToPool = borrowRate.multiply(oneMinusReserveFactor).divide(scale);
        return rateToPool.multiply(utilizationRate).divide(scale);
    }

    function _calcExchangeRateAdjusted(
        adjustment: number,
        initialExhangeRateMantissa: bigInt.BigInteger,
        balance: bigInt.BigInteger,
        borrows: bigInt.BigInteger,
        reserves: bigInt.BigInteger,
        totalSupply: bigInt.BigInteger,
        expScale: bigInt.BigInteger,
    ): BigNumber {
        if (bigInt(totalSupply).greater(0)) {
            const _cash = bigInt(balance).minus(adjustment);
            const _num = _cash.add(borrows).minus(reserves);
            return new BigNumber(_num.toString()).div(totalSupply.toString());
        } else {
            return new BigNumber(initialExhangeRateMantissa.toString()).div(expScale.toString());
        }
    }

    function _calcApplyExchangeRate(
        ftokenBalance: bigInt.BigInteger,
        exchangeRate: BigNumber,
        _expScale: bigInt.BigInteger,
    ): BigNumber {
        return new BigNumber(ftokenBalance.toString()).multipliedBy(exchangeRate);
    }

    function _blocksPerDay(blocksPerMin: number) {
        return Math.round(24 * 60 * blocksPerMin);
    }

    function _calcAnnualizedRate(
        rate: bigInt.BigInteger,
        expScale: bigInt.BigInteger,
        blocksPerDay = _blocksPerDay(10),
        noOfDaysInYear = 365,
    ): bigInt.BigInteger {
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

    function _applyBorrowInterestToPrincipal(
        loanPrincipal: bigInt.BigInteger,
        loanInterestIndex: bigInt.BigInteger,
        currentBorrowIndex: bigInt.BigInteger,
    ): bigInt.BigInteger {
        if (loanInterestIndex.eq(0)) return bigInt(0);
        return loanPrincipal.multiply(currentBorrowIndex).divide(loanInterestIndex);
    }

    // --- Operation builders (return TransferParams) ---

    export interface MintPair {
        underlying: AssetType;
        amount: number;
    }

    export interface RedeemPair {
        underlying: AssetType;
        amount: number;
        amountInUnderlying: boolean | undefined;
    }

    export interface BorrowPair {
        underlying: AssetType;
        amount: number;
    }

    export interface RepayBorrowPair {
        underlying: AssetType;
        amount: number;
    }

    export interface LiquidateDetails {
        supplyCollateral: AssetType;
        seizeCollateral: AssetType;
        borrower: string;
        amount: number;
    }

    export function AccrueInterestOpGroup(
        collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        return collaterals.map((asset) => ({
            to: protocolAddresses.fTokens[asset],
            amount: 0,
            mutez: true,
            parameter: { entrypoint: 'accrueInterest', value: { prim: 'Unit' } },
        }));
    }

    export function MintOperation(
        mint: MintPair,
        fTokenAddress: string,
        pkh: string,
    ): TransferParams {
        const xtzAmount = mint.underlying === AssetType.XTZ ? mint.amount : 0;
        return {
            to: fTokenAddress,
            amount: xtzAmount,
            mutez: true,
            parameter: { entrypoint: 'mint', value: { int: String(mint.amount) } },
        };
    }

    export function RedeemOperation(
        redeem: RedeemPair,
        fTokenAddress: string,
        pkh: string,
    ): TransferParams {
        const entrypoint = redeem.amountInUnderlying ? 'redeemUnderlying' : 'redeem';
        return {
            to: fTokenAddress,
            amount: 0,
            mutez: true,
            parameter: { entrypoint, value: { int: String(redeem.amount) } },
        };
    }

    export function BorrowOperation(
        borrow: BorrowPair,
        fTokenAddress: string,
        pkh: string,
    ): TransferParams {
        return {
            to: fTokenAddress,
            amount: 0,
            mutez: true,
            parameter: { entrypoint: 'borrow', value: { int: String(borrow.amount) } },
        };
    }

    export function RepayBorrowOperation(
        repayBorrow: RepayBorrowPair,
        fTokenAddress: string,
        pkh: string,
    ): TransferParams {
        const xtzAmount = repayBorrow.underlying === AssetType.XTZ ? repayBorrow.amount : 0;
        return {
            to: fTokenAddress,
            amount: xtzAmount,
            mutez: true,
            parameter: { entrypoint: 'repayBorrow', value: { int: String(repayBorrow.amount) } },
        };
    }
}

// --- Helper for reading underlying token balance ---

async function getUnderlyingBalance(
    underlying: UnderlyingAsset,
    address: string,
    server: string,
): Promise<bigInt.BigInteger> {
    try {
        if (underlying.tokenStandard === TokenStandard.FA12_PACKED) {
            return await readPackedFA12Balance(underlying, address, server);
        }

        const tokenContract = await getContract(server, underlying.address!);
        const tokenStorage: any = await tokenContract.storage();
        // Different FA1.2/FA2 contracts use different field names for the ledger big_map
        const ledger = tokenStorage.ledger ?? tokenStorage.tokens ?? tokenStorage.balances;

        if (underlying.tokenStandard === TokenStandard.FA12) {
            // FA1.2: ledger big_map keyed by address
            if (!ledger) return bigInt(0);
            const entry = await ledger.get(address);
            if (!entry) return bigInt(0);
            // FA1.2: { balance, approvals } or positional { '0': balance }
            const bal = entry.balance ?? entry['0'] ?? entry;
            return bigInt(bal.toString());
        } else if (underlying.tokenStandard === TokenStandard.FA2) {
            // FA2: ledger big_map keyed by (address, token_id)
            if (!ledger) return bigInt(0);
            const tokenId = underlying.tokenId ?? 0;
            let entry = await ledger.get({ owner: address, token_id: tokenId });
            if (!entry) return bigInt(0);
            return bigInt(entry.toString());
        }
    } catch (e) {
        log.error(`Unable to read balance for ${underlying.assetType} at ${underlying.address}: ${e}`);
    }
    return bigInt(0);
}

/**
 * Read balance from a packed big_map bytes bytes (tzBTC pattern).
 * Key = pack(address), Value = pack(Pair nat (map address nat))
 */
async function readPackedFA12Balance(
    underlying: UnderlyingAsset,
    address: string,
    server: string,
): Promise<bigInt.BigInteger> {
    try {
        const toolkit = getToolkit(server);

        // Pack address to extract raw 22-byte address representation
        // Result structure: 05 0a 00000016 <22 bytes>
        //                   ^^ pack prefix
        //                      ^^ address tag
        //                         ^^^^^^^^ length (22 = 0x16)
        //                                  ^^^^^^^^^ raw address bytes we need
        const addrPacked = packDataBytes(
            { string: address },
            { prim: 'address' }
        );
        // Skip: "05"(1 byte) + "0a"(1 byte) + "00000016"(4 bytes) = 12 hex chars
        const rawAddressHex = addrPacked.bytes.slice(12);

        // Step 1: pack Pair "ledger" <rawAddressHex>
        // tzBTC big_map key schema: pair string bytes
        const innerPacked = packDataBytes(
            {
                prim: 'Pair',
                args: [
                    { string: 'ledger' },
                    { bytes: rawAddressHex }
                ]
            },
            {
                prim: 'pair',
                args: [{ prim: 'string' }, { prim: 'bytes' }]
            }
        );

        // Step 2: pack the Pair result as bytes (big_map key type is `bytes`)
        const outerPacked = packDataBytes(
            { bytes: innerPacked.bytes },
            { prim: 'bytes' }
        );

        // Step 3: compute script_expr hash for RPC lookup
        const keyHash = encodeExpr(outerPacked.bytes);

        const value: any = await toolkit.rpc.getBigMapExpr(
            underlying.balancesMapId!.toString(),
            keyHash,
        );

        if (!value || !value.bytes) return bigInt(0);

        // Unpack the stored value: Pair nat (map address nat)
        // Balance is the nat at args[0]
        const unpacked: any = unpackDataBytes({ bytes: value.bytes });
        const balance = unpacked?.args?.[0]?.int ?? unpacked?.int;
        if (!balance) return bigInt(0);

        return bigInt(balance);
    } catch (e) {
        log.error(`Unable to read packed balance for ${underlying.assetType}: ${e}`);
        return bigInt(0);
    }
}
import { KeyStore, Signer, TezosNodeReader, TezosNodeWriter, TezosContractUtils, Transaction, TezosParameterFormat, ConseilQuery, ConseilQueryBuilder, ConseilOperator, TezosConseilClient, ConseilServerInfo, TezosMessageUtils } from 'conseiljs';
import { TezosLendingPlatform } from './TezosLendingPlatform';
import { JSONPath } from 'jsonpath-plus';
import log from 'loglevel';
import bigInt from 'big-integer';

export namespace FToken {
    /*
     * @description
     *
     * @param
     */
    export interface Storage {
        accrualBlockNumber: number;
        accrualIntPeriodRelevance: number;
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
        isAccrualInterestValid: boolean;
        pendingAdministrator: string | undefined;
        reserveFactorMantissa: bigInt.BigInteger;
        reserveFactorMaxMantissa: bigInt.BigInteger;
        totalReserves: bigInt.BigInteger;
    }

    /*
     * @description
     *
     * @param
     * @param
     */
    export async function GetStorage(fTokenAddress: string, server: string): Promise<Storage> {
        const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
        const balancesMapId = JSONPath({path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0];
        const adminJsonPrase = JSONPath({path: '$.args[0].args[1].args[3].prim', json: storageResult })[0];
        const pendingAdministrator: string | undefined = adminJsonPrase === "None" ? undefined : adminJsonPrase;
        // TODO: implement numSuppliers and numBorrowers
        // get numSuppliers
        // const suppliersQuery = makeSuppliersQuery(balancesMapId);
        // get numBorrowers
        // const borrowersQuery = makeBorrowersQuery(balancesMapId);
        return {
            accrualBlockNumber: JSONPath({path: '$.args[0].args[0].args[0].args[0].args[0].int', json: storageResult })[0],
            accrualIntPeriodRelevance: JSONPath({path: '$.args[0].args[0].args[0].args[0].args[1].int', json: storageResult })[0],
            administrator: JSONPath({path: '$.args[0].args[0].args[0].args[2].string', json: storageResult })[0],
            balancesMapId: balancesMapId,
            supply: {
                totalSupply: bigInt(JSONPath({path: '$.args[0].args[5].int', json: storageResult })[0]),
                supplyRatePerBlock: bigInt(JSONPath({path: '$.args[0].args[2].args[2].int', json: storageResult })[0])
            },
            borrow: {
                totalBorrows: JSONPath({path: '$.args[0].args[3].int', json: storageResult })[0],
                borrowIndex: bigInt(JSONPath({path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0]),
                borrowRateMaxMantissa: bigInt(JSONPath({path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0]),
                borrowRatePerBlock: bigInt(JSONPath({path: '$.args[0].args[0].args[2].int', json: storageResult })[0])
            },
            comptrollerAddress: JSONPath({path: '$.args[0].args[0].args[3].string', json: storageResult })[0],
            expScale: bigInt(JSONPath({path: '$.args[0].args[0].args[4].int', json: storageResult })[0]),
            halfExpScale: bigInt(JSONPath({path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0]),
            initialExchangeRateMantissa: bigInt(JSONPath({path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0]),
            interestRateModel: JSONPath({path: '$.args[0].args[1].args[1].string', json: storageResult })[0],
            isAccrualInterestValid: JSONPath({path: '$.args[0].args[1].args[2].prim', json: storageResult })[0].toString().toLowerCase().startsWith('t'),
            pendingAdministrator: pendingAdministrator,
            reserveFactorMantissa: bigInt(JSONPath({path: '$.args[0].args[2].args[0].int', json: storageResult })[0]),
            reserveFactorMaxMantissa: bigInt(JSONPath({path: '$.args[0].args[2].args[1].int', json: storageResult })[0]),
            totalReserves: bigInt(JSONPath({path: '$.args[0].args[4].int', json: storageResult })[0])
        };
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

    const blocksPerYear = 2*60*24*365;

    /*
     * @description 
     *
     * @param storage
     */
    export function GetCash(storage: Storage): bigInt.BigInteger {
        return storage.supply.totalSupply.minus(storage.borrow.totalBorrows.minus(storage.totalReserves));
    }

    /*
     * @description TODO
     *
     * @param storage
     */
    export function GetExchangeRate(storage: Storage): number {
        return 0.95; // TODO: fix bigInt(1).divide(storage.initialExchangeRateMantissa);
    }

    /*
     * @description TODO
     *
     * @param storage
     */
    export function GetSupplyRate(storage: Storage): number {
        // dailyInterestPaid adjusted by blocksPerYear
        return 4;
    }

    /*
     * @description TODO
     *
     * @param storage
     */
    export function GetBorrowRate(storage: Storage): number {
        return 3;
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
        assetType: TezosLendingPlatform.AssetType;
        approvals?: { [address: string]: bigInt.BigInteger }; // address -> amount map
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
    export async function GetBalance(account: string, assetType: TezosLendingPlatform.AssetType, currentIndex: bigInt.BigInteger, balancesMapId: number, server: string): Promise<Balance> {
        const balanceResult = makeBalanceQuery(account, balancesMapId, server);
        return parseBalanceResult(balanceResult, currentIndex, assetType);
    }

    /*
     * @description
     *
     * @param
     */
    export function normalizeToIndex(amount: bigInt.BigInteger, prevIndex: bigInt.BigInteger, currentIndex: bigInt.BigInteger): bigInt.BigInteger {
        return amount.multiply(currentIndex.divide(prevIndex));
    }

    /*
     * @description TODO
     *
     * @param
     */
    export async function makeBalanceQuery(account: string, balancesMapId: number, server: string): Promise<string> {
        const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(account, 'address'), 'hex'));
        const mapResult = await TezosNodeReader.getValueForBigMapKey(server, balancesMapId, packedKey);

        if (mapResult === undefined) { throw new Error(`Map ${balancesMapId} does not contain a record for ${account}`); }
        return mapResult;
    }

    /*
     * @description
     *
     * @parameters
     */
     export function parseBalanceResult(json, currentIndex: bigInt.BigInteger, assetType: TezosLendingPlatform.AssetType): Balance {
        const borrowIndex = JSONPath({path: '$.args[0].args[0].int', json: json })[0];
        const borrowPrincipal = JSONPath({path: '$.args[0].args[1].int', json: json })[0];
        const supplyPrincipal = JSONPath({path: '$.args[2].int', json: json })[0];
        // TODO: parse approvals
        return {
            assetType: assetType,
            supplyBalanceUnderlying: normalizeToIndex(supplyPrincipal, bigInt(1_000_000), currentIndex),
            loanBalanceUnderlying: normalizeToIndex(borrowPrincipal, borrowIndex, currentIndex)
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
    export function AccrueInterestOpGroup(collaterals: TezosLendingPlatform.AssetType[], protocolAddresses: TezosLendingPlatform.ProtocolAddresses, counter: number, pkh: string, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction[] {
        const entrypoint = 'accrueInterest';
        const parameters = 'Unit'
        let ops: Transaction[] = [];
        for (const collateral of collaterals) {
            ops.push(TezosNodeWriter.constructContractInvocationOperation(pkh, counter, protocolAddresses.fTokens[collateral], 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson));
        }
        return ops;
    }

    /*
     * Invoke only the accrueInterest entrypoint.
     *
     * @param
     */
    export async function AccrueInterest(markets: TezosLendingPlatform.AssetType[], protocolAddresses: TezosLendingPlatform.ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = AccrueInterestOpGroup(markets, protocolAddresses, counter, keystore.publicKeyHash, fee, gas, freight);
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
        underlying: TezosLendingPlatform.AssetType;
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
     * @param counter Current account coutner
     * @param fTokenAddress The relevant FToken contract address
     * @param keyStore
     * @param fee
     * @param gas
     * @param freight
     */
    export function MintOperation(mint: MintPair, counter: number, fTokenAddress: string, pkh: string, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'mint';
        const parameters = MintPairMichelson(mint);
        const xtzAmount = mint.underlying == TezosLendingPlatform.AssetType.XTZ ? mint.amount : 0;
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, xtzAmount, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
    }

    /*
     * Redeem entrypoint parameters
     *
     * @param amount The amount of fTokens to redeem
     */
    export interface RedeemPair {
        underlying: TezosLendingPlatform.AssetType;
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
    export function RedeemOperation(redeem: RedeemPair, counter: number, fTokenAddress: string, pkh: string, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
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
        underlying: TezosLendingPlatform.AssetType;
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
    export function BorrowOperation(borrow: BorrowPair, counter: number, fTokenAddress: string, pkh: string, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
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
        underlying: TezosLendingPlatform.AssetType;
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
    export function RepayBorrowOperation(repayBorrow: RepayBorrowPair, counter: number, fTokenAddress: string, pkh: string, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'repayBorrow';
        const parameters = RepayBorrowPairMichelson(repayBorrow);
        const xtzAmount = repayBorrow.underlying == TezosLendingPlatform.AssetType.XTZ ? repayBorrow.amount : 0;
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, fTokenAddress, xtzAmount, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
    }

    /*
     * Represents an account's fToken state
     *
     * @param balance
     * @param accountBorrows
     * @param approvals
     */
    export interface AccountStatus {
        balance: number;
        accountBorrows: { principal: number; interestIndex: number; }[];
        approvals: { [ address: string]: number };
    }

    /*
     * Get an account's current position in a market
     *
     * @param
     */
    export async function getAccountStatus(fTokenAddress: string, accountAddress: string): Promise<AccountStatus> {
        return {} as AccountStatus;
    }
}

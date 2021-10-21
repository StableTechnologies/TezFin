import { KeyStore, Signer, TezosNodeReader, TezosNodeWriter, TezosContractUtils, Transaction, TezosParameterFormat } from 'conseiljs';
import { TezosLendingPlatform } from './TezosLendingPlatform';
import { JSONPath } from 'jsonpath-plus';

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
        borrowIndex: number;
        borrowRateMaxMantissa: number;
        borrowRatePerBlock: number;
        comptroller: string;
        expScale: number;
        halfExpScale: number;
        initialExchangeRateMantissa: number;
        interestRateModel: string;
        isAccrualInterestValid: boolean;
        pendingAdministrator: string | undefined;
        reserveFactorMantissa: number;
        reserveFactorMaxMantissa: number;
        supplyRatePerBlock: number;
        totalBorrows: number;
        totalReserves: number;
        totalSupply: number;

    }

    /*
     * @description
     *
     * @param
     * @param
     */
    export async function getStorage(server: string, fTokenAddress: string): Promise<Storage> {
        const storageResult = await TezosNodeReader.getContractStorage(server, fTokenAddress);
        return {
            accrualBlockNumber: JSONPath({path: '$.args[0].args[0].args[0].args[0].args[0].int', json: storageResult })[0],
            accrualIntPeriodRelevance: JSONPath({path: '$.args[0].args[0].args[0].args[0].args[1].int', json: storageResult })[0],
            administrator: JSONPath({path: '$.args[0].args[0].args[0].args[2].string', json: storageResult })[0],
            balancesMapId: JSONPath({path: '$.args[0].args[0].args[0].args[3].int', json: storageResult })[0],
            borrowIndex: JSONPath({path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0],
            borrowRateMaxMantissa: JSONPath({path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0],
            borrowRatePerBlock: JSONPath({path: '$.args[0].args[0].args[2].int', json: storageResult })[0],
            comptroller: JSONPath({path: '$.args[0].args[0].args[3].string', json: storageResult })[0],
            expScale: JSONPath({path: '$.args[0].args[0].args[4].int', json: storageResult })[0],
            halfExpScale: JSONPath({path: '$.args[0].args[1].args[0].args[0].int', json: storageResult })[0],
            initialExchangeRateMantissa: JSONPath({path: '$.args[0].args[1].args[0].args[1].int', json: storageResult })[0],
            interestRateModel: JSONPath({path: '$.args[0].args[1].args[1].string', json: storageResult })[0],
            isAccrualInterestValid: JSONPath({path: '$.args[0].args[1].args[2].prim', json: storageResult })[0], // fix to boolean
            pendingAdministrator: JSONPath({path: '$.args[0].args[1].args[3].prim', json: storageResult })[0], // fix optional
            reserveFactorMantissa: JSONPath({path: '$.args[0].args[2].args[0].int', json: storageResult })[0],
            reserveFactorMaxMantissa: JSONPath({path: '$.args[0].args[2].args[1].int', json: storageResult })[0],
            supplyRatePerBlock: JSONPath({path: '$.args[0].args[2].args[2].int', json: storageResult })[0],
            totalBorrows: JSONPath({path: '$.args[0].args[3].int', json: storageResult })[0],
            totalReserves: JSONPath({path: '$.args[0].args[4].int', json: storageResult })[0],
            totalSupply: JSONPath({path: '$.args[0].args[5].int', json: storageResult })[0]
        };
    }

    /*
     * Return the operation for invoking the accrueInterest entrypoint of the given fToken address
     *
     * @param counter Current account counter
     * @param fTokenAddress The relevant FToken contract address
     * @param keyStore
     * @param fee
     * @param gas
     * @param freight
     */
    export function AccrueInterestOperations(collaterals: TezosLendingPlatform.AssetType[], protocolAddresses: TezosLendingPlatform.ProtocolAddresses, counter: number, keyStore: KeyStore, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction[] {
        const entrypoint = 'accrueInterest';
        const parameters = 'Unit'
        let ops: Transaction[] = [];
        for (const collateral of collaterals) {
            ops.push(TezosNodeWriter.constructContractInvocationOperation(keyStore.publicKeyHash, counter, protocolAddresses.fTokens[collateral], 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson));
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
        let ops: Transaction[] = AccrueInterestOperations(markets, protocolAddresses, counter, keystore, fee, gas, freight);
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
    export function MintOperation(mint: MintPair, counter: number, fTokenAddress: string, keyStore: KeyStore, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'mint';
        const parameters = MintPairMichelson(mint);
        const xtzAmount = mint.underlying == TezosLendingPlatform.AssetType.XTZ ? mint.amount : 0;
        return TezosNodeWriter.constructContractInvocationOperation(keyStore.publicKeyHash, counter, fTokenAddress, xtzAmount, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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
    export function RedeemOperation(redeem: RedeemPair, counter: number, fTokenAddress: string, keyStore: KeyStore, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'redeem';
        const parameters = RedeemPairMichelson(redeem);
        return TezosNodeWriter.constructContractInvocationOperation(keyStore.publicKeyHash, counter, fTokenAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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
    export function BorrowOperation(borrow: BorrowPair, counter: number, fTokenAddress: string, keyStore: KeyStore, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'borrow';
        const parameters = BorrowPairMichelson(borrow);
        return TezosNodeWriter.constructContractInvocationOperation(keyStore.publicKeyHash, counter, fTokenAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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
    export function RepayBorrowOperation(repayBorrow: RepayBorrowPair, counter: number, fTokenAddress: string, keyStore: KeyStore, fee: number,  gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'repayBorrow';
        const parameters = RepayBorrowPairMichelson(repayBorrow);
        const xtzAmount = repayBorrow.underlying == TezosLendingPlatform.AssetType.XTZ ? repayBorrow.amount : 0;
        return TezosNodeWriter.constructContractInvocationOperation(keyStore.publicKeyHash, counter, fTokenAddress, xtzAmount, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Michelson);
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

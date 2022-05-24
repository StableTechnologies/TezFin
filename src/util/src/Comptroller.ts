import { ConseilOperator, ConseilQuery, ConseilQueryBuilder, ConseilServerInfo, KeyStore, Signer, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Transaction } from 'conseiljs';

import { AssetType } from './enum'
import { JSONPath } from 'jsonpath-plus';
import { ProtocolAddresses } from './types';
import bigInt from 'big-integer';
import log from 'loglevel';

export namespace Comptroller {
    /*
     * @description
     *
     * @param
     */
    export interface Market {
        assetType: AssetType;
        borrowCap: bigInt.BigInteger;
        borrowPaused: boolean;
        collateralFactor: number;
        isListed: boolean;
        mintPaused: boolean;
        price: bigInt.BigInteger;
        updateLevel: number;
    }

    export type MarketMap = { [assetType: string]: Market };

    /*
     * @description
     *
     * @param
     */
    export interface Storage {
        accountLiquidityMapId: number;
        collateralsMapId: number;
        loansMapId: number;
        administrator: string;
        closeFactorMantissa: bigInt.BigInteger;
        expScale: bigInt.BigInteger;
        halfExpScale: bigInt.BigInteger;
        liquidationIncentiveMantissa: bigInt.BigInteger;
        marketsMapId: number;
        oracleAddress: string;
        pendingAdministrator: string | undefined;
        transferPaused: boolean;
        markets: MarketMap;
    }

    /*
     * @description
     *
     * @param server The Tezos node to communicate with
     * @param address
     */
    export async function GetStorage(address: string, protocolAddresses: ProtocolAddresses, server: string, conseilServerInfo: ConseilServerInfo): Promise<Storage> {
        const storageResult = await TezosNodeReader.getContractStorage(server, address);
        // get marketsMapId
        const marketsMapId = JSONPath({ path: '$.args[0].args[2].args[0].int', json: storageResult })[0];
        // get all market values for fTokens from protocolAddresses
        const markets: MarketMap = {};

        await Promise.all(Object.values(protocolAddresses.fTokens).map(async (addr) => {
            try {
                const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(addr, 'address'), 'hex'));
                const marketsResult = await TezosNodeReader.getValueForBigMapKey(server, marketsMapId, packedKey)
                const asset = protocolAddresses.fTokensReverse[addr];
                markets[asset] = parseMarketResult(marketsResult);
            } catch (e) {
                log.error(`Failed to get Comptroller.Markets big_map content for ${addr} from ${marketsMapId} with ${e}`);
            }
        }));

        // parse results
        try {
            return {
                accountLiquidityMapId: JSONPath({ path: '$.args[0].args[0].args[0].args[0].int', json: storageResult })[0],
                collateralsMapId: JSONPath({ path: '$.args[0].args[0].args[1].args[1].int', json: storageResult })[0],
                loansMapId: JSONPath({ path: '$.args[0].args[1].args[1].int', json: storageResult })[0],
                administrator: JSONPath({ path: '$.args[0].args[0].args[0].args[2].string', json: storageResult })[0],
                closeFactorMantissa: JSONPath({ path: '$.args[0].args[0].args[1].args[0].int', json: storageResult })[0],
                expScale: JSONPath({ path: '$.args[0].args[0].args[2].int', json: storageResult })[0],
                halfExpScale: JSONPath({ path: '$.args[0].args[0].args[3].int', json: storageResult })[0],
                liquidationIncentiveMantissa: JSONPath({ path: '$.args[0].args[1].args[0].int', json: storageResult })[0],
                marketsMapId: marketsMapId,
                oracleAddress: JSONPath({ path: '$.args[0].args[2].args[1].string', json: storageResult })[0],
                pendingAdministrator: JSONPath({ path: '$.args[0].args[3].prim', json: storageResult })[0],
                transferPaused: JSONPath({ path: '$.args[0].args[4].prim', json: storageResult })[0].toString().toLowerCase().startsWith('t'),
                markets: markets
            };
        } catch (e) {
            log.error(`Unable to parse storage JSON for Comptroller at ${address}`);
            throw e;
        }
    }

    /*
     * Craft the query for operations from the ledger big map
     *
     * @param address The address for which to query data
     * @param marketsMapId
     * @param marketAddresses
     */
    function makeMarketsQuery(marketsMapId: number, marketAddress: string): ConseilQuery {
        let marketsQuery = ConseilQueryBuilder.blankQuery();
        marketsQuery = ConseilQueryBuilder.addFields(marketsQuery, 'key', 'value');
        marketsQuery = ConseilQueryBuilder.addPredicate(marketsQuery, 'big_map_id', ConseilOperator.EQ, [marketsMapId]);
        // key is in marketAddresses
        marketsQuery = ConseilQueryBuilder.addPredicate(marketsQuery, 'key', ConseilOperator.EQ, [`0x${TezosMessageUtils.writeAddress(marketAddress)}`]);
        marketsQuery = ConseilQueryBuilder.setLimit(marketsQuery, 1000);
        return marketsQuery;
    }

    /*
     * @description TODO
     *
     * @param
     */
    function parseMarketResult(result): Market {
        const assetType: AssetType = JSONPath({ path: '$.args[1].args[1].string', json: result })[0] as AssetType;
        return {
            assetType: assetType,
            borrowCap: JSONPath({ path: '$.args[0].args[0].args[0].int', json: result })[0],
            borrowPaused: JSONPath({ path: '$.args[0].args[0].args[1].prim', json: result })[0].toString().toLowerCase().startsWith('t'),
            collateralFactor: JSONPath({ path: '$.args[0].args[1].int', json: result })[0],
            isListed: JSONPath({ path: '$.args[0].args[2].prim', json: result })[0].toString().toLowerCase().startsWith('t'),
            mintPaused: JSONPath({ path: '$.args[1].args[0].prim', json: result })[0].toString().toLowerCase().startsWith('t'),
            price: bigInt(JSONPath({ path: '$.args[2].int', json: result })[0]),
            updateLevel: JSONPath({ path: '$.args[3].int', json: result })[0],
        } as Market;
    }

    /**
     * @description Return the list of collateralized markets for address
     *
     * @param address Account address
     * @param comptroller
     * @param protocolAddresses
     * @param server Tezos node
     */
    export async function GetCollaterals(address: string, comptroller: Storage, protocolAddresses: ProtocolAddresses, server: string): Promise<AssetType[]> {
        const packedAccountKey = TezosMessageUtils.encodeBigMapKey(
            Buffer.from(TezosMessageUtils.writePackedData(`0x${TezosMessageUtils.writeAddress(address)}`, '', TezosParameterFormat.Michelson), 'hex')
        );

        try {
            const collateralsResult = await TezosNodeReader.getValueForBigMapKey(server, comptroller.collateralsMapId, packedAccountKey);
            const fTokenAddresses: AssetType[] = collateralsResult.map((json) => json['string']);
            return fTokenAddresses.map((fTokenAddress) => protocolAddresses.fTokensReverse[fTokenAddress]);
        } catch (err) {
            log.error(`${address} has no collateralized assets`);
            return [];
        }
    }

    /*
     * Description
     *
     * @param address Address of the FToken to update
     */
    export interface UpdateAssetPricePair {
        address: string;
    }


    /*
     * Description
     *
     * @param address Address of the account to update
     */
    export interface UpdateAccountLiquidityPair {
        address: string;
    }

    /*
     * Description
     *
     * @param
     */
    export function UpdateAccountLiquidityMicheline(updateAccountLiquidity: UpdateAssetPricePair): string {
        return `{ "bytes": "${TezosMessageUtils.writeAddress(updateAccountLiquidity.address)}" }`;
    }

    /*
     * Description
     *
     * @param
     */
    export function UpdateAccountLiquidityMichelson(updateAccountLiquidity: UpdateAccountLiquidityPair): string {
        return `0x${TezosMessageUtils.writeAddress(updateAccountLiquidity.address)}`;
    }

    /*
     * Returns the operation for invoking the UpdateAssetPrice entry point of the comptroller contract
     *
     * @param
     */
    export function UpdateAccountLiquidityOperation(updateAccountLiquidity: UpdateAccountLiquidityPair, counter: number, comptrollerAddress: string, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'updateAccountLiquidityWithView';
        const parameters = UpdateAccountLiquidityMicheline(updateAccountLiquidity);
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, comptrollerAddress, 0, 0, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    }


    /*
     * Add the required operations for entrypoints that invoke transferOut. This requires updating the comptroller contract's accounting.
     *
     * @param params The parameters for invoking the FToken entrypoint
     * @param counter Current account counter
     * @param keystore
     * @param fee
     * @param gas
     * @param freight
     */
    export function DataRelevanceOpGroup(collaterals: AssetType[], protocolAddresses: ProtocolAddresses, counter: number, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // updateAccountLiquidityWithView
        const updateAccountLiquidity: Comptroller.UpdateAccountLiquidityPair = { address: pkh };
        const updateAccountLiquidityOp = Comptroller.UpdateAccountLiquidityOperation(updateAccountLiquidity, counter, protocolAddresses.comptroller, pkh, gas, freight);
        ops.push(updateAccountLiquidityOp);
        return ops;
    }
    /*
     * Add the required operations for entrypoints that invoke transferOut. This requires updating the comptroller contract's accounting.
     *
     * @param params The parameters for invoking the FToken entrypoint
     * @param counter Current account counter
     * @param keystore
     * @param fee
     * @param gas
     * @param freight
     */
    export async function DataRelevance(collaterals: AssetType[], protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = DataRelevanceOpGroup(collaterals, protocolAddresses, counter, keystore.publicKeyHash, gas, freight);
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Description
     *
     * @param fTokens List of fToken contract addresses to use as collateral.
     */
    export interface EnterMarketsPair {
        fTokens: string[];
    }

    /*
     * Description
     *
     * @param
     */
    export function EnterMarketsPairMicheline(enterMarkets: EnterMarketsPair): string {
        return `[ ${enterMarkets.fTokens.map(market => `{ "bytes": "${TezosMessageUtils.writeAddress(market)}" }`).join(',')} ]`;
    }

    /*
     * @description
     *
     * @param
     */
    export function EnterMarketsOperation(enterMarkets: EnterMarketsPair, comptrollerAddress: string, counter: number, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'enterMarkets';
        const parameters = EnterMarketsPairMicheline(enterMarkets);
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, comptrollerAddress, 0, 0, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    }

    /*
     * Description
     *
     * @param
     */
    export async function EnterMarkets(enterMarkets: EnterMarketsPair, comptrollerAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entryPoint = 'enterMarkets';
        const parameters = EnterMarketsPairMicheline(enterMarkets);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, comptrollerAddress, 0, fee, freight, gas, entryPoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }

    /*
     * Description
     *
     * @param
     */
    export interface ExitMarketPair {
        address: string;
    }

    /*
     * Description
     *
     * @param
     */
    export function ExitMarketPairMicheline(exitMarket: ExitMarketPair): string {
        return `{ "bytes": "${TezosMessageUtils.writeAddress(exitMarket.address)}" }`;
    }

    /*
     * @description
     *
     * @param
     */
    export function ExitMarketOperation(exitMarket: ExitMarketPair, comptrollerAddress: string, counter: number, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction {
        const entrypoint = 'exitMarket';
        const parameters = ExitMarketPairMicheline(exitMarket);
        return TezosNodeWriter.constructContractInvocationOperation(pkh, counter, comptrollerAddress, 0, 0, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    }

    /*
     * Description
     *
     * @param
     */
    export async function ExitMarket(exitMarket: ExitMarketPair, comptrollerAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entryPoint = 'exitMarket';
        const parameters = ExitMarketPairMicheline(exitMarket);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, comptrollerAddress, 0, fee, freight, gas, entryPoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }
}


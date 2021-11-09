import { KeyStore, Signer, TezosNodeReader, TezosNodeWriter, TezosContractUtils, Transaction, TezosParameterFormat, ConseilQuery, ConseilQueryBuilder, ConseilOperator, TezosConseilClient, ConseilServerInfo } from 'conseiljs';
import { TezosLendingPlatform } from './TezosLendingPlatform';
import { JSONPath } from 'jsonpath-plus';

export namespace PriceFeed {
    export type PriceMap = { [assetType: string]: number };

    /*
     * @description
     *
     * @param
     */
    export async function GetPrice(asset: TezosLendingPlatform.AssetType, pricesMapId: number, server: string, conseilServerInfo: ConseilServerInfo): Promise<number> {
        const priceQuery = makePriceQuery(asset, pricesMapId, server);
        const priceResult = await TezosConseilClient.getTezosEntityData(conseilServerInfo, conseilServerInfo.network, 'big_map_contents', priceQuery);
        return 0;
    }

    /*
     * @description TODO
     *
     * @param
     */
    export function makePriceQuery(asset: TezosLendingPlatform.AssetType, pricesMapId: number, server: string): ConseilQuery {
        let balanceQuery = ConseilQueryBuilder.blankQuery();
        return balanceQuery;
    }
}

import { ConseilQuery, ConseilQueryBuilder, TezosConseilClient, ConseilServerInfo } from 'conseiljs';

import { AssetType } from './enum'; 

export namespace PriceFeed {
    export type PriceMap = { [assetType: string]: number };

    /*
     * @description
     *
     * @param
     */
    export async function GetPrice(asset: AssetType, pricesMapId: number, server: string, conseilServerInfo: ConseilServerInfo): Promise<number> {
        const priceQuery = makePriceQuery(asset, pricesMapId, server);
        const priceResult = await TezosConseilClient.getTezosEntityData(conseilServerInfo, conseilServerInfo.network, 'big_map_contents', priceQuery);
        return 0;
    }

    /*
     * @description TODO
     *
     * @param
     */
    export function makePriceQuery(asset: AssetType, pricesMapId: number, server: string): ConseilQuery {
        let balanceQuery = ConseilQueryBuilder.blankQuery();
        return balanceQuery;
    }
}

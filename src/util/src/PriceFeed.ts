import { TezosMessageUtils, TezosNodeReader } from 'conseiljs';

import { AssetType } from './enum';
import { JSONPath } from 'jsonpath-plus';
import bigInt from 'big-integer';

export namespace PriceFeed {

    /**
     * Get the asset pair price from the harbinger oracle 
     *
     * @param asset asset from AssetType enum
     * @param oracleMap map id for harbinger oracle
     * @param server rpc node url
     */
    export async function GetPrice(asset: AssetType, oracleMap: number, server: string): Promise<bigInt.BigInteger> {
        const packedKey = TezosMessageUtils.encodeBigMapKey(
            Buffer.from(TezosMessageUtils.writePackedData(asset + "-USD", "string"), "hex")
        );
        const mapResult = await TezosNodeReader.getValueForBigMapKey(server, oracleMap, packedKey);
        const balance = JSONPath({
            path: "$.args[0].args[0].int",
            json: mapResult,
        })[0]
        return bigInt(balance);
    }
}

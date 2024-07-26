import { KeyStore, Signer, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat } from 'conseiljs';

import { AssetType } from './enum';
import { JSONPath } from 'jsonpath-plus';
import { OracleMap } from './types';
import bigInt from 'big-integer';

const alias = {
    [AssetType.OXTZ]: AssetType.XTZ,
    [AssetType.WTZ]: AssetType.XTZ,
}

export namespace PriceFeed {

    export interface Pair {
        asset: AssetType;
        price: number;
    }

    /**
     * Get the asset pair price from the harbinger oracle 
     *
     * @param asset asset from AssetType enum
     * @param oracleMap map id for harbinger oracle
     * @param server rpc node url
     */
    export async function GetPrice(asset: AssetType, oracle: string, level:number, server: string): Promise<bigInt.BigInteger> {
        if (Object.prototype.hasOwnProperty.call(alias, asset)) {
            asset = alias[asset]
        }
        const assetPrice = await TezosNodeWriter.runView(
        server,
        "main",
        oracle,
        "getPrice",
        { "string": `${asset}-USD` },
        `${level}`
    );
        return bigInt(assetPrice.data.args[1].int);
    }

    /**
     * Set the asset pair price for tezfin oracle 
     *
     * @param priceList list of asset of AssetType and their corresponding price
     * @param oracleAddress tezfin oracle address
     */
    export async function SetPrice(priceList: Pair[], oracleAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 200_000, freight: number = 20_000): Promise<string> {
        let payload = `{`
        for (let i = 0; i < priceList.length; i++) {
            if (i > 0) {
                payload += "; "
            }
            payload += `Pair "${priceList[i].asset}-USD" ${priceList[i].price}`
        }
        payload += `}`;
        console.log("paylod", payload)
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, oracleAddress, 0, fee, freight, gas, "setPrice", payload, TezosParameterFormat.Michelson);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }
}

import { getContract } from './toolkit';
import { AssetType } from './enum';
import bigInt from 'big-integer';

const alias = {
    [AssetType.OXTZ]: AssetType.XTZ,
    [AssetType.WTZ]: AssetType.XTZ,
    [AssetType.STXTZ]: AssetType.XTZ
}

export namespace PriceFeed {

    /**
     * Get the asset pair price from the TezFin oracle.
     * Uses the on-chain view `getPrice` which returns pair(timestamp, nat).
     */
    export async function GetPrice(
        asset: AssetType,
        oracle: string,
        level: number,
        server: string,
    ): Promise<bigInt.BigInteger> {
        if (Object.prototype.hasOwnProperty.call(alias, asset)) {
            asset = alias[asset];
        }

        const contract = await getContract(server, oracle);

        // Previewnet fallback: on-chain views fail (tezlink_error), read directly from storage big_map
        if (server.includes('previewnet')) {
            const storage: any = await contract.storage();
            const entry = await storage.overrides.get(`${asset}-USD`);
            // entry is pair(timestamp, nat) — second element is the price
            return bigInt(entry['1'].toString());
        }

        // Mainnet: call on-chain view
        const result = await contract.contractViews
            .getPrice(`${asset}-USD`)
            .executeView({ viewCaller: oracle });
        // result is pair(timestamp, nat) — second element is the price
        return bigInt(result['1'].toString());
    }
}

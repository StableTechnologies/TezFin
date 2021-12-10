
import { TezosNodeReader } from 'conseiljs';
import { JSONPath } from 'jsonpath-plus';
import bigInt from 'big-integer';

export namespace InterestRateModel {
    export interface Storage {
        blockRate: bigInt.BigInteger;
        blockMultiplier: bigInt.BigInteger;
        scale: bigInt.BigInteger;
    }

    export async function GetStorage(server: string, address: string): Promise<Storage> {
        const storageResult = await TezosNodeReader.getContractStorage(server, address);

        return {
            blockRate: bigInt(JSONPath({ path: '$.args[0].int', json: storageResult })[0]),
            blockMultiplier: bigInt(JSONPath({ path: '$.args[1].int', json: storageResult })[0]),
            scale: bigInt(JSONPath({ path: '$.args[2].int', json: storageResult })[0])
        };
    }
}

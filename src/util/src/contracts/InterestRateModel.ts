import { getContract } from '../toolkit';
import bigInt from 'big-integer';

export namespace InterestRateModel {
    export interface Storage {
        blockRate: bigInt.BigInteger;
        blockMultiplier: bigInt.BigInteger;
        jumpMultiplier: bigInt.BigInteger;
        kink: bigInt.BigInteger;
        scale: bigInt.BigInteger;
    }

    export async function GetStorage(server: string, address: string): Promise<Storage> {
        const contract = await getContract(server, address);
        const storage: any = await contract.storage();
        return {
            blockRate: bigInt(storage.baseRatePerBlock.toString()),
            blockMultiplier: bigInt(storage.multiplierPerBlock.toString()),
            jumpMultiplier: bigInt(storage.jumpMultiplierPerBlock.toString()),
            kink: bigInt(storage.kink.toString()),
            scale: bigInt(storage.scale.toString()),
        };
    }
}

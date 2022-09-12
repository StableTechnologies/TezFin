
import { TezosBlockOperationEnvelope,TezosConstants, TezosNodeReader} from 'conseiljs';
export interface OpConfirmation {
	level: number,
		hash: string,
		operation: any
}
/**
     * 
     * @param tezosNode 
     * @param block 
     * @param operationHash 
     * @param limit 
     * @returns 
     */
    export async function awaitOperationConfirmation(tezosNode: string, block: number, operationHash: string, limit: number = 10): Promise<OpConfirmation> {
        let lastSeenBlock = block;
        if (lastSeenBlock < 0) {
            const head = await TezosNodeReader.getBlockHead(tezosNode);
            lastSeenBlock = head.header.level;
        }

        const transactionOperationIndex = 3;
        const activationOperationIndex = 2;
        while (lastSeenBlock < block + limit) {
            try {
                const blockData = await TezosNodeReader.getBlock(tezosNode, `${lastSeenBlock + 1}`);
                lastSeenBlock = blockData.header.level;
                const relevantOperation = blockData.operations[transactionOperationIndex]
                                            .concat(blockData.operations[activationOperationIndex])
                                            .filter(o => o.hash === operationHash);
                if (relevantOperation.length === 1) {
			return {level: lastSeenBlock, hash: operationHash,operation: relevantOperation[0]};
                } else {
                    await new Promise(resolve => setTimeout(resolve, TezosConstants.DefaultBlockTime));
                }
            } catch (e) {
                await new Promise(resolve => setTimeout(resolve, 10_000));
            }
        }
    
        throw new Error(`Did not observe operation ${operationHash} between ${block} and ${lastSeenBlock}`)
    }

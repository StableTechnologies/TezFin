import { TezosToolkit, ContractAbstraction, ContractProvider } from '@taquito/taquito';

const toolkits: Map<string, TezosToolkit> = new Map();
const contracts: Map<string, ContractAbstraction<ContractProvider>> = new Map();

/**
 * Get or create a cached TezosToolkit for a given RPC URL.
 */
export function getToolkit(server: string): TezosToolkit {
    if (!toolkits.has(server)) {
        toolkits.set(server, new TezosToolkit(server));
    }
    return toolkits.get(server)!;
}

/**
 * Get or create a cached contract instance.
 */
export async function getContract(server: string, address: string): Promise<ContractAbstraction<ContractProvider>> {
    const key = `${server}|${address}`;
    if (!contracts.has(key)) {
        const tezos = getToolkit(server);
        contracts.set(key, await tezos.contract.at(address));
    }
    return contracts.get(key)!;
}

import * as config from '../config/config.json';

import {
    KeyStore,
    Signer,
    TezosContractUtils,
    TezosNodeReader,
    TezosNodeWriter,
    TezosParameterFormat,
    Transaction,
} from 'conseiljs';

export interface ContractOperation {
    to: string;
    amount: number;
    mutez?: boolean;
    parameter?: {
        entrypoint: string;
        value: unknown;
    };
}

/** Submit current utility-library operation builders through the Conseil signer. */
export async function sendOperations(
    operations: ContractOperation[],
    keystore: KeyStore,
    signer: Signer,
): Promise<string> {
    const transactions: Transaction[] = operations.map((operation) => {
        if (!operation.parameter) {
            throw new Error(`Missing contract parameters for operation to ${operation.to}`);
        }
        if (operation.mutez === false) {
            throw new Error(`Operation amount for ${operation.to} must be expressed in mutez`);
        }
        return TezosNodeWriter.constructContractInvocationOperation(
            keystore.publicKeyHash,
            0,
            operation.to,
            operation.amount,
            0,
            config.tx.freight,
            config.tx.gas,
            operation.parameter.entrypoint,
            JSON.stringify(operation.parameter.value),
            TezosParameterFormat.Micheline,
        );
    });

    const counter = await TezosNodeReader.getCounterForAccount(config.tezosNode, keystore.publicKeyHash);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode);
    const operationGroup = await TezosNodeWriter.prepareOperationGroup(
        config.tezosNode,
        keystore,
        counter,
        transactions,
        true,
    );
    const result = await TezosNodeWriter.sendOperation(config.tezosNode, operationGroup, signer);
    const operationGroupId = TezosContractUtils.clearRPCOperationGroupHash(result.operationGroupID);
    const confirmation = await TezosNodeReader.awaitOperationConfirmation(
        config.tezosNode,
        head.header.level - 1,
        operationGroupId,
        6,
    );
    const statuses = confirmation.contents.map((content) => content.metadata.operation_result.status);
    if (statuses.some((status) => status !== 'applied')) {
        throw new Error(`Operation ${operationGroupId} was not fully applied: ${statuses.join(', ')}`);
    }
    return operationGroupId;
}

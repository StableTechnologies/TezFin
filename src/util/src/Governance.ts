import { KeyStore, Signer, TezosContractUtils, TezosMessageUtils, TezosNodeWriter, TezosParameterFormat } from 'conseiljs';

import { AssetType } from './enum';

export namespace Governance {
    // TODO:
    // - setComptroller

    /*
     * supportMarket entrypoint parameters
     *
     * @param
     */
    export interface SupportMarketPair {
        comptroller: string;
        fToken: {
            address: string;
            name: AssetType;
        };
    }

    /*
     * Convert SupportMarketPair to Micheline string
     *
     * @param
     */
    export function SupportMarketMicheline(supportMarket: SupportMarketPair, priceExp: number): string {
        return `{ "prim": "Pair", "args": [ { "bytes": "${TezosMessageUtils.writeAddress(supportMarket.comptroller)}" }, { "prim": "Pair", "args": [ {"bytes": "${TezosMessageUtils.writeAddress(supportMarket.fToken.address)}"  }, { "prim": "Pair", "args": [ { "string": "${supportMarket.fToken.name}"  }, { "int": "${priceExp}" } ] } ] } ] }`;
    }

    /*
     * Invokes the supportMarket entry point in the Governance contract.
     *
     * @param
     */
    export async function SupportMarket(supportMarket: SupportMarketPair, priceExp: number, governanceAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entrypoint = 'supportMarket';
        const parameters = SupportMarketMicheline(supportMarket, priceExp);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, governanceAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }

    /*
     * disableMarket entrypoint parameters
     *
     * @param
     */
    export interface DisableMarketPair {
        comptroller: string;
        fTokenAddress: string;
    }

    /*
     * Convert DisableMarketPair to Micheline string
     *
     * @param
     */
    export function DisableMarketMicheline(disableMarket: DisableMarketPair): string {
        return `{"prim": "Pair", "args": [
            { "bytes": "${TezosMessageUtils.writeAddress(disableMarket.comptroller)}" },
            { "bytes": "${TezosMessageUtils.writeAddress(disableMarket.fTokenAddress)}" }
        ]}`;
    }

    /*
     * Invokes the disableMarket entry point of the Governance contract.
     *
     * @param
     */
    export async function DisableMarket(disableMarket: DisableMarketPair, governanceAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entrypoint = 'disableMarket';
        const parameters = DisableMarketMicheline(disableMarket);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, governanceAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }


    /*
     * setMintPaused entrypoint parameters
     *
     * @param
     */
    export interface SetMintPausedPair {
        comptrollerAddress: string;
        tokenState: {
            fTokenAddress: string;
            state: boolean;
        }
    }

    /*
     * setBorrowPaused entry point parameters. Alias of SetMintPausedPair for clarity.
     */
    export type SetBorrowPausedPair = SetMintPausedPair;

    /*
     * Convert SetMintPausedPair to Micheline string
     *
     * @param
     */
    export function SetMintPausedMicheline(setMintPaused: SetMintPausedPair): string {
        return `{ "prim": "Pair", "args": [
            { "bytes": "${TezosMessageUtils.writeAddress(setMintPaused.comptrollerAddress)}"},
            { "prim": "Pair", "args": [
                { "bytes": "${TezosMessageUtils.writeAddress(setMintPaused.tokenState.fTokenAddress)}"} ,
                { "prim": "${setMintPaused.tokenState.state ? "True" : "False"}"}
            ]}
        ]}`;
    }

    /*
     * Convert SetBorrowPausedPair to Micheline string. Alias for SetMintPausedMicheline for clarity.
    */
    export const SetBorrowPausedMicheline = SetMintPausedMicheline;

    /*
     * Invokes the setMintPaused entry point of the Governance contract
     *
     * @param
     */
    export async function SetMintPaused(setMintPaused: SetMintPausedPair, governanceAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entrypoint = 'setMintPaused';
        const parameters = SetMintPausedMicheline(setMintPaused);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, governanceAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }

    /*
     * Invokes the setBorrowPaused entry point of the Governance contract. Alias for SetMintPaused for clarity.
    */
    export async function SetBorrowPaused(setBorrowPaused: SetBorrowPausedPair, governanceAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        const entrypoint = 'setBorrowPaused';
        const parameters = SetBorrowPausedMicheline(setBorrowPaused);
        const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, governanceAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
        return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
    }
}


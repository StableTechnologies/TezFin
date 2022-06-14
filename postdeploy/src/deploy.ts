import * as config from '../config/config.json';

import { AssetType, Governance, ProtocolAddresses, TokenStandard } from 'tezoslendingplatformjs';
import { KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosConstants, TezosContractUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Transaction, Tzip7ReferenceTokenHelper } from 'conseiljs';
import BigNumber from "bignumber.js"
import log from 'loglevel';
import { statOperation } from './util';

export async function postDeploy(keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    for (const asset of config.supportMarket)
        await supportMarket(asset.name as AssetType, asset.priceExp, keystore, signer, protocolAddresses);
    for (const asset of config.unpauseMarkets)
        await unpauseMarkets(asset as AssetType, keystore, signer, protocolAddresses);
}

export async function mintFakeTokens(keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses, address: string, amount:number){
    let ops: Transaction[] = []
    for (const asset of config.tokenMint)
        ops.push(tokenMint(asset, keystore!, signer!, protocolAddresses!, address, amount))
    const counter = await TezosNodeReader.getCounterForAccount(config.tezosNode, keystore.publicKeyHash);
    const opGroup = await TezosNodeWriter.prepareOperationGroup(config.tezosNode, keystore, counter, ops, true);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const result = await TezosNodeWriter.sendOperation(config.tezosNode, opGroup, signer);
    const tokenMintOpId = result["operationGroupID"]
        .replace(/"/g, "")
        .replace(/\n/, "");
    console.log("confirming tx - "+tokenMintOpId)
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, tokenMintOpId, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
    console.log("confirmed tx - " + tokenMintOpId)
}

export function tokenMint(asset: string, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses, address: string, mintAmount: number, gas: number = 800_000, freight: number = 20_000) {
    let payload = ""
    log.info(`minting ${mintAmount} ${asset} tokens to ${address}`);
    const amount = new BigNumber(10).pow(protocolAddresses.underlying[asset].decimals).multipliedBy(mintAmount).toFixed();
    if (protocolAddresses.underlying[asset].tokenStandard === TokenStandard.FA12) {
        payload = `(Pair "${address}" ${amount.toString()})`
    } else if (protocolAddresses.underlying[asset].tokenStandard === TokenStandard.FA2) {
        payload = `(Pair (Pair "${address}" ${amount.toString()}) (Pair {Elt "" 0x32} 0))`
    }
    return TezosNodeWriter.constructContractInvocationOperation(
        keystore.publicKeyHash, 0, protocolAddresses.underlying[asset].address!, 0, config.tx.fee,
        freight, gas,
        "mint",
        payload,
        TezosParameterFormat.Michelson,
    );
}

async function supportMarket(asset: AssetType, priceExp: number, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    // supportMarket
    log.info(`supportMarket ${asset}`);
    const supportMarket: Governance.SupportMarketPair = {
        comptroller: protocolAddresses.comptroller,
        fToken: {
            address: protocolAddresses.fTokens[asset],
            name: asset
        }
    };
    log.info(`${JSON.stringify(supportMarket)}`);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const supportMarketOpId = await Governance.SupportMarket(supportMarket, Math.pow(10, priceExp), protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    const conseilResult = await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, supportMarketOpId, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

async function unpauseMarkets(asset: AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    // setMintPaused
    log.info(`setMintPaused: ${asset}`);
    const setMintPaused: Governance.SetMintPausedPair = {
        comptrollerAddress: protocolAddresses.comptroller,
        tokenState: {
            state: false,
            fTokenAddress: protocolAddresses.fTokens[asset]
        }
    };
    log.info(`${JSON.stringify(setMintPaused)}`);
    let head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const setMintPausedOpId = await Governance.SetMintPaused(setMintPaused, protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    const conseilResult = await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, setMintPausedOpId, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
    log.info(`setBorrowPaused: ${asset}`);
    const setBorrowPaused: Governance.SetBorrowPausedPair = {
        comptrollerAddress: protocolAddresses.comptroller,
        tokenState: {
            state: false,
            fTokenAddress: protocolAddresses.fTokens[asset]
        }
    };
    head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const setBorrowPausedOpId = await Governance.SetBorrowPaused(setBorrowPaused, protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, setBorrowPausedOpId, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

async function SetPrice(asset: AssetType, price: number, priceOracleAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
    const entrypoint = 'setPrice';
    const parameters = `{"prim": "Pair", "args": [{"string": "${asset}"}, {"int": "${price}"}]} `;
    const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, priceOracleAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
}


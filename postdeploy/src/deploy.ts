import * as config from '../config/config.json';

import { Governance, TezosLendingPlatform } from './tlp';
import { KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Tzip7ReferenceTokenHelper } from 'conseiljs';

import log from 'loglevel';
import { statOperation } from './index';

export async function postDeploy(keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    for (const asset of config.supportMarket)
        await supportMarket(asset.name as TezosLendingPlatform.AssetType, asset.priceExp, keystore, signer, protocolAddresses);
    for (const asset of config.unpauseMarkets)
        await unpauseMarkets(asset as TezosLendingPlatform.AssetType, keystore, signer, protocolAddresses);
    // mint underlyings
    // for (const asset of config.tokenMint)
    //     await tokenMint(asset, keystore!, signer!, protocolAddresses!);
}

export async function tokenMint(asset: string, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    if (TezosLendingPlatform.assetTypeToStandard(asset as TezosLendingPlatform.AssetType) === TezosLendingPlatform.TokenStandard.FA12) {
        log.info(`minting ${10000 * config.mintAmount} ${asset} tokens`);
        const tokenMintOpId = await Tzip7ReferenceTokenHelper.mint(config.tezosNode, signer, keystore, protocolAddresses.underlying[asset].address!, config.tx.fee, keystore.publicKeyHash, 100000000000000 * config.mintAmount);
        const tokenMintResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, tokenMintOpId, config.delay, config.networkBlockTime);
        statOperation(tokenMintResult);
    } else if (TezosLendingPlatform.assetTypeToStandard(asset as TezosLendingPlatform.AssetType) === TezosLendingPlatform.TokenStandard.FA2) {
        log.info(`minting ${10000 * config.mintAmount} ${asset} tokens`);
        const tokenMintOpId = await MultiAssetTokenHelper.mint(config.tezosNode, protocolAddresses.underlying[asset].address!, signer, keystore, config.tx.fee, keystore.publicKeyHash, 100000000000000 * config.mintAmount, {}, protocolAddresses.underlying[asset].tokenId!);
        const tokenMintResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, tokenMintOpId, config.delay, config.networkBlockTime);
        statOperation(tokenMintResult);
    }
}

async function supportMarket(asset: TezosLendingPlatform.AssetType, priceExp: number, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
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

async function unpauseMarkets(asset: TezosLendingPlatform.AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
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

async function SetPrice(asset: TezosLendingPlatform.AssetType, price: number, priceOracleAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
    const entrypoint = 'setPrice';
    const parameters = `{"prim": "Pair", "args": [{"string": "${asset}"}, {"int": "${price}"}]} `;
    const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, priceOracleAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
}


import * as config from '../config/config.json';

import { Governance, TezosLendingPlatform } from './tlp';
import { KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosNodeWriter, TezosParameterFormat, Tzip7ReferenceTokenHelper } from 'conseiljs';

import log from 'loglevel';
import { statOperation } from './index';

export async function postDeploy(keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    for (const asset of config.supportMarket)
        await supportMarket(asset as TezosLendingPlatform.AssetType, keystore, signer, protocolAddresses);
    for (const asset of config.unpauseMarkets)
        await unpauseMarkets(asset as TezosLendingPlatform.AssetType, keystore, signer, protocolAddresses);
    for (const asset of config.setPrices.assets)
        await setPrice(asset as TezosLendingPlatform.AssetType, keystore, signer, protocolAddresses);
    // mint underlyings
    for (const asset of config.tokenMint)
        await tokenMint(asset, keystore!, signer!, protocolAddresses!);
}

export async function tokenMint(asset: string, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    if (TezosLendingPlatform.assetTypeToStandard(asset as TezosLendingPlatform.AssetType) === TezosLendingPlatform.TokenStandard.FA12) {
        log.info(`minting ${10000 * config.mintAmount} ${asset} tokens`);
        const tokenMintOpId = await Tzip7ReferenceTokenHelper.mint(config.tezosNode, signer, keystore, protocolAddresses.underlying[asset].address!, config.tx.fee, keystore.publicKeyHash, 100000000000000000000000 * config.mintAmount);
        const tokenMintResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, tokenMintOpId, config.delay, config.networkBlockTime);
        statOperation(tokenMintResult);
    } else if (TezosLendingPlatform.assetTypeToStandard(asset as TezosLendingPlatform.AssetType) === TezosLendingPlatform.TokenStandard.FA2) {
        log.info(`minting ${10000 * config.mintAmount} ${asset} tokens`);
        const tokenMintOpId = await MultiAssetTokenHelper.mint(config.tezosNode, protocolAddresses.underlying[asset].address!, signer, keystore, config.tx.fee, keystore.publicKeyHash, 100000000000000 * config.mintAmount, {}, protocolAddresses.underlying[asset].tokenId!);
        const tokenMintResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, tokenMintOpId, config.delay, config.networkBlockTime);
        statOperation(tokenMintResult);
    }
}

async function supportMarket(asset: TezosLendingPlatform.AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
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
    const supportMarketOpId = await Governance.SupportMarket(supportMarket, protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    const supportMarketResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, supportMarketOpId, config.delay, config.networkBlockTime);
    statOperation(supportMarketResult);
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
    const setMintPausedOpId = await Governance.SetMintPaused(setMintPaused, protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    const setMintPausedResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, setMintPausedOpId, config.delay, config.networkBlockTime);
    statOperation(setMintPausedResult);
    log.info(`setBorrowPaused: ${asset}`);
    const setBorrowPaused: Governance.SetBorrowPausedPair = {
        comptrollerAddress: protocolAddresses.comptroller,
        tokenState: {
            state: false,
            fTokenAddress: protocolAddresses.fTokens[asset]
        }
    };
    const setBorrowPausedOpId = await Governance.SetBorrowPaused(setBorrowPaused, protocolAddresses.governance, config.tezosNode, signer, keystore, config.tx.fee);
    const setBorrowPausedResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, setBorrowPausedOpId, config.delay, config.networkBlockTime);
    statOperation(setBorrowPausedResult);
}

async function SetPrice(asset: TezosLendingPlatform.AssetType, price: number, priceOracleAddress: string, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
    const entrypoint = 'setPrice';
    const parameters = `{"prim": "Pair", "args": [{"string": "${asset}"}, {"int": "${price}"}]} `;
    const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(server, signer, keystore, priceOracleAddress, 0, fee, freight, gas, entrypoint, parameters, TezosParameterFormat.Micheline);
    return TezosContractUtils.clearRPCOperationGroupHash(nodeResult.operationGroupID);
}

async function setPrice(asset: TezosLendingPlatform.AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    log.info(`setPrice(${asset})`);
    const setPriceOpId = await SetPrice(asset as TezosLendingPlatform.AssetType, config.setPrices.price, protocolAddresses.priceFeed, config.tezosNode, signer, keystore, config.tx.fee);
    const setPriceResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, setPriceOpId, config.delay, config.networkBlockTime);
    statOperation(setPriceResult);
}


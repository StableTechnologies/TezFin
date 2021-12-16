import { ConseilServerInfo, KeyStore, Signer, TezosConseilClient } from 'conseiljs';
import { TezosLendingPlatform, Comptroller } from './tlp';
import log from 'loglevel';
import * as config from '../config/config.json';
import { statOperation } from './index';

export async function enterMarkets(assets: TezosLendingPlatform.AssetType[], keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    log.info(`Getting comptroller storage`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode, config.conseilServer as ConseilServerInfo);
    let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
    // enterMarkets
    const markets: Comptroller.EnterMarketsPair = {
        fTokens: []
    };
    for (const asset of assets) {
        log.info(`enterMarkets ${asset}`);
        markets.fTokens.push(protocolAddresses.fTokens[asset]);
    }
    const enterMarketsOpId = await TezosLendingPlatform.EnterMarkets(markets, comptroller, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const enterMarketsResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, enterMarketsOpId, config.delay, config.networkBlockTime);
    statOperation(enterMarketsResult);
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function exitMarket(asset: TezosLendingPlatform.AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    log.info(`Getting comptroller storage`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode, config.conseilServer as ConseilServerInfo);
    let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
    // exitMarket
    log.info(`exitMarket ${asset}`);
    const exitMarket: Comptroller.ExitMarketPair = {
        address: protocolAddresses.fTokens[asset]
    };
    const exitMarketOpId = await TezosLendingPlatform.ExitMarket(exitMarket, comptroller, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const exitMarketResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, exitMarketOpId, config.delay, config.networkBlockTime);
    statOperation(exitMarketResult);
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function getCollateral(keystore: KeyStore, protocolAddresses: TezosLendingPlatform.ProtocolAddresses) {
    log.info(`Get collateralized markets for ${keystore.publicKeyHash}`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode, config.conseilServer as ConseilServerInfo);
    const assets = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n\t ${JSON.stringify(assets)}`);
    return assets;
}


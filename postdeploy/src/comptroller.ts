import { ConseilServerInfo, KeyStore, Signer, TezosConseilClient } from 'conseiljs';
import { AssetType, Comptroller, ProtocolAddresses } from 'tezoslendingplatformjs';
import log from 'loglevel';
import * as config from '../config/config.json';
import { statOperation } from './util';

export async function enterMarkets(assets: AssetType[], keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
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
    const enterMarketsOpId = await Comptroller.EnterMarkets(markets, protocolAddresses.comptroller, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const enterMarketsResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, enterMarketsOpId, config.delay, config.networkBlockTime);
    statOperation(enterMarketsResult);
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function exitMarket(asset: AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    log.info(`Getting comptroller storage`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode, config.conseilServer as ConseilServerInfo);
    let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
    // exitMarket
    log.info(`exitMarket ${asset}`);
    const exitMarket: Comptroller.ExitMarketPair = {
        address: protocolAddresses.fTokens[asset]
    };
    const exitMarketOpId = await Comptroller.ExitMarket(exitMarket, protocolAddresses.comptroller, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const exitMarketResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, exitMarketOpId, config.delay, config.networkBlockTime);
    statOperation(exitMarketResult);
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function getCollateral(keystore: KeyStore, protocolAddresses: ProtocolAddresses) {
    log.info(`Get collateralized markets for ${keystore.publicKeyHash}`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode, config.conseilServer as ConseilServerInfo);
    const assets = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n\t ${JSON.stringify(assets)}`);
    return assets;
}


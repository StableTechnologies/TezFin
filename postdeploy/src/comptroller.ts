import { ConseilServerInfo, KeyStore, Signer, TezosConseilClient, TezosNodeReader } from 'conseiljs';
import { AssetType, Comptroller, ProtocolAddresses, TezosLendingPlatform } from 'tezoslendingplatformjs';
import log from 'loglevel';
import * as config from '../config/config.json';

export async function enterMarkets(assets: AssetType[], keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    log.info(`Getting comptroller storage`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode);
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
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash = await Comptroller.EnterMarkets(markets, protocolAddresses.comptroller, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function exitMarket(asset: AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    log.info(`Getting comptroller storage`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode);
    let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
    // exitMarket
    log.info(`exitMarket ${asset}`);
    const exitMarket: Comptroller.ExitMarketPair = {
        address: protocolAddresses.fTokens[asset]
    };
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash = await TezosLendingPlatform.ExitMarket(exitMarket, comptroller,protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
    collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n${JSON.stringify(collaterals)}`);
}

export async function getCollateral(keystore: KeyStore, protocolAddresses: ProtocolAddresses) {
    log.info(`Get collateralized markets for ${keystore.publicKeyHash}`);
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, config.tezosNode);
    const assets = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, config.tezosNode);
    log.info(`Current collateralized markets for ${keystore.publicKeyHash}:\n\t ${JSON.stringify(assets)}`);
    return assets;
}


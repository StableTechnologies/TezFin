import { KeyStore, Signer } from 'conseiljs';
import { AssetType, Comptroller, ProtocolAddresses, TezosLendingPlatform } from 'tezoslendingplatformjs';
import log from 'loglevel';
import * as config from '../config/config.json';
import { sendOperations } from './operations';

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
    await sendOperations(
        TezosLendingPlatform.EnterMarketsOpGroup(markets, collaterals, protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
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
    await sendOperations(
        TezosLendingPlatform.ExitMarketOpGroup(exitMarket, collaterals, protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
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

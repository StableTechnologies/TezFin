import * as ComptrollerHelper from './comptroller';
import * as DeployHelper from './deploy';
import * as FTokenHelper from './ftoken';
import * as config from '../config/config.json';

import { Comptroller, FToken, Governance, TezosLendingPlatform } from './tlp';
import { ConseilServerInfo, KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Tzip7ReferenceTokenHelper, registerFetch, registerLogger } from 'conseiljs';
import { CryptoUtils, KeyStoreUtils, SoftSigner } from 'conseiljs-softsigner';
import log, { LogLevelDesc } from 'loglevel';

import fetch from 'node-fetch';
import fs from 'fs';

let keystore: KeyStore | undefined = undefined;
let signer: Signer | undefined = undefined;
let protocolAddresses: TezosLendingPlatform.ProtocolAddresses | undefined = undefined;

async function initConseil() {
    log.setLevel(config.loglevel as LogLevelDesc);
    const logger = log.getLogger('conseiljs');
    logger.setLevel(config.loglevel as LogLevelDesc, false);
    registerLogger(logger);
    registerFetch(fetch);
}

async function initKeystore() {
    log.debug(`Reading faucet wallet file`);
    // const keystoreJSON = JSON.parse(fs.readFileSync(config.keystorePath, 'utf8'));

    keystore = await KeyStoreUtils.restoreIdentityFromFundraiser(config.keystore.mnemonic.join(' '), config.keystore.email, config.keystore.password, config.keystore.pkh);
    signer = await SoftSigner.createSigner(TezosMessageUtils.writeKeyWithHint(keystore.secretKey, 'edsk'));

    if (config.revealAccount) {
        log.info(`Activating account.`);
        const activateNodeResult = await TezosNodeWriter.sendIdentityActivationOperation(config.tezosNode, signer, keystore, config.keystore.activation_code);
        statOperation(activateNodeResult);
        log.info(`Revealing Account.`);
        const revealNodeResult = await TezosNodeWriter.sendKeyRevealOperation(config.tezosNode, signer, keystore);
        statOperation(revealNodeResult);
    }
}

async function demo1() {
    // supply
    for (const mint of config.mint)
        await FTokenHelper.mint(mint as TezosLendingPlatform.AssetType, keystore!, signer!, protocolAddresses!);
    // collateralize
    if (config.enterMarkets.length > 0)
        await ComptrollerHelper.enterMarkets(config.enterMarkets as TezosLendingPlatform.AssetType[], keystore!, signer!, protocolAddresses!);
    // get comptroller
    const comptroller = await Comptroller.GetStorage(protocolAddresses!.comptroller, protocolAddresses!, config.tezosNode, config.conseilServer as ConseilServerInfo);
    // borrow
    for (const borrow of config.borrow)
        await FTokenHelper.borrow(borrow as TezosLendingPlatform.AssetType, comptroller, protocolAddresses!, keystore!, signer!);
    // repay loan
    for (const repayBorrow of config.repayBorrow)
        await FTokenHelper.repayBorrow(repayBorrow as TezosLendingPlatform.AssetType, keystore!, signer!, protocolAddresses!);
    // redeem supplied tokens
    for (const redeem of config.redeem)
        await FTokenHelper.redeem(redeem as TezosLendingPlatform.AssetType, comptroller, protocolAddresses!, keystore!, signer!);
    // exit markets
    for (const asset of config.exitMarket)
        await ComptrollerHelper.exitMarket(asset as TezosLendingPlatform.AssetType, keystore!, signer!, protocolAddresses!);
}

async function main() {
    await initConseil();
    await initKeystore();
    // protocolAddresses = parseProtocolAddress(config.protocolAddressesPath);
    protocolAddresses = TezosLendingPlatform.granadanetAddresses;
    log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protocolAddresses!);

    // await demo1();
}

main();

export async function statOperation(result) {
    if (result['status'] === 'failed') {
        console.log(`${result['kind']} ${result['operation_group_hash']} ${result['status']} at block ${result['block_level']}`);
    } else if (result['status'] === 'applied') {
        let message = `\t${result['kind']} ${result['operation_group_hash']} included in block ${result['block_level']}.
            from ${result['source']} to ${result['destination']}
            gas cost: ${result['consumed_gas']}
            storage cost: ${result['paid_storage_size_diff']}`;

        if ('originated_contracts' in result && result['originated_contracts'] != null && result['originated_contracts'].length > 0) {
            message += `\n\tnew contract originated at ${result['originated_contracts']}`;
        }

        console.log(message);
    } else {
        console.log(JSON.stringify(result));
    }
}

function parseProtocolAddress(path: string): TezosLendingPlatform.ProtocolAddresses {
    const protocolAddressesJSON = JSON.parse(fs.readFileSync(path, 'utf8'));
    const fTokensReverse = {};
    fTokensReverse[protocolAddressesJSON.CXTZ] = TezosLendingPlatform.AssetType.XTZ;
    fTokensReverse[protocolAddressesJSON.CFA12] = TezosLendingPlatform.AssetType.ETH;
    fTokensReverse[protocolAddressesJSON.CFA2] = TezosLendingPlatform.AssetType.BTC;
    return {
        fTokens: {
            "XTZ": protocolAddressesJSON.CXTZ,
            "ETH": protocolAddressesJSON.CFA12,
            "BTC": protocolAddressesJSON.CFA2,
        },
        fTokensReverse: fTokensReverse,
        underlying: {
            "ETH": {
                assetType: TezosLendingPlatform.AssetType.ETH,
                address: protocolAddressesJSON.FA12,
            } as TezosLendingPlatform.UnderlyingAsset,
            "BTC": {
                assetType: TezosLendingPlatform.AssetType.BTC,
                address: protocolAddressesJSON.FA2,
                tokenId: 0
            } as TezosLendingPlatform.UnderlyingAsset
        },
        comptroller: protocolAddressesJSON.Comptroller,
        interestRateModel: {
            "XTZ": protocolAddressesJSON.CXTZ_IRM,
            "ETH": protocolAddressesJSON.CFA12_IRM,
            "BTC": protocolAddressesJSON.CFA2_IRM
        },
        governance: protocolAddressesJSON.Governance,
        oracleMap: protocolAddressesJSON.TezFinOracle
    };
}

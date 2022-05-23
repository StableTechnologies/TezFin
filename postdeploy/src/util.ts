import * as ComptrollerHelper from './comptroller';
import * as DeployHelper from './deploy';
import * as FTokenHelper from './ftoken';
import * as config from '../config/config.json';

import { AssetType, Comptroller, FToken, Governance, ProtocolAddresses, testnetAddresses, TezosLendingPlatform, TokenStandard, UnderlyingAsset } from 'tezoslendingplatformjs';
import { ConseilServerInfo, KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Tzip7ReferenceTokenHelper, registerFetch, registerLogger } from 'conseiljs';
import { CryptoUtils, KeyStoreUtils, SoftSigner } from 'conseiljs-softsigner';
import log, { LogLevelDesc } from 'loglevel';
import { JSONPath } from "jsonpath-plus";
import fetch from 'node-fetch';
import fs from 'fs';

let keystore: KeyStore | undefined = undefined;
let signer: Signer | undefined = undefined;
let protocolAddresses: ProtocolAddresses | undefined = undefined;

export async function initConseil() {
    log.setLevel(config.loglevel as LogLevelDesc);
    const logger = log.getLogger('conseiljs');
    logger.setLevel(config.loglevel as LogLevelDesc, false);
    registerLogger(logger);
    registerFetch(fetch);
}

export async function initKeystore() {
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
        await FTokenHelper.mint(mint as AssetType, keystore!, signer!, protocolAddresses!);
    // collateralize
    if (config.enterMarkets.length > 0)
        await ComptrollerHelper.enterMarkets(config.enterMarkets as AssetType[], keystore!, signer!, protocolAddresses!);
    // get comptroller
    const comptroller = await Comptroller.GetStorage(protocolAddresses!.comptroller, protocolAddresses!, config.tezosNode, config.conseilServer as ConseilServerInfo);
    // borrow
    for (const borrow of config.borrow)
        await FTokenHelper.borrow(borrow as AssetType, comptroller, protocolAddresses!, keystore!, signer!);
    // repay loan
    for (const repayBorrow of config.repayBorrow)
        await FTokenHelper.repayBorrow(repayBorrow as AssetType, keystore!, signer!, protocolAddresses!);
    // redeem supplied tokens
    for (const redeem of config.redeem)
        await FTokenHelper.redeem(redeem as AssetType, comptroller, protocolAddresses!, keystore!, signer!);
    // exit markets
    for (const asset of config.exitMarket)
        await ComptrollerHelper.exitMarket(asset as AssetType, keystore!, signer!, protocolAddresses!);
}

export async function deploy() {
    await initConseil();
    await initKeystore();
    // protocolAddresses = parseProtocolAddress(config.protocolAddressesPath);
    protocolAddresses = testnetAddresses;
    log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protocolAddresses!);

    // await demo1();
}

export async function deployE2E() {
    await initConseil();
    await initKeystore();
    const protocolAddresses = await parseProtocolAddress(config.protocolAddressesPath);
    log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protocolAddresses!);

    // await demo1();
}


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

async function parseProtocolAddress(path: string) {
    const protocolAddressesJSON = JSON.parse(fs.readFileSync(path, 'utf8'));
    const fTokensReverse = {};
    fTokensReverse[protocolAddressesJSON.CXTZ] = AssetType.XTZ;
    fTokensReverse[protocolAddressesJSON.CETHtz] = AssetType.ETH;
    fTokensReverse[protocolAddressesJSON.CUSDtz] = AssetType.USD;
    fTokensReverse[protocolAddressesJSON.CBTCtz] = AssetType.BTC;
    const oracleStorage = await TezosNodeReader.getContractStorage(config.tezosNode, protocolAddressesJSON.TezFinOracle);
    const oracleMap = Number(JSONPath({ path: '$.args[2].int', json: oracleStorage })[0]);
    const protoAddress: ProtocolAddresses = {
        fTokens: {
            "BTC": protocolAddressesJSON.CBTCtz,
            "XTZ": protocolAddressesJSON.CXTZ,
            "ETH": protocolAddressesJSON.CETHtz,
            "USD": protocolAddressesJSON.CUSDtz
        },
        fTokensReverse: fTokensReverse,
        underlying: {
            "ETH": {
                assetType: AssetType.ETH,
                tokenStandard: TokenStandard.FA12,
                decimals: 18,
                address: protocolAddressesJSON.ETHtz,
                balancesMapId: 34651,
                balancesPath: "$.args[1].int"
            },
            "USD": {
                assetType: AssetType.USD,
                address: protocolAddressesJSON.USDtz,
                balancesMapId: 34654,
                tokenStandard: TokenStandard.FA12,
                decimals: 6,
                balancesPath: "$.args[1].int"
            },
            "BTC": {
                assetType: AssetType.BTC,
                tokenStandard: TokenStandard.FA2,
                decimals: 8,
                address: protocolAddressesJSON.BTCtz,
                tokenId: 0,
                balancesMapId: 34646,
                balancesPath: "$.int"
            },
            "XTZ": {
                assetType: AssetType.XTZ,
                tokenStandard: TokenStandard.XTZ,
                decimals: 6
            }
        },
        comptroller: protocolAddressesJSON.Comptroller,
        interestRateModel: {
            "XTZ": protocolAddressesJSON.CXTZ_IRM,
            "ETH": protocolAddressesJSON.CFA12_IRM,
            "USD": protocolAddressesJSON.CFA12_IRM,
            "BTC": protocolAddressesJSON.CFA2_IRM
        },
        governance: protocolAddressesJSON.Governance,
        oracleMap: {
            "ETH": {
                id: oracleMap,
                path: "$.args[1].int"
            },
            "USD": {
                id: oracleMap,
                path: "$.args[1].int"
            },
            "BTC": {
                id: oracleMap,
                path: "$.args[1].int"
            },
            "XTZ": {
                id: oracleMap,
                path: "$.args[1].int"
            }
        }
    }
    protoAddress.underlying = await TezosLendingPlatform.PopulateTokenBalanceMapIDs(protoAddress.underlying, config.tezosNode)
    return protoAddress
}

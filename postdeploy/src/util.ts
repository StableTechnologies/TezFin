import * as ComptrollerHelper from './comptroller';
import * as DeployHelper from './deploy';
import * as FTokenHelper from './ftoken';
import * as config from '../config/config.json';

import { AssetType, Comptroller, FToken, Governance, PriceFeed, ProtocolAddresses, testnetAddresses, TezosLendingPlatform, TokenStandard, UnderlyingAsset } from 'tezoslendingplatformjs';
import { ConseilServerInfo, KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, TezosParameterFormat, Tzip7ReferenceTokenHelper, registerFetch, registerLogger } from 'conseiljs';
import { CryptoUtils, KeyStoreUtils, SoftSigner } from 'conseiljs-softsigner';
import log, { LogLevelDesc } from 'loglevel';
import { JSONPath } from "jsonpath-plus";
import fetch from 'node-fetch';
import fs from 'fs';

export async function initConseil() {
    log.setLevel(config.loglevel as LogLevelDesc);
    const logger = log.getLogger('conseiljs');
    logger.setLevel(config.loglevel as LogLevelDesc, false);
    registerLogger(logger);
    registerFetch(fetch);
    TezosLendingPlatform.initConseil(config.loglevel as LogLevelDesc)
}

export async function initKeystore(keystoreConfig: any = undefined): Promise<{
    keystore: KeyStore;
    signer: Signer;
}> {
    log.debug(`Reading faucet wallet file`);
    // const keystoreJSON = JSON.parse(fs.readFileSync(config.keystorePath, 'utf8'));
    if (keystoreConfig == null) {
        keystoreConfig = config.keystore
    }
    let keystore = await KeyStoreUtils.restoreIdentityFromFundraiser(keystoreConfig.mnemonic.join(' '), keystoreConfig.email, keystoreConfig.password, keystoreConfig.pkh);
    let signer = await SoftSigner.createSigner(TezosMessageUtils.writeKeyWithHint(keystore.secretKey, 'edsk'));

    if (config.revealAccount) {
        log.info(`Activating account.`);
        const activateNodeResult = await TezosNodeWriter.sendIdentityActivationOperation(config.tezosNode, signer, keystore, keystoreConfig.activation_code);
        statOperation(activateNodeResult);
        log.info(`Revealing Account.`);
        const revealNodeResult = await TezosNodeWriter.sendKeyRevealOperation(config.tezosNode, signer, keystore);
        statOperation(revealNodeResult);
    }
    return { keystore, signer }
}

async function test(keystore: KeyStore, signer: Signer, keystore1: KeyStore, signer1: Signer, protocolAddresses: ProtocolAddresses, oracle: string) {
    try {
        // set initial price for all assets
        await FTokenHelper.updatePrice([{ "asset": "ETH" as AssetType, price: 2000 * Math.pow(10, 6) }, { "asset": "BTC" as AssetType, price: 20000 * Math.pow(10, 6) }, { "asset": "XTZ" as AssetType, price: 2 * Math.pow(10, 6) }], oracle, keystore!, signer!, protocolAddresses!)
        // supply FOR USER 0
        for (const mint of ["ETH"])
            await FTokenHelper.mint(mint as AssetType, 10, keystore!, signer!, protocolAddresses!);
        // supply FOR USER 1
        for (const mint of ["USD",])
            await FTokenHelper.mint(mint as AssetType, 7000, keystore1!, signer1!, protocolAddresses!);
        // collateralize for user 1
        await ComptrollerHelper.enterMarkets(["USD"] as AssetType[], keystore1!, signer1!, protocolAddresses!);
        // get comptroller
        const comptroller = await Comptroller.GetStorage(protocolAddresses!.comptroller, protocolAddresses!, config.tezosNode, config.conseilServer as ConseilServerInfo);
        // borrow for user 1
        for (const borrow of ["ETH"])
            await FTokenHelper.borrow(borrow as AssetType, 3, comptroller, protocolAddresses!, keystore1!, signer1!);
        // set new price for liquidation
        await FTokenHelper.updatePrice([{ "asset": "ETH" as AssetType, price: 3000 * Math.pow(10, 6) }], oracle, keystore!, signer!, protocolAddresses!)
        // liquidate user 1 for 1 ETH
        await FTokenHelper.liquidate({ amount: 1, seizeCollateral: "USD" as AssetType, supplyCollateral: "ETH" as AssetType, borrower: keystore1.publicKeyHash }, keystore!, signer!, protocolAddresses!)
        // repay remaining loan
        for (const repayBorrow of ["ETH"])
            await FTokenHelper.repayBorrow(repayBorrow as AssetType, 3, keystore1!, signer1!, protocolAddresses!);
        // exit markets
        await ComptrollerHelper.exitMarket("USD" as AssetType, keystore1!, signer1!, protocolAddresses!);
        // redeem supplied tokens for user 0
        for (const redeem of ["ETH"])
            await FTokenHelper.redeem(redeem as AssetType, 10, comptroller, protocolAddresses!, keystore!, signer!);
        // redeem supplied tokens for user 1
        for (const redeem of ["USD"])
            await FTokenHelper.redeem(redeem as AssetType, 4000, comptroller, protocolAddresses!, keystore1!, signer1!);
    } catch (err) {
        console.log(JSON.stringify(err))
    }
}

export async function deploy() {
    await initConseil();
    const { keystore, signer } = await initKeystore();
    // protocolAddresses = parseProtocolAddress(config.protocolAddressesPath);
    const protocolAddresses = testnetAddresses;
    log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protocolAddresses!);
    // await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore.publicKeyHash, config.mintAmount);
}

export async function deployE2E() {
    await initConseil();
    const { keystore, signer } = await initKeystore();
    const { keystore: keystore1, signer: signer1 } = await initKeystore(config.keystore1);
    const { protoAddress, oracle } = await parseProtocolAddress(config.protocolAddressesPath);
    log.info(`protocolAddresses: ${JSON.stringify(protoAddress!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protoAddress!);
    await DeployHelper.mintFakeTokens(keystore!, signer!, protoAddress!, keystore.publicKeyHash, 10000);
    await DeployHelper.mintFakeTokens(keystore!, signer!, protoAddress!, keystore1.publicKeyHash, 10000);

    await test(keystore, signer, keystore1, signer1, protoAddress, oracle);
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
    return {
        protoAddress, oracle: protocolAddressesJSON.TezFinOracle
    }
}

import { initConseil, initKeystore, parseProtocolAddress } from "./util";
import * as DeployHelper from './deploy';
import * as FTokenHelper from './ftoken';
import { ConseilServerInfo, KeyStore, Signer } from "conseiljs";
import * as ComptrollerHelper from './comptroller';
import { AssetType, Comptroller, ProtocolAddresses } from "tezoslendingplatformjs";
import * as config from '../config/config.json';

async function test(keystore: KeyStore, signer: Signer, keystore1: KeyStore, signer1: Signer, protocolAddresses: ProtocolAddresses, oracle: string) {
    try {
        // mint underlying tokens to both users 
        await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore.publicKeyHash);
        await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore1.publicKeyHash);

        // set initial price for all assets
        await FTokenHelper.updatePrice([{ "asset": "ETH" as AssetType, price: 2000 * Math.pow(10, 6) }, { "asset": "BTC" as AssetType, price: 20000 * Math.pow(10, 6) }, { "asset": "XTZ" as AssetType, price: 2 * Math.pow(10, 6) }], oracle, keystore!, signer!, protocolAddresses!)

        // supply FOR USER 0
        for (const mint of ["ETH"])
            await FTokenHelper.mint(mint as AssetType, 10, keystore!, signer!, protocolAddresses!);
        // supply FOR USER 1
        for (const mint of ["USD",])
            await FTokenHelper.mint(mint as AssetType, 12000, keystore1!, signer1!, protocolAddresses!);
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

async function runE2E() {
    await initConseil();
    const { keystore, signer } = await initKeystore();
    const { keystore: keystore1, signer: signer1 } = await initKeystore(config.keystore1);
    const { protoAddress, oracle } = await parseProtocolAddress(config.protocolAddressesPath);
    console.log(`protocolAddresses: ${JSON.stringify(protoAddress!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protoAddress!);

    return test(keystore, signer, keystore1, signer1, protoAddress, oracle);
}

runE2E();

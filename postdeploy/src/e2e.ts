import { initConseil, initKeystore, parseProtocolAddress, printStatus, getGlobalStateOfAllTokens } from "./util";
import * as DeployHelper from './deploy';
import * as FTokenHelper from './ftoken';
import * as Model from './model';
import { ConseilServerInfo, KeyStore, Signer } from "conseiljs";
import * as ComptrollerHelper from './comptroller';
import { AssetType, TezosLendingPlatform, Comptroller, ProtocolAddresses } from "tezoslendingplatformjs";
import * as config from '../config/config.json';

async function test(keystore: KeyStore, signer: Signer, keystore1: KeyStore, signer1: Signer, keystore2: KeyStore, signer2: Signer, protocolAddresses: ProtocolAddresses, oracle: string) {
    try {
        // mint underlying tokens to both users 
        await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore.publicKeyHash);
        await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore1.publicKeyHash);
        await DeployHelper.mintFakeTokens(keystore!, signer!, protocolAddresses!, keystore2.publicKeyHash);

        // set initial price for all assets
        await FTokenHelper.updatePrice([{ "asset": "ETH" as AssetType, price: 2000 * Math.pow(10, 6) }, { "asset": "BTC" as AssetType, price: 20000 * Math.pow(10, 6) }, { "asset": "XTZ" as AssetType, price: 2 * Math.pow(10, 6) }], oracle, keystore!, signer!, protocolAddresses!)

        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));

        // supply FOR USER A
        for (const mint of ["USD"])
            await FTokenHelper.mint(mint as AssetType, 20000, keystore!, signer!, protocolAddresses!);

        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));

        // supply FOR USER B
        for (const mint of ["ETH",])
            await FTokenHelper.mint(mint as AssetType, 6, keystore1!, signer1!, protocolAddresses!);

        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));

        // supply FOR USER C
        for (const mint of ["BTC",])
            await FTokenHelper.mint(mint as AssetType, 6, keystore2!, signer2!, protocolAddresses!);
        // collateralize for user B
        await ComptrollerHelper.enterMarkets(["ETH"] as AssetType[], keystore1!, signer1!, protocolAddresses!);
        // collateralize for user C
        await ComptrollerHelper.enterMarkets(["BTC"] as AssetType[], keystore2!, signer2!, protocolAddresses!);
        // get comptroller
        const comptroller = await Comptroller.GetStorage(protocolAddresses!.comptroller, protocolAddresses!, config.tezosNode, config.conseilServer as ConseilServerInfo);
        const market = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses!, config.tezosNode);
        const addresses = [keystore.publicKeyHash,keystore1.publicKeyHash,keystore2.publicKeyHash];
        
       console.log("[--] Status of Markets :\n", JSON.stringify(market));
        await printStatus(comptroller, market,protocolAddresses,config.tezosNode,addresses);
        
        // sleep for 1 min
        await new Promise(r => setTimeout(r, 60000));
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 2; j++) {
                // borrow USD for user B and C
                await FTokenHelper.borrow("USD" as AssetType, 500, comptroller, protocolAddresses!, keystore1!, signer1!);
		// TODO test get state

//		var state: Model.State = await getGlobalStateOfAllTokens(comptroller, market, protocolAddresses, config.tezosNode, addresses);
//		 
//                console.log("\n\n\n [!!] final state top level ", state);
//		Model.nextState(state, Model.showState);
                await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
                await new Promise(r => setTimeout(r, 35000));
                await FTokenHelper.borrow("USD" as AssetType, 500, comptroller, protocolAddresses!, keystore2!, signer2!);
                await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
                await new Promise(r => setTimeout(r, 35000));
                // alternatingly repay loans for user B and C
                if (j % 2 != 0)
                    await FTokenHelper.repayBorrow("USD" as AssetType, 200, keystore1!, signer1!, protocolAddresses!);
                else
                    await FTokenHelper.repayBorrow("USD" as AssetType, 200, keystore2!, signer2!, protocolAddresses!);
                // sleep for 30 sec
                await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
                await new Promise(r => setTimeout(r, 35000));
            }
        }
        // set new price for liquidation
        await FTokenHelper.updatePrice([{ "asset": "ETH" as AssetType, price: 1000 * Math.pow(10, 6) }], oracle, keystore!, signer!, protocolAddresses!)
        // liquidate user A for 1000 USD
        await FTokenHelper.liquidate({ amount: 1000, seizeCollateral: "ETH" as AssetType, supplyCollateral: "USD" as AssetType, borrower: keystore1.publicKeyHash }, keystore!, signer!, protocolAddresses!)
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);

        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        // repay remaining amounts
        await FTokenHelper.repayBorrow("USD" as AssetType, 3500, keystore1!, signer1!, protocolAddresses!);
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
        
        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        await FTokenHelper.repayBorrow("USD" as AssetType, 4500, keystore2!, signer2!, protocolAddresses!);
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
        
        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        // exit markets
        await ComptrollerHelper.exitMarket("ETH" as AssetType, keystore1!, signer1!, protocolAddresses!);
        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        await ComptrollerHelper.exitMarket("BTC" as AssetType, keystore2!, signer2!, protocolAddresses!);
        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        // redeem supplied tokens for user B
        for (const redeem of ["ETH"])
            await FTokenHelper.redeem(redeem as AssetType, 4.95, comptroller, protocolAddresses!, keystore1!, signer1!);
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
        
        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        // redeem supplied tokens for user C
        for (const redeem of ["BTC"])
            await FTokenHelper.redeem(redeem as AssetType, 6, comptroller, protocolAddresses!, keystore2!, signer2!);
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);

        // sleep for 30 sec
        await new Promise(r => setTimeout(r, 30000));
        // redeem supplied tokens for user A
        for (const redeem of ["USD"])
            await FTokenHelper.redeem(redeem as AssetType, 20000, comptroller, protocolAddresses!, keystore!, signer!);
        await printStatus(comptroller, market, protocolAddresses, config.tezosNode, addresses);
    } catch (err) {
        console.log(JSON.stringify(err))
    }
}

async function runE2E() {
    await initConseil();
    const { keystore, signer } = await initKeystore();
    const { keystore: keystore1, signer: signer1 } = await initKeystore(config.keystore1);
    const { keystore: keystore2, signer: signer2 } = await initKeystore(config.keystore2);
    const { protoAddress, oracle } = await parseProtocolAddress(config.protocolAddressesPath);
    console.log(`protocolAddresses: ${JSON.stringify(protoAddress!)}`);

    await DeployHelper.postDeploy(keystore!, signer!, protoAddress!);

    return test(keystore, signer, keystore1, signer1, keystore2, signer2, protoAddress, oracle);
}

runE2E();

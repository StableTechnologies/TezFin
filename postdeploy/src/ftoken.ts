import { KeyStore, Signer, TezosConseilClient, Tzip7ReferenceTokenHelper, MultiAssetTokenHelper, TezosNodeReader} from 'conseiljs';
import { TezosLendingPlatform, FToken, Comptroller, AssetType, ProtocolAddresses } from 'tezoslendingplatformjs';
import log from 'loglevel';
import * as config from '../config/config.json';

export async function mint(asset: AssetType, amount:number, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let mint: FToken.MintPair = {
        underlying: asset,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`mint ${asset} parameters: ${JSON.stringify(mint)}`);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash = await TezosLendingPlatform.Mint(mint, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

export async function redeem(asset: AssetType, amount:number, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const redeem: FToken.RedeemPair = {
        underlying: asset as AssetType,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`redeem ${asset} parameters: ${JSON.stringify(redeem)}`);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash =  await TezosLendingPlatform.Redeem(redeem, comptroller, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

export async function borrow(asset: AssetType, amount:number, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const borrow: FToken.BorrowPair = {
        underlying: asset as AssetType,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`borrow ${asset} parameters: ${JSON.stringify(borrow)}`);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash = await TezosLendingPlatform.Borrow(borrow, comptroller, protocolAddresses, config.tezosNode, signer, keystore);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

export async function repayBorrow(asset: AssetType, amount: number, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let repayBorrow: FToken.RepayBorrowPair = {
        underlying: asset,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`repayBorrow ${asset} parameters: ${JSON.stringify(repayBorrow)}`);
    const head = await TezosNodeReader.getBlockHead(config.tezosNode)
    const opHash =  await TezosLendingPlatform.RepayBorrow(repayBorrow, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    await TezosNodeReader.awaitOperationConfirmation(config.tezosNode, head.header.level - 1, opHash, 6).then(res => { if (res['contents'][0]['metadata']['operation_result']['status'] === "applied") return res; else throw new Error("operation status not applied"); }).catch((error) => { console.log(error) });
}

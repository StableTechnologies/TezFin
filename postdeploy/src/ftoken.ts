import { KeyStore, Signer, TezosConseilClient, Tzip7ReferenceTokenHelper, MultiAssetTokenHelper} from 'conseiljs';
import { TezosLendingPlatform, FToken, Comptroller, AssetType, ProtocolAddresses } from 'tezoslendingplatformjs';
import log from 'loglevel';
import * as config from '../config/config.json';
import { statOperation } from './util';

export async function mint(asset: AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let mint: FToken.MintPair = {
        underlying: asset,
        amount: (asset == AssetType.XTZ ? 1000000 : 1) * config.mintAmount
    };
    log.info(`mint ${asset} parameters: ${JSON.stringify(mint)}`);
    const mintOpId = await TezosLendingPlatform.Mint(mint, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const mintResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, mintOpId, config.delay, config.networkBlockTime);
    statOperation(mintResult);
}

export async function redeem(asset: AssetType, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const redeem: FToken.RedeemPair = {
        underlying: asset as AssetType,
        amount: (asset == AssetType.XTZ ? 1000000 : 1) * config.redeemAmount
    };
    log.info(`redeem ${asset} parameters: ${JSON.stringify(redeem)}`);
    const redeemETHOpId = await TezosLendingPlatform.Redeem(redeem, comptroller, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const redeemETHResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, redeemETHOpId, config.delay, config.networkBlockTime);
    statOperation(redeemETHResult);
}

export async function borrow(asset: AssetType, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const borrow: FToken.BorrowPair = {
        underlying: asset as AssetType,
        amount: (asset == AssetType.XTZ ? 1000000 : 1) * config.borrowAmount
    };
    log.info(`borrow ${asset} parameters: ${JSON.stringify(borrow)}`);
    const borrowOpId = await TezosLendingPlatform.Borrow(borrow, comptroller, protocolAddresses, config.tezosNode, signer, keystore);
    const borrowResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, borrowOpId, config.delay, config.networkBlockTime);
    statOperation(borrowResult);
}

export async function repayBorrow(asset: AssetType, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let repayBorrow: FToken.RepayBorrowPair = {
        underlying: asset,
        amount: (asset == AssetType.XTZ ? 1000000 : 1) * config.repayBorrowAmount
    };
    log.info(`repayBorrow ${asset} parameters: ${JSON.stringify(repayBorrow)}`);
    const repayBorrowOpId = await TezosLendingPlatform.RepayBorrow(repayBorrow, protocolAddresses, config.tezosNode, signer, keystore, config.tx.fee, config.tx.gas, config.tx.freight);
    const repayBorrowResult = await TezosConseilClient.awaitOperationConfirmation(config.conseilServer, config.conseilServer.network, repayBorrowOpId, config.delay, config.networkBlockTime);
    statOperation(repayBorrowResult);
}

import { KeyStore, Signer } from 'conseiljs';
import { TezosLendingPlatform, FToken, Comptroller, AssetType, ProtocolAddresses, PriceFeed } from 'tezoslendingplatformjs';
import log from 'loglevel';
import { ContractOperation, sendOperations } from './operations';

export async function mint(asset: AssetType, amount:number, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let mint: FToken.MintPair = {
        underlying: asset,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`mint ${asset} parameters: ${JSON.stringify(mint)}`);
    await sendOperations(
        TezosLendingPlatform.MintOpGroup(mint, protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
}

export async function redeem(asset: AssetType, amount:number, _comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const redeem: FToken.RedeemPair = {
        underlying: asset as AssetType,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals),
        amountInUnderlying: false
    };
    log.info(`redeem ${asset} parameters: ${JSON.stringify(redeem)}`);
    await sendOperations(
        TezosLendingPlatform.RedeemOpGroup(redeem, [], protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
}

export async function borrow(asset: AssetType, amount:number, _comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, keystore: KeyStore, signer: Signer) {
    const borrow: FToken.BorrowPair = {
        underlying: asset as AssetType,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`borrow ${asset} parameters: ${JSON.stringify(borrow)}`);
    await sendOperations(
        TezosLendingPlatform.BorrowOpGroup(borrow, [], protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
}

export async function repayBorrow(asset: AssetType, amount: number, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    let repayBorrow: FToken.RepayBorrowPair = {
        underlying: asset,
        amount: amount * Math.pow(10,protocolAddresses.underlying[asset].decimals)
    };
    log.info(`repayBorrow ${asset} parameters: ${JSON.stringify(repayBorrow)}`);
    await sendOperations(
        TezosLendingPlatform.RepayBorrowOpGroup(repayBorrow, protocolAddresses, keystore.publicKeyHash),
        keystore,
        signer,
    );
}

interface PriceUpdate {
    asset: AssetType;
    price: number;
}

export async function updatePrice(priceList: PriceUpdate[], oracle: string, keystore: KeyStore, signer: Signer, _protocolAddresses: ProtocolAddresses) {
    log.info(`updating asset prices : `,JSON.stringify(priceList));
    await sendOperations([{
        to: oracle,
        amount: 0,
        mutez: true,
        parameter: {
            entrypoint: 'setPrice',
            value: priceList.map(({ asset, price }) => ({
                prim: 'Pair',
                args: [{ string: asset }, { int: String(price) }],
            })),
        },
    }], keystore, signer);
}

export async function liquidate(details: FToken.LiquidateDetails, keystore: KeyStore, signer: Signer, protocolAddresses: ProtocolAddresses) {
    log.info(`liquidating ${details.borrower} asset ${details.seizeCollateral} for amout of ${details.amount} with asset ${details.supplyCollateral}`);
    details.amount = details.amount * Math.pow(10, protocolAddresses.underlying[details.supplyCollateral].decimals)
    const operations: ContractOperation[] = [
        ...Comptroller.DataRelevanceOpGroup([], protocolAddresses, keystore.publicKeyHash, details.borrower),
        ...(TezosLendingPlatform.permissionOperation(
            details.supplyCollateral,
            details.amount,
            false,
            protocolAddresses,
            keystore.publicKeyHash,
        ) || []),
        {
            to: protocolAddresses.fTokens[details.supplyCollateral],
            amount: details.supplyCollateral === AssetType.XTZ ? details.amount : 0,
            mutez: true,
            parameter: {
                entrypoint: 'liquidateBorrow',
                value: {
                    prim: 'Pair',
                    args: [
                        { string: details.borrower },
                        {
                            prim: 'Pair',
                            args: [
                                { string: protocolAddresses.fTokens[details.seizeCollateral] },
                                { int: String(details.amount) },
                            ],
                        },
                    ],
                },
            },
        },
        ...(TezosLendingPlatform.permissionOperation(
            details.supplyCollateral,
            details.amount,
            true,
            protocolAddresses,
            keystore.publicKeyHash,
        ) || []),
    ];
    await sendOperations(operations, keystore, signer);
}

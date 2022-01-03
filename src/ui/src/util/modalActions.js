import { TezosLendingPlatform } from 'tezoslendingplatformjs';

import { confirmOps } from './index.js';

/**
 * This function is used to supply tokens to the market.
 *
 * @param  mintPair underlying asset and amount to be supplied
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const supplyTokenAction = (mintPair, protocolAddresses, publicKeyHash) => {
    const mint = TezosLendingPlatform.MintOpGroup(
        mintPair,
        protocolAddresses,
        publicKeyHash
    );
   return confirmOps(mint, publicKeyHash);
};

/**
 * This function is used for redeeming tokens for the underlying asset..
 *
 * @param  redeemPair underlying asset and amount to be redeemed
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const withdrawTokenAction = (redeemPair, protocolAddresses, publicKeyHash) => {
    redeemPair.underlying = redeemPair.underlying.toUpperCase();
    const collaterals = redeemPair.underlying;

    const withdraw = TezosLendingPlatform.RedeemOpGroup(
        redeemPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );
   return confirmOps(withdraw);
};

/**
 * This function is used for borrowing tokens for the underlying asset..
 *
 * @param  borrowPair underlying asset and amount to be borrowed
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const borrowTokenAction = (borrowPair, protocolAddresses, publicKeyHash) => {
    borrowPair.underlying = borrowPair.underlying.toUpperCase();
    const collaterals = Object.keys(protocolAddresses.fTokens);
    const borrow = TezosLendingPlatform.BorrowOpGroup(
        borrowPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );
   return confirmOps(borrow);
};

/**
 * This function is used for repaying tokens for the underlying asset.
 *
 * @param  repayBorrowPair underlying asset and amount to be repayed.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const repayBorrowTokenAction = (repayBorrowPair, protocolAddresses, publicKeyHash) => {
    repayBorrowPair.underlying = repayBorrowPair.underlying.toUpperCase();
    const repayBorrow = TezosLendingPlatform.RepayBorrowOpGroup(
        repayBorrowPair,
        protocolAddresses,
        publicKeyHash
    );
   return confirmOps(repayBorrow);
};

/**
 * This function is used for collateralizing tokens for the underlying asset.
 *
 * @param asset Underlying asset.
 * @param protocolAddresses Addresses of the protocol contracts.
 * @param publicKeyHash Address of the connected account.
 */
export const collateralizeTokenAction = (asset, protocolAddresses, publicKeyHash) => {
    const enterMarketsPair = { fTokens: [protocolAddresses.fTokens[asset]] };
    const collaterals = [asset];
    const collateralizeToken = TezosLendingPlatform.EnterMarketsOpGroup(
        enterMarketsPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );
   return confirmOps(collateralizeToken);
};

/**
 * This function is used for disabling collateralize tokens for the underlying asset.
 *
 * @param asset Underlying asset.
 * @param protocolAddresses Addresses of the protocol contracts.
 * @param publicKeyHash Address of the connected account.
 */
export const disableCollateralizeTokenAction = (asset, protocolAddresses, publicKeyHash) => {
    const exitMarketsPair = { address: protocolAddresses.fTokens[asset] };
    const collaterals = [asset];
    const disableCollateralizeToken = TezosLendingPlatform.ExitMarketOpGroup(
        exitMarketsPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );

   return confirmOps(disableCollateralizeToken);
};

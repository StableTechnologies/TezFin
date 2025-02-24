import { TezosLendingPlatform } from 'tezoslendingplatformjs';

import { evaluateTransaction } from './index';

/**
 * This function is used to supply tokens to the market.
 * @param  tokenDetails underlying asset.
 * @param  amount amount to be supplied.
 * @param  close close Modal.
 * @param  setTokenText set text for confirmation modal.
 * @param  handleOpenInitialize open initial operation modal.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const supplyTokenAction = async (tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash) => {
    const underlying = tokenDetails.assetType.toLowerCase();
    const mintPair = { underlying, amount };
    close();
    setTokenText('supply');
    handleOpenInitialize();
    const mint = TezosLendingPlatform.MintOpGroup(
        mintPair,
        protocolAddresses,
        publicKeyHash
    );
    return evaluateTransaction(mint);
};

/**
 * This function is used for redeeming tokens for the underlying asset..
 * @param  tokenDetails underlying asset.
 * @param  amount amount to be redeemed.
 * @param  close close Modal.
 * @param  setTokenText set text for confirmation modal.
 * @param  handleOpenInitialize open initial operation modal.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const withdrawTokenAction = async (tokenDetails, amount, amountInUnderlying, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash) => {
    const underlying = tokenDetails.assetType.toUpperCase();
    const redeemPair = { underlying, amount, amountInUnderlying };
    close();
    setTokenText('withdraw');
    handleOpenInitialize();
    const collaterals = redeemPair.underlying;
    const withdraw = TezosLendingPlatform.RedeemOpGroup(
        redeemPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );
    return evaluateTransaction(withdraw);
};

/**
 * This function is used for borrowing tokens for the underlying asset..
 **@param  tokenDetails underlying asset.
 * @param  amount amount to be borrowed.
 * @param  close close Modal.
 * @param  setTokenText set text for confirmation modal.
 * @param  handleOpenInitialize open initial operation modal.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const borrowTokenAction = async (tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash) => {
    const underlying = tokenDetails.assetType.toUpperCase();
    const borrowPair = { underlying, amount };
    close();
    setTokenText('borrow');
    handleOpenInitialize();
    const collaterals = Object.keys(protocolAddresses.fTokens);
    const borrow = TezosLendingPlatform.BorrowOpGroup(
        borrowPair,
        collaterals,
        protocolAddresses,
        publicKeyHash
    );
    return evaluateTransaction(borrow);
};

/**
 * This function is used for repaying tokens for the underlying asset.
 * @param  tokenDetails underlying asset.
 * @param  amount amount to be repaid.
 * @param  close close Modal.
 * @param  setTokenText set text for confirmation modal.
 * @param  handleOpenInitialize open initial operation modal.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const repayBorrowTokenAction = async (tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash) => {
    const underlying = tokenDetails.assetType.toUpperCase();
    const repayBorrowPair = { underlying, amount };
    close();
    setTokenText('repay');
    handleOpenInitialize();
    const repayBorrow = TezosLendingPlatform.RepayBorrowOpGroup(
        repayBorrowPair,
        protocolAddresses,
        publicKeyHash
    );
    return evaluateTransaction(repayBorrow);
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
    return evaluateTransaction(collateralizeToken);
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

    return evaluateTransaction(disableCollateralizeToken);
};

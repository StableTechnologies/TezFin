import BigNumber from 'bignumber.js';
import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import {
    GET_ALL_MARKET_DATA, GET_BORROWED_MARKET_DATA, GET_MARKET_DATA, GET_SUPPLIED_MARKET_DATA
} from './types';
import { formatTokenData } from '../../util';
import { tokens } from '../../components/Constants';

/**
 * This function is used to get the market data .
 *
 * @param comptroller Comptroller storage.
 * @param protocolAddresses Addresses of the protocol contracts
 * @param server server address
 */
export const marketAction = (comptroller, protocolAddresses, server) => async (dispatch) => {
    if (comptroller) {
        const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
        dispatch({ type: GET_MARKET_DATA, payload: markets });
    }
};

/**
 * This function is used to get the global market details.
 *
 * @param account
 * @param markets
 * @returns market details
 */
export const allMarketAction = (account, markets) => (dispatch) => {
    const marketTokens = [...tokens];
    const walletBalance = account.underlyingBalances || [];
    const suppliedMarket = TezosLendingPlatform.getSuppliedMarkets(account, markets);
    const borrowedMarket = TezosLendingPlatform.getBorrowedMarkets(account, markets);

    const formattedTokens = marketTokens.map((token) => {
        if (Object.keys(markets).length > 0 && Object.prototype.hasOwnProperty.call(markets, token.assetType)) {
            const market = markets[token.assetType];
            const tokenWalletBalance = Object.keys(walletBalance).length > 0
                && Object.prototype.hasOwnProperty.call(walletBalance, token.assetType)
                ? walletBalance[token.assetType].toString()
                : '';

            return {
                ...token,
                supply: { ...suppliedMarket[token.assetType] },
                borrow: { ...borrowedMarket[token.assetType] },
                usdPrice: new BigNumber(market.currentPrice.toString())
                    .div(new BigNumber(10).pow(new BigNumber(6)))
                    .toFixed(4),
                marketSize: market.supply.totalAmount.toString(),
                totalBorrowed: market.borrow.totalAmount.toString(),
                available: market.available,
                supplyRate: market.supply.rate.toString(),
                borrowRate: market.borrow.rate.toString(),
                borrowRateFn: market.borrow.rateFn,
                walletBalance: tokenWalletBalance,
                collateralFactor: new BigNumber(market.collateralFactor.toString())
                    .div(new BigNumber(10).pow(new BigNumber(18)))
                    .toFixed(),
                isListed: market.isListed,
                mintPaused: market.mintPaused,
                borrowPaused: market.borrowPaused,
                redeemPaused: market.redeemPaused
            };
        }
        return { ...token };
    });
    dispatch({ type: GET_ALL_MARKET_DATA, payload: formattedTokens });
    // eslint-disable-next-line no-use-before-define
    dispatch(suppliedMarketAction(formattedTokens));
    // eslint-disable-next-line no-use-before-define
    dispatch(borrowedMarketAction(formattedTokens));
};

/**
 * This function is used to get the supplied market data in which an account has supplied.
 *
 * @param markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (markets) => (dispatch) => {
    const suppliedTokens = markets.map(
        ({
            assetType,
            banner,
            title,
            name,
            logo,
            fLogo,
            usdPrice,
            address,
            walletBalance,
            collateralFactor,
            isListed,
            mintPaused,
            borrowPaused,
            redeemPaused,
            supply
        }) => ({
            assetType,
            banner,
            title,
            name,
            logo,
            fLogo,
            usdPrice,
            address,
            walletBalance,
            collateralFactor,
            isListed,
            mintPaused,
            borrowPaused,
            redeemPaused,
            ...supply
        })
    );

    dispatch({
        type: GET_SUPPLIED_MARKET_DATA,
        payload: formatTokenData(suppliedTokens)
    });
};

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (markets) => (dispatch) => {
    // eslint-disable-next-line object-curly-newline
    const borrowedTokens = markets.map(
        ({
            assetType,
            banner,
            title,
            name,
            logo,
            address,
            usdPrice,
            walletBalance,
            collateralFactor,
            isListed,
            mintPaused,
            borrowPaused,
            redeemPaused,
            borrow
        }) => ({
            assetType,
            banner,
            title,
            name,
            logo,
            usdPrice,
            address,
            walletBalance,
            collateralFactor,
            isListed,
            mintPaused,
            borrowPaused,
            redeemPaused,
            ...borrow
        })
    );

    dispatch({
        type: GET_BORROWED_MARKET_DATA,
        payload: formatTokenData(borrowedTokens)
    });
};

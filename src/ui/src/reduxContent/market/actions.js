import { BigNumber } from 'bignumber.js';
import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import {
    GET_ALL_MARKET_DATA,
    GET_BORROWED_MARKET_DATA,
    GET_MARKET_DATA,
    GET_SUPPLIED_MARKET_DATA
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

    marketTokens.map((token) => {
        if (Object.keys(markets).length > 0 && markets.hasOwnProperty(token.assetType)) {
            token.supply = { ...suppliedMarket[token.assetType] };
            token.borrow = { ...borrowedMarket[token.assetType] };
            token.usdPrice = new BigNumber(markets[token.assetType].currentPrice.toString()).div(new BigNumber(10).pow(new BigNumber(6))).toFixed(4);
            token.marketSize = markets[token.assetType].supply.totalAmount.toString();
            token.totalBorrowed = markets[token.assetType].borrow.totalAmount.toString();
            token.supplyRate = markets[token.assetType].supply.rate.toString();
            token.borrowRate = markets[token.assetType].borrow.rate.toString();
            token.walletBalance = '';
            token.collateralFactor = new BigNumber(markets[token.assetType].collateralFactor.toString()).div(new BigNumber(10).pow(new BigNumber(18))).toFixed();
            if (Object.keys(walletBalance).length > 0 && walletBalance.hasOwnProperty(token.assetType)) {
                token.walletBalance = walletBalance[token.assetType].toString();
            }
        }
        return marketTokens;
    });
    dispatch({ type: GET_ALL_MARKET_DATA, payload: marketTokens });
};

/**
 * This function is used to get the supplied market data in which an account has supplied.
 *
 * @param markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (markets) => (dispatch) => {
    const suppliedTokens = markets.map(({ assetType, banner, title, logo, usdPrice, walletBalance, collateralFactor, supply }) => ({
        assetType,
        banner,
        title,
        logo,
        usdPrice,
        walletBalance,
        collateralFactor,
        ...supply
    }));

    dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: formatTokenData(suppliedTokens) });
};

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (markets) => (dispatch) => {
    // eslint-disable-next-line object-curly-newline
    const borrowedTokens = markets.map(({ assetType, banner, title, logo, usdPrice, walletBalance, collateralFactor, borrow }) => ({
        assetType,
        banner,
        title,
        logo,
        usdPrice,
        walletBalance,
        collateralFactor,
        ...borrow
    }));

    dispatch({ type: GET_BORROWED_MARKET_DATA, payload: formatTokenData(borrowedTokens) });
};

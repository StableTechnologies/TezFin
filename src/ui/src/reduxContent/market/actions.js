import {
    GET_ALL_MARKET_DATA,
    GET_BORROWED_MARKET_DATA,
    GET_MARKET_DATA,
    GET_SUPPLIED_MARKET_DATA,
} from './types';

import { BigNumber } from "bignumber.js";
import { TezosLendingPlatform } from 'tezoslendingplatformjs';
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
        console.log("markets ::: ", markets);
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
export const allMarketAction = (account, markets) => async (dispatch) => {
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
 * @param account
 * @param markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (account, markets) => async (dispatch) => {
    const suppliedMarket = TezosLendingPlatform.getSuppliedMarkets(account, markets);

    const suppliedTokens = tokens.map(({ assetType, banner, title, logo,usdPrice, walletBalance }) => ({
      assetType,
      banner,
      title,
      logo,
      usdPrice,
      walletBalance,
    }));

    suppliedTokens.map((token) => {
      if (Object.keys(suppliedMarket).length > 0 && suppliedMarket.hasOwnProperty(token.assetType)) {
        token.rate = suppliedMarket[token.assetType].rate;
        token.balanceUnderlying = suppliedMarket[token.assetType].balanceUnderlying;
        token.collateral = suppliedMarket[token.assetType].collateral;
      }
    })
    dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: formatTokenData(suppliedTokens) });
};

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param account
 * @param markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (account, markets) => async (dispatch) => {
    const borrowedMarket = TezosLendingPlatform.getBorrowedMarkets(account, markets);

    const borrowedTokens = tokens.map(({ assetType, banner, title, logo,usdPrice, walletBalance }) => ({
      assetType,
      banner,
      title,
      logo,
      usdPrice,
      walletBalance,
    }));

    borrowedTokens.map((token) => {
      if (Object.keys(borrowedMarket).length > 0 && borrowedMarket.hasOwnProperty(token.assetType)) {
        token.rate = borrowedMarket[token.assetType].rate;
        token.balanceUnderlying = borrowedMarket[token.assetType].balanceUnderlying;
        token.liquidityUnderlying = borrowedMarket[token.assetType].liquidityUnderlying;
        token.collateral = borrowedMarket[token.assetType].collateral;
      }
    })

    dispatch({ type: GET_BORROWED_MARKET_DATA, payload: formatTokenData(borrowedTokens) });
};

import {
  GET_MARKET_DATA,
  GET_SUPPLIED_MARKET_DATA, GET_UNSUPPLIED_MARKET_DATA,
  GET_BORROWED_MARKET_DATA, GET_UNBORROWED_MARKET_DATA
} from './types.js';

import { TezosLendingPlatform } from 'tezoslendingplatformjs';

import { tokens } from '../../components/Constants';

/**
 * This function is used to get the market data .
 *
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 */
export const marketAction = (comptroller, protocolAddresses, server)=> async (dispatch) => {
  if(comptroller) {
    const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
    dispatch({ type: GET_MARKET_DATA, payload: markets });
  }
}

/**
 * This function is used to get the supplied market data in which an account has supplied.
 *
 * @param  account
 * @param  markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (account, markets)=> async (dispatch) => {
  const suppliedMarket = TezosLendingPlatform.getSuppliedMarkets(account, markets);
  const suppliedTokens =  JSON.parse(JSON.stringify(tokens));
  const balances = account.underlyingBalances;

  Object.entries((suppliedMarket)).map((y)=>{
    suppliedTokens.map((x)=>{
      if(y[0].toLowerCase() === x.assetType.toLowerCase()) {
        y[1].assetType = x.assetType
        y[1].banner = x.banner
        y[1].title = x.title
        y[1].logo = x.logo
      }
      return suppliedTokens;
    });
    Object.entries((balances)).map((x)=>{
      if(x[0].toLowerCase() === y[1].assetType.toLowerCase()) {
        y[1].balance = x[1].toString();
      }
      return balances;
    });
    return suppliedMarket;
  });
  dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: Object.values(suppliedMarket) });
}

/**
 * This function is used to get the supply market data in which an account has *NO* suppplied funds.
 *
 * @param account
 * @param markets
 * @returns unSuppliedMarket
 */
export const unSuppliedMarketAction = (account, markets)=> async (dispatch) => {
  const unSuppliedMarket = TezosLendingPlatform.getUnsuppliedMarkets(account, markets);
  const unSuppliedTokens =  JSON.parse(JSON.stringify(tokens));

  unSuppliedTokens.map((x) => {
    return x.collateral = false;
  });

  Object.entries((unSuppliedMarket)).map((x)=>{
    unSuppliedTokens.map((y)=>{
      if(y.assetType.toLowerCase() === x[0].toLowerCase()) {
        y.collateral = x[1].collateral
        y.walletUsd = x[1].balanceUsd
        y.walletUnderlying = x[1].balanceUnderlying
        y.rate = x[1].rate
      };
      return unSuppliedTokens;
    });
    return unSuppliedMarket;
  });
  dispatch({ type: GET_UNSUPPLIED_MARKET_DATA, payload: unSuppliedTokens });
}

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param  account .
 * @param  markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (account, markets)=> async (dispatch) => {
  const borrowedMarket = TezosLendingPlatform.getBorrowedMarkets(account, markets);
  const borrowedTokens =  JSON.parse(JSON.stringify(tokens));
  const balances = account.underlyingBalances;

  Object.entries((borrowedMarket)).map((y)=>{
    borrowedTokens.map((x)=>{
      if(y[0].toLowerCase() === x.assetType.toLowerCase()) {
        y[1].assetType = x.assetType
        y[1].banner = x.banner
        y[1].title = x.title
        y[1].logo = x.logo
      }
      return borrowedTokens;
    });
    Object.entries((balances)).map((x)=>{
      if(x[0].toLowerCase() === y[1].assetType.toLowerCase()) {
        y[1].balance = x[1].toString();
      }
      return balances;
    });
    return borrowedMarket;
  });

  dispatch({ type: GET_BORROWED_MARKET_DATA, payload: Object.values(borrowedMarket) });
}

/**
 * This function is used to get the borrowed market data in which an account has *NO* borrowed funds.
 *
 * @param  account
 * @param  markets
 * @returns unBorrowedMarket
 */
export const unBorrowedMarketAction = (account, markets)=> async (dispatch) => {
  const unBorrowedMarket = TezosLendingPlatform.getUnborrowedMarkets(account, markets);
  const unBorrowedTokens =  JSON.parse(JSON.stringify(tokens));

  Object.entries((unBorrowedMarket)).map((x)=>{
    unBorrowedTokens.map((y)=>{
      if(y.assetType.toLowerCase() === x[0].toLowerCase()) {
        y.walletUsd = x[1].balanceUsd
        y.walletUnderlying = x[1].balanceUnderlying
        y.liquidityUsd = x[1].liquidityUsd
        y.liquidityUnderlying = x[1].liquidityUnderlying
        y.rate = x[1].rate
      }
      return unBorrowedTokens;
    });
    return unBorrowedMarket;
  })
  dispatch({ type: GET_UNBORROWED_MARKET_DATA, payload: unBorrowedTokens });
}
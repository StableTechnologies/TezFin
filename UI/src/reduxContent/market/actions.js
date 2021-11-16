import {
  GET_MARKET_DATA,
  GET_SUPPLIED_MARKET_DATA, GET_UNSUPPLIED_MARKET_DATA,
  GET_BORROWED_MARKET_DATA, GET_UNBORROWED_MARKET_DATA
} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

import {tokens, supplying} from '../../components/Constants';

/**
 * This function is used to get the market data .
 *
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param {string} server server address
 */
export const marketAction = (comptroller, protocolAddresses, server)=> async (dispatch) => {

  const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
  dispatch({ type: GET_MARKET_DATA, payload: markets });
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
  const suppliedTokens =  JSON.parse(JSON.stringify(supplying));

  suppliedTokens.map((x)=>{
    x.collateral = true;
  })

  // TODO:
  // 1. DISPLAY ONLY TOKENS AVAILABLE IN SUPPLIEDMARKET DATA

  suppliedTokens.map((y)=>{
    Object.entries((suppliedMarket)).map((x)=>{
      if(y.assetType.toLowerCase() === x[0].toLowerCase()) {
        y.collateral = x[1].collateral
        y.walletUsd = x[1].balanceUsd
        y.walletUnderlying = x[1].balanceUnderlying
        y.rate = x[1].rate
      }
    })
  })
  dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: suppliedTokens });
}

/**
 * This function is used to get the supply market data in which an account has *NO* suppplied funds.
 *
 * @param  account
 * @param  markets
 * @returns unSuppliedMarket
 */
export const unSuppliedMarketAction = (account, markets)=> async (dispatch) => {
  const unSuppliedMarket = TezosLendingPlatform.getUnsuppliedMarkets(account, markets);
  const unSuppliedTokens =  JSON.parse(JSON.stringify(tokens));

  unSuppliedTokens.map((x)=>{
    x.collateral = false;
  })
  Object.entries((unSuppliedMarket)).map((x)=>{
    unSuppliedTokens.map((y)=>{
      if(y.assetType.toLowerCase() === x[0].toLowerCase()) {
        y.collateral = x[1].collateral
        y.walletUsd = x[1].balanceUsd
        y.walletUnderlying = x[1].balanceUnderlying
        y.rate = x[1].rate
      }
    })
  })
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
  dispatch({ type: GET_BORROWED_MARKET_DATA, payload: borrowedMarket });
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
    })
  })
  dispatch({ type: GET_UNBORROWED_MARKET_DATA, payload: unBorrowedTokens });
}
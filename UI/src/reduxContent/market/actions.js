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
 * @param {object} comptroller Comptroller storage.
 * @param {object} protocolAddresses Addresses of the protocol contracts
 * @param {string} server server address
 */
export const marketAction = (comptroller, protocolAddresses, server)=> async (dispatch) => {
  const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
  const supplyMarkets =  JSON.parse(JSON.stringify(tokens));
  const borrowMarkets =  JSON.parse(JSON.stringify(tokens));
  const supplyingMarkets =  JSON.parse(JSON.stringify(supplying));

  supplyMarkets.map((x)=>{
    x.collateral = false;
  })
  supplyingMarkets.map((x)=>{
    x.collateral = true;
  })


  const marketData = {markets, supplyMarkets, borrowMarkets, supplyingMarkets}
  dispatch({ type: GET_MARKET_DATA, payload: marketData });
}

/**
 * This function is used to get the supplied market data in which an account has supplied.
 *
 * @param {object} account
 * @param {object} markets
 * @returns suppliedMarket
 */
export const suppliedMarketAction = (account, markets)=> async (dispatch) => {
  const suppliedMarket = TezosLendingPlatform.getSuppliedMarkets(account, markets);

  // Object.keys(markets).map((market)=>{
  //   supplyMarkets.map((supplyMarket)=>{
  //     if(supplyMarket.assetType.toLowerCase() !== undefined && market.toLowerCase() !== undefined){
  //       if(market.toLowerCase() === supplyMarket.assetType.toLowerCase()) {
  //         supplyMarket.rate = markets[market].supply.rate
  //       }
  //     }
  //   })
  dispatch({ type: GET_SUPPLIED_MARKET_DATA, payload: suppliedMarket });
}
/**
 * This function is used to get the supply market data in which an account has *NO* suppplied funds.
 *
 * @param {object} account
 * @param {object} markets
 * @returns unSuppliedMarket
 */
export const unSuppliedMarketAction = (account, markets)=> async (dispatch) => {
  const unSuppliedMarket = TezosLendingPlatform.getUnsuppliedMarkets(account, markets);
  dispatch({ type: GET_UNSUPPLIED_MARKET_DATA, payload: unSuppliedMarket });
}

/**
 * This function is used to get the borrowed market data in which an account has borrowed funds.
 *
 * @param {object} account .
 * @param {object} markets
 * @returns borrowedMarket
 */
export const borrowedMarketAction = (account, markets)=> async (dispatch) => {
  const borrowedMarket = TezosLendingPlatform.getBorrowedMarkets(account, markets);
  dispatch({ type: GET_BORROWED_MARKET_DATA, payload: borrowedMarket });
}

/**
 * This function is used to get the borrowed market data in which an account has *NO* borrowed funds.
 *
 * @param {object} account
 * @param {object} markets
 * @returns unBorrowedMarket
 */
export const unBorrowedMarketAction = (account, markets)=> async (dispatch) => {
  const unBorrowedMarket = TezosLendingPlatform.getUnborrowedMarkets(account, markets);
  dispatch({ type: GET_UNBORROWED_MARKET_DATA, payload: unBorrowedMarket });
}
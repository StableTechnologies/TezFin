import { GET_MARKET_DATA, GET_SUPPLY_MARKET_DATA, GET_BORROW_MARKET_DATA } from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

import {tokens, supplying} from '../../components/Constants';


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

export const supplyMarketAction = (account, markets)=> async (dispatch) => {
  const supplyMarket = TezosLendingPlatform.getSupplyMarkets(account, markets);

  // Object.keys(markets).map((market)=>{
  //   supplyMarkets.map((supplyMarket)=>{
  //     if(supplyMarket.assetType.toLowerCase() !== undefined && market.toLowerCase() !== undefined){
  //       if(market.toLowerCase() === supplyMarket.assetType.toLowerCase()) {
  //         supplyMarket.rate = markets[market].supply.rate
  //       }
  //     }
  //   })
  dispatch({ type: GET_SUPPLY_MARKET_DATA, payload: supplyMarket });
}

export const borrowMarketAction = (account, markets)=> async (dispatch) => {
  const borrowMarket = TezosLendingPlatform.getBorrowMarkets(account, markets);
  dispatch({ type: GET_BORROW_MARKET_DATA, payload: borrowMarket });
}
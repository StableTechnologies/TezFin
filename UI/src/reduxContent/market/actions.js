import {GET_MARKET_DATA} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

import {tokens} from '../../components/Constants';


export const marketAction = (protocolAddresses)=> async (dispatch) => {
  const markets = await TezosLendingPlatform.GetMarkets(protocolAddresses);
  const supplyMarkets =  JSON.parse(JSON.stringify(tokens));
  const borrowMarkets =  JSON.parse(JSON.stringify(tokens));

  Object.keys(markets).map((market)=>{
    supplyMarkets.map((supplyMarket)=>{
      if(supplyMarket.assetType.toLowerCase() !== undefined && market.toLowerCase() !== undefined){
        if(market.toLowerCase() === supplyMarket.assetType.toLowerCase()) {
          supplyMarket.apy = markets[market].supply.rate
        }
      }
    })
    Object.keys(markets).map((market)=>{
      borrowMarkets.map((borrowMarket)=>{
        if(market.toLowerCase() === borrowMarket.assetType.toLowerCase()) {
          borrowMarket.apy = markets[market].borrow.rate
        }
      })
    })
  })

  const marketData = {supplyMarkets, borrowMarkets}
  dispatch({ type: GET_MARKET_DATA, payload: marketData });
}
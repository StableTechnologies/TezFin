import {GET_MARKET_DATA, GET_SUPPLY_MARKET_DATA} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

import {tokens} from '../../components/Constants';


export const marketAction = (protocolAddresses)=> async (dispatch) => {
  const market = TezosLendingPlatform.GetMarkets(protocolAddresses);
  dispatch({ type: GET_MARKET_DATA, payload: market });
}

export const supplyMarketAction = () => {
  return {
    type: GET_SUPPLY_MARKET_DATA,
    payload: tokens
  }
}
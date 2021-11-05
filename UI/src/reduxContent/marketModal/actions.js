import {GET_SUPPLY_MARKET_MODAL_DATA, GET_BORROW_MARKET_MODAL_DATA} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

export const supplyMarketModalAction = (account, market)=> async (dispatch) => {
  const supplyMarketModal = TezosLendingPlatform.getSupplyMarketModal(account, market);
  dispatch({ type: GET_SUPPLY_MARKET_MODAL_DATA, payload: supplyMarketModal });
}

export const borrowMarketModalAction = (account, market)=> async (dispatch) => {
  const borrowMarketModal = TezosLendingPlatform.getBorrowMarketModal(account, market);
  dispatch({ type: GET_BORROW_MARKET_MODAL_DATA, payload: borrowMarketModal });
}


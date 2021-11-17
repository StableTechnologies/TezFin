import {
  GET_SUPPLY_MARKET_MODAL_DATA,
  GET_BORROW_MARKET_MODAL_DATA,
  MINT_TOKEN,
  WITHDRAW_TOKEN,
  BORROW_TOKEN,
  REPAY_BORROW_TOKEN,
} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

export const supplyMarketModalAction = (account, market) => async (dispatch) => {
  try {
    const supplyMarketModal = TezosLendingPlatform.getSupplyMarketModal(account, market);
    dispatch({ type: GET_SUPPLY_MARKET_MODAL_DATA, payload: supplyMarketModal });
  } catch (error) {}
}

export const borrowMarketModalAction = (account, market) => async (dispatch) => {
  const borrowMarketModal = TezosLendingPlatform.getBorrowMarketModal(account, market);
  dispatch({ type: GET_BORROW_MARKET_MODAL_DATA, payload: borrowMarketModal });
}

export const supplyTokenAction = (mintPair, protocolAddresses, server, signer, keystore, fee, gas, freight)=> async (dispatch) => {
  // TODO
  // mintPair: {underlying: TezosLendingPlatform.AssetType; amount: number;}

  const mint = TezosLendingPlatform.Mint(mintPair, protocolAddresses, server, signer, keystore, fee, gas, freight);
  dispatch({ type: MINT_TOKEN, payload: mint });
}

export const withdrawTokenAction = (redeemPair, comptroller, protocolAddresses, server, signer, keystore, fee, gas, freight)=> async (dispatch) => {

  const withdraw = TezosLendingPlatform.Redeem(redeemPair, comptroller, protocolAddresses, server, signer, keystore, fee, gas, freight);
  dispatch({ type: WITHDRAW_TOKEN, payload: withdraw });
}

export const borrowTokenAction = (borrowPair, comptroller, protocolAddresses, server, signer, keystore, fee, gas, freight)=> async (dispatch) => {

  const borrow = TezosLendingPlatform.Borrow(borrowPair, comptroller, protocolAddresses, server, signer, keystore, fee, gas, freight);
  dispatch({ type: BORROW_TOKEN, payload: borrow });
}

export const repayBorrowTokenAction = (repayBorrowPair, protocolAddresses, server, signer, keystore, fee, gas, freight)=> async (dispatch) => {

  const repayBorrow = TezosLendingPlatform.Borrow(repayBorrowPair, protocolAddresses, server, signer, keystore, fee, gas, freight);
  dispatch({ type: REPAY_BORROW_TOKEN, payload: repayBorrow });
}


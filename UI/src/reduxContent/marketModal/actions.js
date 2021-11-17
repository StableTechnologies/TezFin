import {
  GET_SUPPLY_MARKET_MODAL_DATA,
  GET_BORROW_MARKET_MODAL_DATA,
  MINT_TOKEN,
  WITHDRAW_TOKEN,
  BORROW_TOKEN,
  REPAY_BORROW_TOKEN,
} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

/**
 * This function is used to get the supply market modal data of an account.
 *
 * @param  account
 * @param  market
 * @returns supplyMarketModal
 */
export const supplyMarketModalAction = (account, market) => async (dispatch) => {
  try {
    const supplyMarketModal = TezosLendingPlatform.getSupplyMarketModal(account, market);
    dispatch({ type: GET_SUPPLY_MARKET_MODAL_DATA, payload: supplyMarketModal });
  } catch (error) {}
}

/**
 * This function is used to get the borrow market modal data of an account.
 *
 * @param  account
 * @param  market
 * @returns borrowMarketModal
 */
export const borrowMarketModalAction = (account, market) => async (dispatch) => {
  try {
    const borrowMarketModal = TezosLendingPlatform.getBorrowMarketModal(account, market);
    dispatch({ type: GET_BORROW_MARKET_MODAL_DATA, payload: borrowMarketModal });
  } catch (error) {}
}

/**
 * This function is used to supply tokens to the market.
 *
 * @param  mintPair underlying asset and amount to be supplied
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 */
export const supplyTokenAction = (mintPair, protocolAddresses, server)=> async (dispatch) => {

  const mint = await TezosLendingPlatform.Mint(mintPair, protocolAddresses, server);
  dispatch({ type: MINT_TOKEN, payload: mint });
}

/**
 * This function is used for redeeming tokens for the underlying asset..
 *
 * @param  redeemPair underlying asset and amount to be redeemed
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 */
export const withdrawTokenAction = (redeemPair, comptroller, protocolAddresses, server)=> async (dispatch) => {

  const withdraw = await TezosLendingPlatform.Redeem(redeemPair, comptroller, protocolAddresses, server);
  dispatch({ type: WITHDRAW_TOKEN, payload: withdraw });
}

/**
 * This function is used for borrowing tokens for the underlying asset..
 *
 * @param  borrowPair underlying asset and amount to be borrowed
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 */
export const borrowTokenAction = (borrowPair, comptroller, protocolAddresses, server)=> async (dispatch) => {

  const borrow = await TezosLendingPlatform.Borrow(borrowPair, comptroller, protocolAddresses, server);
  dispatch({ type: BORROW_TOKEN, payload: borrow });
}

/**
 * This function is used for repaying tokens for the underlying asset.
 *
 * @param  repayBorrowPair underlying asset and amount to be repayed.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 */
export const repayBorrowTokenAction = (repayBorrowPair, protocolAddresses, server)=> async (dispatch) => {

  const repayBorrow = await TezosLendingPlatform.RepayBorrow(repayBorrowPair, protocolAddresses, server);
  dispatch({ type: REPAY_BORROW_TOKEN, payload: repayBorrow });
}


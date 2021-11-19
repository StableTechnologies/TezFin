import {
  GET_SUPPLY_MARKET_MODAL_DATA,
  GET_BORROW_MARKET_MODAL_DATA,
  MINT_TOKEN,
  WITHDRAW_TOKEN,
  BORROW_TOKEN,
  REPAY_BORROW_TOKEN,
} from './types.js';

import { Comptroller, TezosLendingPlatform } from 'tezoslendingplatformjs';

import { confirmOps } from '../../util/index.js';

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
 * @param  publicKeyHash address of the connected account.
 * @param  fee
 */
export const supplyTokenAction = (mintPair, protocolAddresses, publicKeyHash)=> async (dispatch) => {
  const mint = TezosLendingPlatform.MintOpGroup(mintPair, protocolAddresses, publicKeyHash);
  dispatch({ type: MINT_TOKEN, payload: mint });
  const res = await confirmOps(mint, publicKeyHash);
}

/**
 * This function is used for redeeming tokens for the underlying asset..
 *
 * @param  redeemPair underlying asset and amount to be redeemed
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address.
 * @param  publicKeyHash address of the connected account.
 * @param  keystore
 */
export const withdrawTokenAction = (redeemPair, comptroller, protocolAddresses, server, publicKeyHash, keystore)=> async (dispatch) => {
  const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);

  const withdraw = TezosLendingPlatform.RedeemOpGroup(redeemPair, collaterals, protocolAddresses, publicKeyHash);
  dispatch({ type: WITHDRAW_TOKEN, payload: withdraw });
  confirmOps(withdraw);
}

/**
 * This function is used for borrowing tokens for the underlying asset..
 *
 * @param  borrowPair underlying asset and amount to be borrowed
 * @param  comptroller Comptroller storage.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  server server address
 * @param  publicKeyHash address of the connected account.
 * @param  keystore
 */
export const borrowTokenAction = (borrowPair, comptroller, protocolAddresses, server, publicKeyHash, keystore)=> async (dispatch) => {
  const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);

  const borrow = TezosLendingPlatform.BorrowOpGroup(borrowPair, collaterals, protocolAddresses, publicKeyHash);
  dispatch({ type: BORROW_TOKEN, payload: borrow });
  confirmOps(borrow);
}

/**
 * This function is used for repaying tokens for the underlying asset.
 *
 * @param  repayBorrowPair underlying asset and amount to be repayed.
 * @param  protocolAddresses Addresses of the protocol contracts
 * @param  publicKeyHash address of the connected account.
 */
export const repayBorrowTokenAction = (repayBorrowPair, protocolAddresses, publicKeyHash)=> async (dispatch) => {

  const repayBorrow = TezosLendingPlatform.RepayBorrowOpGroup(repayBorrowPair, protocolAddresses, publicKeyHash);
  dispatch({ type: REPAY_BORROW_TOKEN, payload: repayBorrow });
  confirmOps(repayBorrow);
}


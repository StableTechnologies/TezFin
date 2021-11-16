import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform, Comptroller, FToken } from 'tezoslendingplatformjs';

/**
 * This function is used to get the account details of a user.
 *
 * @param {object} clients
 * @param {string} server
 * @param {object} conseilServerInfo
 * @param {object} comptroller
 * @param {object} markets
 */
export const addWalletAction = (clients, server, conseilServerInfo, comptroller, markets) => async (dispatch) => {
  const address = clients.tezos.account;

  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, server, conseilServerInfo);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


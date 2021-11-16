import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform, Comptroller, FToken } from 'tezoslendingplatformjs';

/**
 * This function is used to get the account details of a user.
 *
 * @param  clients
 * @param  server
 * @param  conseilServerInfo
 * @param  comptroller
 * @param  markets
 */
export const addWalletAction = (clients, server, conseilServerInfo, comptroller, markets) => async (dispatch) => {
  const address = clients.tezos.account;

  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, server, conseilServerInfo);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


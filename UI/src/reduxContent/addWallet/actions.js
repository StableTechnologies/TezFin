import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform, Comptroller, FToken } from 'tezoslendingplatformjs';

/**
 * This function is used to get the account details of a user.
 *
 * @param  clients
 * @param  server
 * @param  protocolAddresses
 * @param  comptroller
 * @param  markets
 */
export const addWalletAction = (address, server, protocolAddresses, comptroller, markets) => async (dispatch) => {

  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, protocolAddresses, server);

  dispatch({ type: GET_ACCOUNT, payload: account });
}

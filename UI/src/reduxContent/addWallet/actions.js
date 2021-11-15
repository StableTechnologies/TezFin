import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform, Comptroller, FToken } from 'tezoslendingplatformjs';

export const addWalletAction = (clients, server, conseilServerInfo, comptroller, markets) => async (dispatch) => {
  const address = clients.tezos.account;

  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, server, conseilServerInfo);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


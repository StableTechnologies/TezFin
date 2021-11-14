import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform } from 'tezoslendingplatformjs';

export const addWalletAction = (clients, markets, comptroller, protocolAddresses, server, conseilServerInfo)=> async (dispatch) => {
  const address = clients.tezos.account;
  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, TezosLendingPlatform.granadanetAddresses, server, conseilServerInfo);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


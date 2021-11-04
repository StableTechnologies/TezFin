import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform } from 'tezoslendingplatformjs';

export const addWalletAction = (clients, markets, protocolAddresses)=> async (dispatch) => {
  const address = clients.tezos.account;
  const account = await TezosLendingPlatform.GetAccount(address, markets, protocolAddresses);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


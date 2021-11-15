import { GET_ACCOUNT, GET_CLIENTS } from './types.js';

import { TezosLendingPlatform, Comptroller, FToken } from 'tezoslendingplatformjs';

export const addWalletAction = (clients, server, conseilServerInfo) => async (dispatch) => {
  const address = clients.tezos.account;
  const protocolAddresses = TezosLendingPlatform.granadanetAddresses;
  const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server, conseilServerInfo);
    console.log(`comptroller`);
  const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
    console.log(`markets`);
  const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, server, conseilServerInfo);
    console.log(`account`);

  dispatch({ type: GET_ACCOUNT, payload: account });
  dispatch({ type: GET_CLIENTS, payload: clients });
}


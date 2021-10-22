import { GET_ACCOUNT } from './types.js';

import { TezosLendingPlatform } from 'tezoslendingplatformjs';

export const addWalletAction = (address, markets, protocolAddresses)=> async (dispatch) => {
  const account = await TezosLendingPlatform.GetAccount(address, markets, protocolAddresses);
  dispatch({ type: GET_ACCOUNT, payload: account });
}


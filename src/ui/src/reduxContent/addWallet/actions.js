import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import { TezosNodeReader } from 'conseiljs';

import { GET_ACCOUNT } from './types';

/**
 * This function is used to get the account details of a user.
 * @param  address
 * @param  server
 * @param  protocolAddresses
 * @param  comptroller
 * @param  markets
 */
export const addWalletAction = (address, server, protocolAddresses, comptroller, markets) => async (dispatch) => {
    const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, protocolAddresses, server);
    account.isKeyRevealed = await TezosNodeReader.isManagerKeyRevealedForAccount(server, address);
    dispatch({ type: GET_ACCOUNT, payload: account });
};

/**
 * This function is used to update the wallet details after a disconnection.
 */
export const disconnectWalletAction = () => async (dispatch) => {
    dispatch({ type: GET_ACCOUNT, payload: {} });
};

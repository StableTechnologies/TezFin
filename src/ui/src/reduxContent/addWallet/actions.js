import { TezosLendingPlatform } from 'tezoslendingplatformjs';

import { GET_ACCOUNT } from './types';
import { captureWalletSession, assertWalletSession } from '../../util';

/**
 * This function is used to get the account details of a user.
 * @param  address
 * @param  server
 * @param  protocolAddresses
 * @param  comptroller
 * @param  markets
 */
export const addWalletAction = (address, server, protocolAddresses, comptroller, markets, isCurrent = () => true) => async (dispatch) => {
    const session = await captureWalletSession(address);
    const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, protocolAddresses, server);
    await assertWalletSession(session);
    if (isCurrent()) {
        dispatch({ type: GET_ACCOUNT, payload: account });
    }
};

/**
 * This function is used to update the wallet details after a disconnection.
 */
export const disconnectWalletAction = () => async (dispatch) => {
    dispatch({ type: GET_ACCOUNT, payload: {} });
};

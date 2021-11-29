import { TezosLendingPlatform, Comptroller } from 'tezoslendingplatformjs';
import { ACCOUNT, MARKETS, COMPTROLLER } from './types';

/*
 * @description
 *
 * @param
 */
export const getComptrollerAction = (server, conseilServerInfo, protocolAddresses) => async (dispatch) => {
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server, conseilServerInfo);
    console.log(comptroller);
    dispatch({ type: COMPTROLLER, payload: comptroller });
};

/*
 * @description
 *
 * @param
 */
export const getMarketsAction = (server, protocolAddresses, comptroller) => async (dispatch) => {
    const markets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
    console.log(markets);
    dispatch({ type: MARKETS, payload: markets });
};

/*
 * @description
 *
 * @param
 */
export const getAccountAction = (clients, server, conseilServerInfo, comptroller, markets) => async (dispatch) => {
    const address = clients.tezos.account;
    const account = await TezosLendingPlatform.GetAccount(address, markets, comptroller, server, conseilServerInfo);
    console.log(account);

    dispatch({ type: ACCOUNT, payload: account });
};

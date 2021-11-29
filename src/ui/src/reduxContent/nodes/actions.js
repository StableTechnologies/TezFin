import { GET_TEZOS_NODE, GET_PROTOCOL_ADDRESSES, GET_COMPTROLLER } from './types.js';
import { granadanetAddresses, Comptroller } from 'tezoslendingplatformjs';

export const granadanetAction = () => async (dispatch) => {
    dispatch({ type: GET_PROTOCOL_ADDRESSES, payload: granadanetAddresses });
}

export const tezosNodeAction = () => async (dispatch) => {
    const server = "https://tezos-granada.cryptonomic-infra.tech";
    const conseilServerInfo = {
        "url": "https://conseil-granada.cryptonomic-infra.tech",
        "apiKey": "",
        "network": "granadanet"
    };

    dispatch({ type: GET_TEZOS_NODE, payload: { server, conseilServerInfo } });
}

export const comptrollerAction = (protocolAddresses, server, conseilServerInfo)=> async (dispatch) => {
    if (server) {
        const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server, conseilServerInfo);
        dispatch({ type: GET_COMPTROLLER, payload: comptroller });
    }
}

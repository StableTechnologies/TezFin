import { GET_TEZOS_NODE, GET_PROTOCOL_ADDRESSES, GET_COMPTROLLER } from './types.js';
import { TezosLendingPlatform, Comptroller } from 'tezoslendingplatformjs';

export const granadanetAction = ()=> async (dispatch) => {

  const protocolAddresses = TezosLendingPlatform.granadanetAddresses;
  dispatch({ type: GET_PROTOCOL_ADDRESSES, payload: protocolAddresses });
}

export const tezosNodeAction = ()=> async (dispatch) => {

  const server = "https://tezos-granada.cryptonomic-infra.tech";
  const conseilServerInfo = {
    "url": "https://conseil-granada.cryptonomic-infra.tech",
    "apiKey": "",
    "network": "granadanet"
  };

  const tezosNode = {server, conseilServerInfo} ;
  dispatch({ type: GET_TEZOS_NODE, payload: tezosNode });
}

export const comptrollerAction = (protocolAddresses, server, conseilServerInfo)=> async (dispatch) => {
  if(server) {
    const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server, conseilServerInfo);
    dispatch({ type: GET_COMPTROLLER, payload: comptroller });
  }
}

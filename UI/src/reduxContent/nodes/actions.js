import { GET_TEZOS_NODE, GET_GRANADANET_ADDRESSES } from './types.js';
import { TezosLendingPlatform } from 'tezoslendingplatformjs';

export const granadanetAction = ()=> async (dispatch) => {

  const granadanetAddresses = TezosLendingPlatform.granadanetAddresses;
  dispatch({ type: GET_GRANADANET_ADDRESSES, payload: granadanetAddresses });
}

export const tezosNodeAction = ()=> async (dispatch) => {

  const server = "https://tezos-granada.cryptonomic-infra.tech/";
  const conseilServerInfo = {
    "url": "https://conseil-granada.cryptonomic-infra.tech:443",
    "apiKey": "",
    "network": "granadanet"
  };

  const tezosNode = {server, conseilServerInfo} ;
  dispatch({ type: GET_TEZOS_NODE, payload: tezosNode });
}


import {
	Comptroller
} from "tezoslendingplatformjs";
import { GET_COMPTROLLER, GET_PROTOCOL_ADDRESSES, GET_TEZOS_NODE } from './types';
import { getAddresses } from '../../components/Constants';

const config = require(`../../library/${
	process.env.REACT_APP_ENV || "mainnet"
}-network-config.json`);

const addresses = getAddresses();

export const granadanetAction = () => async (dispatch) => {
    dispatch({ type: GET_PROTOCOL_ADDRESSES, payload: addresses });
};

export const tezosNodeAction = () => async (dispatch) => {
    dispatch({ type: GET_TEZOS_NODE, payload: { server: config.infra.tezosNode, conseilServerInfo: config.infra.conseilServer } });
};

export const comptrollerAction = (protocolAddresses, server, conseilServerInfo) => async (dispatch) => {
    if (server) {
        const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server);
        dispatch({ type: GET_COMPTROLLER, payload: comptroller });
    }
};

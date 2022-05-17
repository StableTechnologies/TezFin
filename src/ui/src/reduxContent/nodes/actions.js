import {
	Comptroller,
	testnetAddresses,
	mainnetAddresses,
} from "tezoslendingplatformjs";
import { GET_COMPTROLLER, GET_PROTOCOL_ADDRESSES, GET_TEZOS_NODE } from './types';

const config = require(`../../library/${
	process.env.REACT_APP_ENV || "prod"
}-network-config.json`);

const addresses = process.env.REACT_APP_ENV=="dev"? testnetAddresses : mainnetAddresses

export const granadanetAction = () => async (dispatch) => {
    dispatch({ type: GET_PROTOCOL_ADDRESSES, payload: addresses });
};

export const tezosNodeAction = () => async (dispatch) => {
    dispatch({ type: GET_TEZOS_NODE, payload: { server: config.infra.tezosNode, conseilServerInfo: config.infra.conseilServer } });
};

export const comptrollerAction = (protocolAddresses, server, conseilServerInfo) => async (dispatch) => {
    if (server) {
        const comptroller = await Comptroller.GetStorage(protocolAddresses.comptroller, protocolAddresses, server, conseilServerInfo);
        dispatch({ type: GET_COMPTROLLER, payload: comptroller });
    }
};

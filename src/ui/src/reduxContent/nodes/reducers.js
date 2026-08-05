import { GET_TEZOS_NODE, GET_PROTOCOL_ADDRESSES, GET_COMPTROLLER } from './types';

const initState = {
    tezosNode: {},
    protocolAddresses: undefined,
    comptroller: undefined
};

const nodesReducer = (state, action) => {
    const currentState = state || initState;
    switch (action.type) {
    case GET_TEZOS_NODE:
        return {
            ...currentState,
            tezosNode: action.payload
        };
    case GET_PROTOCOL_ADDRESSES:
        return {
            ...currentState,
            protocolAddresses: action.payload
        };
    case GET_COMPTROLLER:
        return {
            ...currentState,
            comptroller: action.payload
        };
    default:
        return currentState;
    }
};

export default nodesReducer;

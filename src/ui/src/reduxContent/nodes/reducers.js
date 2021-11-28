import { GET_TEZOS_NODE, GET_PROTOCOL_ADDRESSES, GET_COMPTROLLER } from './types';

const initState = {
  tezosNode: {},
  protocolAddresses: undefined,
  comptroller: undefined,
}

const nodesReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_TEZOS_NODE:
      return {
        ...state,
        tezosNode: action.payload
      }
    case GET_PROTOCOL_ADDRESSES:
      return {
        ...state,
        protocolAddresses: action.payload
      }
    case GET_COMPTROLLER:
      return {
        ...state,
        comptroller: action.payload
      }
    default:
      return state;
  }
}

export default nodesReducer;
import { GET_TEZOS_NODE, GET_GRANADANET_ADDRESSES } from './types';

const initState = {
  tezosNode: {},
  granadanetAddresses: {},
}

const nodesReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_TEZOS_NODE:
      return {
        ...state,
        tezosNode: action.payload
      }
    case GET_GRANADANET_ADDRESSES:
      return {
        ...state,
        granadanetAddresses: action.payload
      }
    default:
      return state;
  }
}

export default nodesReducer;
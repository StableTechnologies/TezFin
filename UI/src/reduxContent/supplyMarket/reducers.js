import {GET_SUPPLY_MARKET_DATA} from './types';

const initState = {
  isFetching: true,
  supplyMarketData: [],
}

const supplyMarketReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_SUPPLY_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        supplyMarketData: action.payload
      }
    default:
      return state;
  }
}

export default supplyMarketReducer;
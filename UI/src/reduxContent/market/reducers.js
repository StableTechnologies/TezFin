import {GET_MARKET_DATA, GET_SUPPLY_MARKET_DATA, GET_BORROW_MARKET_DATA} from './types';

const initState = {
  isFetching: true,
  marketData: [],
  supplyMarketData: [],
  borrowMarketData: [],
}

const marketReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        marketData: action.payload
      }
    case GET_SUPPLY_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        supplyMarketData: action.payload
      }
    case GET_BORROW_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        borrowMarketData: action.payload
      }

    default:
      return state;
  }
}

export default marketReducer;
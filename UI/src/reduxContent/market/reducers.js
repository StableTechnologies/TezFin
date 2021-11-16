import {
  GET_MARKET_DATA,
  GET_SUPPLIED_MARKET_DATA, GET_UNSUPPLIED_MARKET_DATA,
  GET_BORROWED_MARKET_DATA, GET_UNBORROWED_MARKET_DATA
} from './types';

const initState = {
  isFetching: true,
  marketData: [],
  suppliedMarketData: [],
  unSuppliedMarketData: [],
  borrowedMarketData: [],
  unBorrowedMarketData: [],
}

const marketReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        marketData: action.payload
      }
    case GET_SUPPLIED_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        suppliedMarketData: action.payload
      }
    case GET_UNSUPPLIED_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        unSuppliedMarketData: action.payload
      }
    case GET_BORROWED_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        borrowedMarketData: action.payload
      }
    case GET_UNBORROWED_MARKET_DATA:
      return {
        ...state,
        isFetching: false,
        unBorrowedMarketData: action.payload
      }

    default:
      return state;
  }
}

export default marketReducer;
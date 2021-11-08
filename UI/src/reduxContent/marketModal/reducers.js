import {GET_SUPPLY_MARKET_MODAL_DATA, GET_BORROW_MARKET_MODAL_DATA, MINT_TOKEN, BORROW_TOKEN} from './types';

const initState = {
  isFetching: true,
  supplyMarketModal: {},
  borrowMarketModal: {},
  mintToken: {},
  borrowToken: {},
}

const marketModalReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_SUPPLY_MARKET_MODAL_DATA:
      return {
        ...state,
        isFetching: false,
        supplyMarketModal: action.payload
      }
    case GET_BORROW_MARKET_MODAL_DATA:
      return {
        ...state,
        isFetching: false,
        borrowMarketModal: action.payload
      }
    case MINT_TOKEN:
      return {
        ...state,
        isFetching: false,
        mintToken: action.payload
      }
    case BORROW_TOKEN:
      return {
        ...state,
        isFetching: false,
        borrowToken: action.payload
      }
    default:
      return state;
  }
}

export default marketModalReducer;
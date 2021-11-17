import {
  GET_SUPPLY_MARKET_MODAL_DATA,
  GET_BORROW_MARKET_MODAL_DATA,
  MINT_TOKEN,
  WITHDRAW_TOKEN,
  BORROW_TOKEN,
  REPAY_BORROW_TOKEN
} from './types';

const initState = {
  isFetching: true,
  supplyMarketModal: {},
  borrowMarketModal: {},
  mintToken: {},
  withdrawToken: {},
  borrowToken: {},
  repayBorrowToken: {},
}

const marketModalReducer = (state = initState, action) => {
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
    case WITHDRAW_TOKEN:
      return {
        ...state,
        isFetching: false,
        withdrawToken: action.payload
      }
    case BORROW_TOKEN:
      return {
        ...state,
        isFetching: false,
        borrowToken: action.payload
      }
    case REPAY_BORROW_TOKEN:
      return {
        ...state,
        isFetching: false,
        repayBorrowToken: action.payload
      }
    default:
      return state;
  }
}

export default marketModalReducer;
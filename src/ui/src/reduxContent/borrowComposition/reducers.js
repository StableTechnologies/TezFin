import {GET_BORROW_COMPOSITION_DATA} from './types';

const initState = {
  isFetching: true,
  borrowComposition: {},
}

const borrowCompositionReducer = (state=initState, action) => {
  switch(action.type) {
    case GET_BORROW_COMPOSITION_DATA:
      return {
        ...state,
        isFetching: false,
        borrowComposition: action.payload
      }
    default:
      return state;
  }
}

export default borrowCompositionReducer;
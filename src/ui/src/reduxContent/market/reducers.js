import {
    GET_MARKET_DATA,
    GET_SUPPLIED_MARKET_DATA, GET_UNSUPPLIED_MARKET_DATA,
    GET_BORROWED_MARKET_DATA, GET_UNBORROWED_MARKET_DATA
} from './types';

const initState = {
    isFetching: true,
    markets: [],
    suppliedMarkets: [],
    unSuppliedMarkets: [],
    borrowedMarkets: [],
    unBorrowedMarkets: []
};

const marketReducer = (state = initState, action) => {
    switch (action.type) {
    case GET_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            markets: action.payload
        };
    case GET_SUPPLIED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            suppliedMarkets: action.payload
        };
    case GET_UNSUPPLIED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            unSuppliedMarkets: action.payload
        };
    case GET_BORROWED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            borrowedMarkets: action.payload
        };
    case GET_UNBORROWED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            unBorrowedMarkets: action.payload
        };

    default:
        return state;
    }
};

export default marketReducer;

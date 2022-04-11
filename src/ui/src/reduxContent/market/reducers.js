import {
    GET_MARKET_DATA,
    GET_ALL_MARKET_DATA,
    GET_SUPPLIED_MARKET_DATA,
    GET_BORROWED_MARKET_DATA
} from './types';

const initState = {
    isFetching: true,
    markets: [],
    allMarkets: [],
    suppliedMarkets: [],
    borrowedMarkets: []
};

const marketReducer = (state = initState, action) => {
    switch (action.type) {
    case GET_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            markets: action.payload
        };
    case GET_ALL_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            allMarkets: action.payload
        };
    case GET_SUPPLIED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            suppliedMarkets: action.payload
        };
    case GET_BORROWED_MARKET_DATA:
        return {
            ...state,
            isFetching: false,
            borrowedMarkets: action.payload
        };
    default:
        return state;
    }
};

export default marketReducer;

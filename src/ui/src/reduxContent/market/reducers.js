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

const marketReducer = (state, action) => {
    const currentState = state || initState;
    switch (action.type) {
    case GET_MARKET_DATA:
        return {
            ...currentState,
            isFetching: false,
            markets: action.payload
        };
    case GET_ALL_MARKET_DATA:
        return {
            ...currentState,
            isFetching: false,
            allMarkets: action.payload
        };
    case GET_SUPPLIED_MARKET_DATA:
        return {
            ...currentState,
            isFetching: false,
            suppliedMarkets: action.payload
        };
    case GET_BORROWED_MARKET_DATA:
        return {
            ...currentState,
            isFetching: false,
            borrowedMarkets: action.payload
        };
    default:
        return currentState;
    }
};

export default marketReducer;

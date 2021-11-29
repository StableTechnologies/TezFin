import { ACCOUNT, MARKETS, COMPTROLLER } from './types.js';

const initState = {
    comptroller: {},
    markets: {},
    account: {}
};

const tlpReducer = (state = initState, action) => {
    switch (action.type) {
    case COMPTROLLER:
        return {
            ...state,
            comptroller: action.payload
        };
    case MARKETS:
        return {
            ...state,
            markets: action.payload
        };
    case ACCOUNT:
        return {
            ...state,
            account: action.payload
        };
    default:
        return state;
    }
};

export default tlpReducer;

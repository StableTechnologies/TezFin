import { GET_ACCOUNT } from './types';

const initState = {
    isFetching: true,
    account: {}
};

const addWalletReducer = (state, action) => {
    const currentState = state || initState;
    switch (action.type) {
    case GET_ACCOUNT:
        return {
            ...currentState,
            isFetching: false,
            account: action.payload
        };
    default:
        return currentState;
    }
};

export default addWalletReducer;

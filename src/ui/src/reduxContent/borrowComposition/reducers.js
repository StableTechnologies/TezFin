import { GET_BORROW_COMPOSITION_DATA } from './types';

const initState = {
    isFetching: true,
    borrowComposition: {}
};

const borrowCompositionReducer = (state, action) => {
    const currentState = state || initState;
    switch (action.type) {
    case GET_BORROW_COMPOSITION_DATA:
        return {
            ...currentState,
            isFetching: false,
            borrowComposition: action.payload
        };
    default:
        return currentState;
    }
};

export default borrowCompositionReducer;

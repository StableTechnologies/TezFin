import { GET_SUPPLY_COMPOSITION_DATA } from './types';

const initState = {
    isFetching: true,
    supplyComposition: {}
};

const supplyCompositionReducer = (state, action) => {
    const currentState = state || initState;
    switch (action.type) {
    case GET_SUPPLY_COMPOSITION_DATA:
        return {
            ...currentState,
            isFetching: false,
            supplyComposition: action.payload
        };
    default:
        return currentState;
    }
};

export default supplyCompositionReducer;

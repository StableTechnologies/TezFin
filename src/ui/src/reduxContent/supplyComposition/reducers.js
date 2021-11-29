import { GET_SUPPLY_COMPOSITION_DATA } from './types';

const initState = {
    isFetching: true,
    supplyComposition: {}
};

const supplyCompositionReducer = (state = initState, action) => {
    switch (action.type) {
    case GET_SUPPLY_COMPOSITION_DATA:
        return {
            ...state,
            isFetching: false,
            supplyComposition: action.payload
        };
    default:
        return state;
    }
};

export default supplyCompositionReducer;

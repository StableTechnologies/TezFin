import { combineReducers } from 'redux';

import nodesReducer from './nodes/reducers';
import marketReducer from './market/reducers';
import supplyCompositionReducer from './supplyComposition/reducers';
import borrowCompositionReducer from './borrowComposition/reducers';
import addWalletReducer from './addWallet/reducers';
import marketModalReducer from './marketModal/reducers';

const rootReducer = combineReducers({
    nodes: nodesReducer,
    market: marketReducer,
    supplyComposition: supplyCompositionReducer,
    borrowComposition: borrowCompositionReducer,
    marketModal: marketModalReducer,
    addWallet: addWalletReducer
});

export default rootReducer;

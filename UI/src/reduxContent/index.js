import { combineReducers } from 'redux';

import marketReducer from './market/reducers';
import supplyCompositionReducer from './supplyComposition/reducers';
import borrowCompositionReducer from './borrowComposition/reducers';
import addWalletReducer from './addWallet/reducers';
import marketModalReducer from './marketModal/reducers';

const rootReducer = combineReducers({
  market: marketReducer,
  supplyComposition: supplyCompositionReducer,
  borrowComposition: borrowCompositionReducer,
  marketModalReducer: marketModalReducer,
  addWallet: addWalletReducer,
});

export default rootReducer;
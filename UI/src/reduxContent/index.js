import { combineReducers } from 'redux';

import supplyMarketReducer from './supplyMarket/reducers';
import supplyCompositionReducer from './supplyComposition/reducers';
import borrowCompositionReducer from './borrowComposition/reducers';

const rootReducer = combineReducers({
  supplyMarket: supplyMarketReducer,
  supplyComposition: supplyCompositionReducer,
  borrowComposition: borrowCompositionReducer,
});

export default rootReducer;
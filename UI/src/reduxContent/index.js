import { combineReducers } from 'redux';

import supplyMarketReducer from './supplyMarket/reducers';
import supplyCompositionReducer from './supplyComposition/reducers';

const rootReducer = combineReducers({
  supplyMarket: supplyMarketReducer,
  supplyComposition: supplyCompositionReducer,
});

export default rootReducer;
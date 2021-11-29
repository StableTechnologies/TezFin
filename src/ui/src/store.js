import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reduxContent';

const middleware = [thunk];
const initialState = {};

const store = createStore(
    rootReducer,
    initialState,
    compose(applyMiddleware(...middleware), window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f)
);

export default store;

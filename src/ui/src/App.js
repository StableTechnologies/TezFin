import {
    Route, BrowserRouter as Router, Switch, useHistory
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { comptrollerAction, granadanetAction, tezosNodeAction } from './reduxContent/nodes/actions';
import { marketAction } from './reduxContent/market/actions';

import './App.css';

import Header from './components/Header';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

import Grid from '@mui/material/Grid';
import { useEffect } from 'react';

const App = () => {
    const dispatch = useDispatch();
    const { server, conseilServerInfo } = useSelector((state) => state.nodes.tezosNode);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);

    useEffect(() => {
        dispatch(tezosNodeAction());
        dispatch(granadanetAction());
    }, [dispatch]);

    useEffect(() => {
        dispatch(comptrollerAction(protocolAddresses, server, conseilServerInfo));
    }, [dispatch, server]);

    useEffect(() => {
        dispatch(marketAction(comptroller, protocolAddresses, server));
    }, [dispatch, comptroller, protocolAddresses, server]);

    return (
        <Router>
            <Grid className="App">
                <Header />
                {/* <Home /> */}
                <Switch>
                    <Route exact path="/dashboard">
                        <Dashboard />
                    </Route>
                    {/* <Route exact path="/market"></Route> */}
                    {/* <Route exact path="/about"></Route> */}
                    {/* <Route exact path="/"> <Home /> </Route> */}
                    <Route exact path="/"> <Home /> </Route>
                </Switch>
            </Grid>
        </Router>
    );
};

export default App;
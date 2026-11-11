/* eslint-disable array-element-newline */
/* eslint-disable import/extensions */
import { useEffect } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { comptrollerAction, granadanetAction, tezosNodeAction } from './reduxContent/nodes/actions';
import { allMarketAction, marketAction } from './reduxContent/market/actions';

import './App.css';

import Nav from './components/Header/nav';
import Header from './components/Header';
import Home from './components/Home';
// eslint-disable-next-line import/no-unresolved
import Dashboard from './components/Dashboard';
import DebugDashboard from './components/Debug';
import ComingSoon from './components/ComingSoon/index.tsx';

import Footer from './components/Footer';

import { addWalletAction, disconnectWalletAction } from './reduxContent/addWallet/actions';
import { getActiveAccount, subscribeToWalletChanges } from './util';

const App = () => {
    const dispatch = useDispatch();
    const { account } = useSelector((state) => state.addWallet);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);

    useEffect(() => {
        dispatch(tezosNodeAction());
        dispatch(granadanetAction());
    }, [dispatch]);

    useEffect(() => {
        dispatch(comptrollerAction(protocolAddresses, server));
    }, [dispatch, server]);

    useEffect(() => {
        const doMarketAction = () => {
            dispatch(marketAction(comptroller, protocolAddresses, server));
        };
        doMarketAction();
        const intervalId = setInterval(doMarketAction, 1000 * 60 * 4); // 4 minutes
        return () => clearInterval(intervalId);
    }, [dispatch, comptroller, protocolAddresses, server]);

    useEffect(() => {
        let cancelled = false;
        let request = 0;
        const refreshAccount = async () => {
            request += 1;
            const current = request;
            const isCurrent = () => !cancelled && current === request;
            try {
                const address = await getActiveAccount();
                if (!isCurrent()) {
                    return;
                }
                if (!address) {
                    dispatch(disconnectWalletAction());
                } else if (server && protocolAddresses && comptroller) {
                    await dispatch(addWalletAction(address, server, protocolAddresses, comptroller, markets, isCurrent));
                }
            } catch (error) {
                if (isCurrent()) {
                    dispatch(disconnectWalletAction());
                }
            }
        };
        const unsubscribe = subscribeToWalletChanges(() => {
            dispatch(disconnectWalletAction());
            refreshAccount();
        });
        refreshAccount();
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [dispatch, server, protocolAddresses, comptroller, markets]);

    useEffect(() => {
        dispatch(allMarketAction(account, markets));
    }, [dispatch, account, markets]);

    return (
        <Router>
            <Grid className="App">
                <Nav />
                <Switch>
                    <Route exact path="/dashboard">
                        <Header />
                        <Dashboard />
                    </Route>
                    <Route exact path={['/about', '/market']} component={ComingSoon} />
                    <Route exact path="/debugDashboard">
                        <DebugDashboard />
                    </Route>
                    <Route exact path={['/', '/dashboard']}>
                        {' '}
                        <Home />{' '}
                    </Route>
                </Switch>
                <Footer />
            </Grid>
        </Router>
    );
};

export default App;

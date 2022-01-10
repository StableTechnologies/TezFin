import {
    Route, BrowserRouter as Router, Switch, useHistory
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { comptrollerAction, granadanetAction, tezosNodeAction } from './reduxContent/nodes/actions';
import { allMarketAction, marketAction } from './reduxContent/market/actions';

import './App.css';

import Header from './components/Header';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';

import Grid from '@mui/material/Grid';
import { useEffect } from 'react';
import { addWalletAction } from './reduxContent/addWallet/actions';
import { getActiveAccount } from './util';

const App = () => {
    const dispatch = useDispatch();
    const { account } = useSelector((state) => state.addWallet);
    const { address } = useSelector((state) => state.addWallet.account);
    const { server, conseilServerInfo } = useSelector((state) => state.nodes.tezosNode);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);

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

    useEffect(() => {
      const isWallet = async () => {
          const address = await getActiveAccount();
          if (address) {
              dispatch(addWalletAction(address, server, protocolAddresses, comptroller, markets));
              dispatch(allMarketAction(account, markets));
          }
      };
      isWallet();
  }, [dispatch, address, server, protocolAddresses, comptroller, markets]);


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
                <Footer />
            </Grid>
        </Router>
    );
};

export default App;

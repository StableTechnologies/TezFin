import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
// import './test.scss';

import Header from './components/Header';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

import Grid from '@mui/material/Grid';

import {TezosLendingPlatform} from './util/TezosLendingPlatform';

function f() {
    TezosLendingPlatform.getMarketInfo(undefined);
}

function App() {
  return (
    <Router>
      <Grid className="App">
        <Header />
        {/* <Home /> */}
        <Switch>
          <Route exact path="/dashboard">
            <Dashboard />
          </Route>
          <Route exact path="/market"></Route>
          <Route exact path="/about"></Route>
          {/* <Route exact path="/"> <Home /> </Route> */}
          <Route exact path="/"> </Route>
        </Switch>
      </Grid>
    </Router>
  );
}

export default App;

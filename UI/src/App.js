import { Route, BrowserRouter as Router, Switch } from "react-router-dom";
import { useDispatch } from "react-redux";
import { granadanetAction, tezosNodeAction } from "./reduxContent/nodes/actions";

import './App.css';

import Header from './components/Header';
import Home from './components/Home';
import Dashboard from './components/Dashboard';

import Grid from '@mui/material/Grid';
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(tezosNodeAction());
    dispatch(granadanetAction());
  }, [dispatch])

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

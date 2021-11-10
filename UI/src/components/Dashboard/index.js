import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Market from '../Market';
import { useStyles } from './style';

import {borrowMarketAction, marketAction, supplyMarketAction} from '../../reduxContent/market/actions';

const Dashboard =() => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const {supplyMarkets, borrowMarkets} = useSelector(state => state.market.marketData);

  useEffect(() => {
    dispatch(marketAction());
    dispatch(supplyMarketAction());
    dispatch(borrowMarketAction());
  }, [dispatch])

  return (
    <Grid container className={classes.dashboard}>

        {/* <Grid md={12}>
        </Grid> */}
      <Grid item xs={12} md={6} className={classes.paddingRight}>
        <Typography className={classes.tableTitle}> Supply Markets </Typography>
        <Market
          tableData = {supplyMarkets}
          heading1 = "Token"
          heading2 = "APY"
          heading3 = "Wallet"
          heading4 = "Collateral"
          toggle
          supplyMkt
        />
      </Grid>
      <Grid item xs={12} md={6} className={classes.paddingLeft}>
        <Typography className={classes.tableTitle}> Borrow Markets </Typography>
        <Market
          tableData = {borrowMarkets}
          heading1 = "Token"
          heading2 = "APY"
          heading3 = "Wallet"
          heading4 = "Liquidity"
          borrowMkt
        />
      </Grid>
    </Grid>
  )
}

export default Dashboard;

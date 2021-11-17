import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import {marketAction, borrowedMarketAction, unBorrowedMarketAction, unSuppliedMarketAction, suppliedMarketAction} from '../../reduxContent/market/actions';

import Market from '../Market';
import { useStyles } from './style';

const Dashboard =() => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const { account } = useSelector(state => state.addWallet);
  const { markets } = useSelector(state => state.market);
  const { suppliedMarkets, unSuppliedMarkets, borrowedMarkets, unBorrowedMarkets } = useSelector(state => state.market);

  useEffect(() => {
    dispatch(suppliedMarketAction(account, markets));
    dispatch(unSuppliedMarketAction(account, markets));
    dispatch(borrowedMarketAction(account, markets));
    dispatch(unBorrowedMarketAction(account, markets));
  }, [dispatch, account, markets])

//   console.log(`dashboard markets ${JSON.stringify(markets)}`)
//   console.log(`dashboard suppliedMarkets ${JSON.stringify(suppliedMarkets)}`)
//   console.log(`dashboard borrowedMarkets ${JSON.stringify(borrowedMarkets)}`)
//   console.log(`dashboard unSuppliedMarkets ${JSON.stringify(unSuppliedMarkets)}`)
//   console.log(`dashboard unBorrowedMarkets ${JSON.stringify(unBorrowedMarkets)}`)

  return (
    <Grid container className={classes.dashboard}>

        {/* <Grid md={12}>
        </Grid> */}
      <Grid item xs={12} md={6} className={classes.paddingRight}>
        <>
          <Typography className={classes.tableTitle}> supplying </Typography>
          <Market
            tableData = {suppliedMarkets}
            heading1 = "Token"
            heading2 = "APY/Earned"
            heading3 = "Balance"
            heading4 = "Collateral"
            toggle
            supplyingMkt
            />
        </>
        {/* <Typography className={classes.tableTitle}> Supply Markets </Typography> */}
        <Typography className={classes.tableTitleTwo}> All Supply Markets </Typography>
        <Market
          tableData = {unSuppliedMarkets}
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
          tableData = {unBorrowedMarkets}
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

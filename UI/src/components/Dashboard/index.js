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

  // const account  = JSON.parse(localStorage.getItem('account'));
  const { account } = useSelector(state => state.addWallet);
  const { markets } = useSelector(state => state.market);
  const { suppliedMarkets, unSuppliedMarkets, borrowedMarkets, unBorrowedMarkets } = useSelector(state => state.market);

  useEffect(() => {
    dispatch(unSuppliedMarketAction(account, markets));
    dispatch(unBorrowedMarketAction(account, markets));

    if (!account.address || !markets) { return; }

    dispatch(suppliedMarketAction(account, markets));
    dispatch(borrowedMarketAction(account, markets));
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
        {(suppliedMarkets.length > 0) &&
          <>
            <Typography className={classes.tableTitle}> supplying </Typography>
            <Market
              tableData = {suppliedMarkets}
              headingOne = "Token"
              headingTwo = "APY/Earned"
              headingThree = "Balance"
              headingFour = "Collateral"
              toggle
              supplyingMkt
              />
          </>
        }
        {(suppliedMarkets.length > 0) ?
          <Typography className={classes.tableTitleTwo}> All Supply Markets </Typography> :
          <Typography className={classes.tableTitle}> Supply Markets </Typography>
        }
        <Market
          tableData = {unSuppliedMarkets}
          headingOne = "Token"
          headingTwo = "APY"
          headingThree = "Wallet"
          headingFour = "Collateral"
          toggle
          supplyMkt
        />
      </Grid>
      <Grid item xs={12} md={6} className={classes.paddingLeft}>
      {(borrowedMarkets.length > 0) &&
        <>
          <Typography className={classes.tableTitle}> Borrowing </Typography>
          <Market
            tableData = {borrowedMarkets}
            headingOne = "Token"
            headingTwo = "APY"
            headingThree = "Balance"
            headingFour = "Borrow limit used"
            borrowingMkt
            />
        </>
        }
        {(borrowedMarkets.length > 0) ?
          <Typography className={classes.tableTitleTwo}> All Borrow Markets </Typography> :
          <Typography className={classes.tableTitle}> Borrow Markets </Typography>
        }
        <Market
          tableData = {unBorrowedMarkets}
          headingOne = "Token"
          headingTwo = "APY"
          headingThree = "Wallet"
          headingFour = "Liquidity"
          borrowMkt
        />
      </Grid>
    </Grid>
  )
}

export default Dashboard;

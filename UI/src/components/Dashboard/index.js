import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Market from '../Market';
import { useStyles } from './style';

import {marketAction, borrowedMarketAction, unBorrowedMarketAction, unSuppliedMarketAction, suppliedMarketAction} from '../../reduxContent/market/actions';


const Dashboard =() => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const {markets, supplyMarkets, borrowMarkets, supplyingMarkets} = useSelector(state => state.market.marketData);
  const { server } = useSelector(state => state.nodes.tezosNode);
  const { protocolAddresses, comptroller } = useSelector(state => state.nodes);
  const { marketBalances } = useSelector(state => state.addWallet.account);
  const {account} = useSelector(state => state.addWallet);


  console.log(marketBalances, 'marketBalances');

  // if(marketBalances) {
  //   Object.keys(marketBalances).map((x)=>{
  //     supplyMarkets.map((supplyMarket)=>{
  //       if(x.toLowerCase() === supplyMarket.assetType.toLowerCase()) {
  //         supplyMarket.wallet = marketBalances[x].supplyBalanceUnderlying
  //         supplyMarket.walletUSD = marketBalances[x].supplyBalanceUsd
  //         supplyMarket.collateral = marketBalances[x].collateral
  //       }
  //     })

  //     borrowMarkets.map((borrowMarket)=>{
  //       if(x.toLowerCase() === borrowMarket.assetType.toLowerCase()) {
  //         borrowMarket.wallet = marketBalances[x].loanBalanceUnderlying
  //         borrowMarket.walletUSD = marketBalances[x].loanBalanceUsd
  //       }
  //     })
  //   })
  // }

  useEffect(() => {
    dispatch(marketAction(comptroller, protocolAddresses, server));
    dispatch(suppliedMarketAction(account, markets));
    dispatch(unSuppliedMarketAction(account, markets));
    dispatch(borrowedMarketAction(account, markets));
    dispatch(unBorrowedMarketAction(account, markets));
  }, [dispatch, comptroller, markets])

  return (
    <Grid container className={classes.dashboard}>

        {/* <Grid md={12}>
        </Grid> */}
      <Grid item xs={12} md={6} className={classes.paddingRight}>
        {supplyingMarkets &&
        <>
          <Typography className={classes.tableTitle}> supplying </Typography>
          <Market
            tableData = {supplyingMarkets}
            heading1 = "Token"
            heading2 = "APY/Earned"
            heading3 = "Balance"
            heading4 = "Collateral"
            toggle
            supplyingMkt
            />
        </>}
        {/* <Typography className={classes.tableTitle}> Supply Markets </Typography> */}
        <Typography className={classes.tableTitleTwo}> All Supply Markets </Typography>
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

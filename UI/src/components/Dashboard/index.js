import React, { useState } from 'react';

import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import BasicTable from '../../components/Table';
import { useStyles } from './style';

import {tokens} from '../Constants';

const Dashboard =() => {
  const classes = useStyles();

  return (
    <Grid container className={classes.dashboard}>

        {/* <Grid md={12}>
        </Grid> */}
      <Grid item xs={12} md={6} className={classes.paddingRight}>
        <Typography className={classes.tableTitle}> Supply Markets </Typography>
        <BasicTable
          tableData = {tokens}
          heading1 = "Token"
          heading2 = "APY"
          heading3 = "Wallet"
          heading4 = "Collateral"
          toggle
          // openModal = {() => handleClickOpen()}
        />
      </Grid>
      <Grid item xs={12} md={6} className={classes.paddingLeft}>
        <Typography className={classes.tableTitle}> Borrow Markets </Typography>
        <BasicTable
          tableData = {tokens}
          heading1 = "Token"
          heading2 = "APY"
          heading3 = "Wallet"
          heading4 = "Liquidity"
          // openModal = {() => handleClickOpen()}
        />
      </Grid>
    </Grid>
  )
}

export default Dashboard;

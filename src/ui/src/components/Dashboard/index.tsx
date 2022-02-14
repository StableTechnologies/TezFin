import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

import BorrowedTokenTable from './BorrowedTokenTable';
import SuppliedTokenTable from './SuppliedTokenTable';
import AllMarketTokenTable from './AllMarketTokenTable';

import { borrowedMarketAction, allMarketAction, suppliedMarketAction } from '../../reduxContent/market/actions';

import { useStyles } from './style';

const Dashboard = () => {
    const classes: any = useStyles();
    const dispatch = useDispatch();

    const { account } = useSelector((state: any) => state.addWallet);
    const { address } = useSelector((state: any) => state.addWallet.account);
    const { markets } = useSelector((state: any) => state.market);
    const { suppliedMarkets, borrowedMarkets, allMarkets } = useSelector((state: any) => state.market);

    useEffect(() => {
      if (!markets) { return; }
      dispatch(allMarketAction(account, markets));

      dispatch(suppliedMarketAction(account, markets));
      dispatch(borrowedMarketAction(account, markets));
    }, [dispatch, account, markets]);

    return (
        <Grid container className={classes.dashboard}>
          <Grid item xs={12} md={6} className={classes._paddingRight}>
            <Typography className={classes.tableTitle}> Supplying </Typography>
            <SuppliedTokenTable tableData={suppliedMarkets}/>
          </Grid>
          <Grid item xs={12} md={6} className={classes._paddingLeft}>
            <Typography className={classes.tableTitle}> Borrowing </Typography>
            <BorrowedTokenTable tableData={borrowedMarkets} />
          </Grid>
          <Grid item xs={12} >
            <Typography className={classes.tableTitle}> Markets </Typography>
            <AllMarketTokenTable tableData={allMarkets} />
          </Grid>
        </Grid>
    );
};

export default Dashboard;

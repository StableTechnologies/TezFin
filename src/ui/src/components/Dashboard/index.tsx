import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

import BorrowedTokenTable from './BorrowedTokenTable';
import SuppliedTokenTable from './SuppliedTokenTable';
import AllMarketTokenTable from './AllMarketTokenTable';

import { borrowedMarketAction, suppliedMarketAction } from '../../reduxContent/market/actions';

import { useStyles } from './style';

const Dashboard = () => {
    const classes: any = useStyles();
    const dispatch = useDispatch();

    const { account } = useSelector((state: any) => state.addWallet);
    const { markets } = useSelector((state: any) => state.market);
    const { suppliedMarkets, borrowedMarkets } = useSelector((state: any) => state.market);

    console.log('dashboard supplied', suppliedMarkets);
    console.log('dashboard borrowed', borrowedMarkets);
    console.log('markets', markets);

    useEffect(() => {
        if (!markets) { return; }
      // TODO CALL ALLMARKETS HERE

        if (!account.address) { return; }

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
            <Typography className={classes.tableTitleTwo}> All Markets </Typography>
            <AllMarketTokenTable />
          </Grid>
        </Grid>
    );
};

export default Dashboard;

/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';

import BorrowedTokenTable from './BorrowedTokenTable';
import SuppliedTokenTable from './SuppliedTokenTable';
import BorrowMarketTokenTable from './BorrowMarketTokenTable';
import SupplyMarketTokenTable from './SupplyMarketTokenTable';

import { borrowedMarketAction, allMarketAction, suppliedMarketAction } from '../../reduxContent/market/actions';

import { useStyles } from './style';

const Dashboard = () => {
    const classes: any = useStyles();
    const dispatch = useDispatch();

    const { account } = useSelector((state: any) => state.addWallet);
    const { markets } = useSelector((state: any) => state.market);
    const { suppliedMarkets, borrowedMarkets, allMarkets } = useSelector((state: any) => state.market);

    useEffect(() => {
        if (!markets) {
            return;
        }
        dispatch(allMarketAction(account, markets));

        dispatch(suppliedMarketAction(allMarkets));
        dispatch(borrowedMarketAction(allMarkets));
    }, [dispatch, account, markets]);

    return (
        <Grid container className={classes.dashboard}>
            <Grid item xs={6} md={6} className={classes.supplyTablePadding}>
                <Typography className={classes.tableTitle}> Supplying </Typography>
                <SuppliedTokenTable tableData={suppliedMarkets} />
            </Grid>
            <Grid item xs={6} md={6} className={classes.borrowTablePadding}>
                <Typography className={classes.tableTitle}> Borrowing </Typography>
                <BorrowedTokenTable tableData={borrowedMarkets} />
            </Grid>
            <Grid item xs={6} md={6} className={classes.supplyTablePadding}>
		<Box sx={{width: "100vw", display:"inline-block"}} >
			<Typography noWrap={false} className={classes.tableTitle}> Assets to Supply </Typography>
	        </Box>
                <SupplyMarketTokenTable tableData={allMarkets} />
            </Grid>
            <Grid item xs={6} md={6} className={classes.borrowTablePadding}>
		<Box sx={{width: "100vw", display:"inline-block"}} >
			<Typography noWrap={false} className={classes.tableTitle}>Assets to Borrow</Typography>
	        </Box>
                <BorrowMarketTokenTable tableData={allMarkets} />
            </Grid>
        </Grid>
    );
};

export default Dashboard;

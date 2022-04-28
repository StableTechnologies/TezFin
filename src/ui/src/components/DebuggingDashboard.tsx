/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import { decimals } from 'tezoslendingplatformjs';

import {
    decimalify, nFormatter, formatTokenData, truncateNum
} from '../util';
import Switch from './Switch';
// import Tez from './assets/largeXTZ.svg';

import { useStyles } from './Dashboard/style';
import { allMarketAction, suppliedMarketAction } from '../reduxContent/market/actions';

const DebugDashboard = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { account } = useSelector((state: any) => state.addWallet);
    const { markets } = useSelector((state: any) => state.market);
    const { suppliedMarkets, allMarkets } = useSelector((state: any) => state.market);

    const suppliedData = formatTokenData(suppliedMarkets);

    useEffect(() => {
        if (!markets) { return; }
        dispatch(allMarketAction(account, markets));

        dispatch(suppliedMarketAction(allMarkets));
    }, [dispatch, account, markets]);

    return (
        <Grid container className={classes.dashboard}>
            <TableContainer className={`${classes.root} ${classes.tableCon}`}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell> Token </TableCell>
                            <TableCell align="right"> APY/Earned </TableCell>
                            <TableCell align="right"> Balance </TableCell>
                            <TableCell align="right"> Cash </TableCell>
                            <TableCell align="right"> Total Supply </TableCell>
                            <TableCell align="right"> Total Borrows </TableCell>
                            <TableCell align="right"> Exchange Rate </TableCell>
                            <TableCell align="right"> Reserves </TableCell>
                            <TableCell align="right" className={classes.collateralPadding}>
                                Collateral
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {suppliedData && suppliedData.map((data) => (
                            <>
                                <TableRow key={data.title}>
                                    <TableCell>
                                        <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                        <Typography className={classes.tokenName}>
                                            {' '} ꜰ{data.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right"> {truncateNum(data.rate)}% </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.balanceUnderlying > 0) ? nFormatter(decimalify(data.balanceUnderlying.toString(), decimals[data.title], decimals[data.title])) : '0.00'} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                            ${(data.balanceUnderlying > 0) ? nFormatter(decimalify((data.balanceUnderlying * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span className={classes.faintFont}>
                                            ${(data.cash > 0) ? nFormatter(decimalify((data.cash * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.marketSize > 0) ? nFormatter(decimalify(data.marketSize.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                                ${(data.marketSize > 0) ? nFormatter(decimalify((data.marketSize * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.totalBorrowed > 0) ? nFormatter(decimalify(data.totalBorrowed.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                                ${(data.totalBorrowed > 0) ? nFormatter(decimalify((data.totalBorrowed * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align='right'>{data.exchangeRate}</TableCell>
                                    <TableCell align='right'>{data.reserves}</TableCell>
                                    <TableCell align="right" className={classes.switchPadding}>
                                        <Switch data={data} />
                                    </TableCell>
                                </TableRow>
                            </>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    );
};

export default DebugDashboard;

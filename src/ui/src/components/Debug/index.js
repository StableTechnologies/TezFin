/* eslint-disable no-param-reassign */
/* eslint-disable array-callback-return */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import * as SW from '@mui/material/Switch';

import { BigNumber } from 'bignumber.js';
import { decimals, TezosLendingPlatform } from 'tezoslendingplatformjs';

import {
    decimalify, nFormatter, formatTokenData, truncateNum
} from '../../util';
import Switch from '../Switch';
// import Tez from './assets/largeXTZ.svg';

import { useStyles } from '../Dashboard/style';

const DebugDashboard = () => {
    const classes = useStyles();
    const marketData = [];

    const [address, setAddress] = useState('');
    const [account, setAccount] = useState('');
    const [suppliedMarket, setSuppliedMarket] = useState('');
    const [borrowedMarket, setBorrowedMarket] = useState('');
    const [markets, setMarkets] = useState('');

    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { comptroller, protocolAddresses } = useSelector((state) => state.nodes);

    const init = async () => {
        const getMarkets = await TezosLendingPlatform.GetMarkets(comptroller, protocolAddresses, server);
        setMarkets(getMarkets);
    };

    const fetchData = async () => {
        if (address) {
            const getAccount = await TezosLendingPlatform.GetAccount(address, markets, comptroller, protocolAddresses, server);
            setAccount(getAccount);

            const getSuppliedMarket = TezosLendingPlatform.getSuppliedMarkets(getAccount, markets);
            setSuppliedMarket(getSuppliedMarket);

            const getBorrowedMarket = TezosLendingPlatform.getBorrowedMarkets(getAccount, markets);
            setBorrowedMarket(getBorrowedMarket);
        }
    };

    // eslint-disable-next-line array-callback-return
    Object.entries(markets).map((x) => {
        marketData.push({
            title: x[0],
            usdPrice: new BigNumber(x[1].currentPrice.toString()).div(new BigNumber(10).pow(new BigNumber(6))).toFixed(4),
            totalSupply: new BigNumber(x[1].supply.totalAmount).toNumber(),
            totalBorrowed: new BigNumber(x[1].borrow.totalAmount).toNumber(),
            supplyRate: new BigNumber(x[1].supply.rate).toNumber(),
            borrowRate: new BigNumber(x[1].borrow.rate).toNumber(),
            exchangeRate: new BigNumber(x[1].exchangeRate).toNumber(),
            reserves: new BigNumber(x[1].reserves).toNumber(),
            cash: new BigNumber(x[1].cash).toNumber(),
            collateralFactor: new BigNumber(x[1].collateralFactor.toString()).div(new BigNumber(10).pow(new BigNumber(18))).toFixed(),
            reserveFactor: x[1].reserveFactor
        });
    });

    const walletBalance = account.underlyingBalances || [];

    marketData.map((y) => {
        Object.entries(suppliedMarket).map((x) => {
            if (x[0] === y.title) {
                y.balanceUnderlyingSupply = new BigNumber(x[1].balanceUnderlying).toNumber();
                y.collateral = x[1].collateral;
                y.supplyRate = x[1].rate;
            }
            y.walletBalance = walletBalance[y.title].toString();
        });
        Object.entries(borrowedMarket).map((x) => {
            if (x[0] === y.title) {
                y.balanceUnderlyingBorrow = new BigNumber(x[1].balanceUnderlying).toNumber();
                y.borrowRate = x[1].rate;
            }
        });
        return marketData;
    });

    useEffect(() => {
        init();
    }, [comptroller, protocolAddresses, server]);

    return (
        <Grid container className={classes.dashboard} marginTop='1rem'>
            <TextField
                id="outlined-name"
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />
            <button onClick={fetchData}> fetch data</button>
            <TableContainer className={`${classes.root} ${classes.tableCon}`}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell> Token </TableCell>
                            <TableCell align="right"> Supply APY </TableCell>
                            <TableCell align="right"> Borrow APY </TableCell>
                            <TableCell align="right"> Balance(Supply) </TableCell>
                            <TableCell align="right"> Balance(Borrow) </TableCell>
                            <TableCell align="right"> Cash </TableCell>
                            <TableCell align="right"> Current Price </TableCell>
                            <TableCell align="right"> Total Supply </TableCell>
                            <TableCell align="right"> Total Borrows </TableCell>
                            <TableCell align="right"> Exchange Rate </TableCell>
                            <TableCell align="right"> collateral Factor </TableCell>
                            <TableCell align="right"> Reserves </TableCell>
                            <TableCell align="right"> Reserve Factor </TableCell>
                            <TableCell align="right" className={classes.collateralPadding}>
                                Collateral
                            </TableCell>
                            <TableCell align="right"> Wallet </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(marketData.length > 0) && marketData.map((data) => (
                            <>
                                <TableRow key={data.title}>
                                    <TableCell> ꜰ{data.title} </TableCell>
                                    <TableCell align="right"> { data.supplyRate ? truncateNum(data.supplyRate) : 0}% </TableCell>
                                    <TableCell align="right"> { data.borrowRate ? truncateNum(data.borrowRate) : 0}% </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.balanceUnderlyingSupply > 0) ? nFormatter(decimalify(data.balanceUnderlyingSupply.toString(), decimals[data.title], decimals[data.title])) : '0.00'} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                            ${(data.balanceUnderlyingSupply > 0) ? nFormatter(decimalify((data.balanceUnderlyingSupply * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.balanceUnderlyingBorrow > 0) ? nFormatter(decimalify(data.balanceUnderlyingBorrow.toString(), decimals[data.title], decimals[data.title])) : '0.00'} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                            ${(data.balanceUnderlyingBorrow > 0) ? nFormatter(decimalify((data.balanceUnderlyingBorrow * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.cash > 0) ? nFormatter(decimalify(data.cash.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                            ${(data.cash > 0) ? nFormatter(decimalify((data.cash * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span className={classes.faintFont}>
                                            ${(data.usdPrice > 0) ? data.usdPrice : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="right">
                                        <span>
                                            {(data.totalSupply > 0) ? nFormatter(decimalify(data.totalSupply.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                                ${(data.totalSupply > 0) ? nFormatter(decimalify((data.totalSupply * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
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
                                    <TableCell align='right'>{data.collateralFactor}</TableCell>
                                    <TableCell align='right'>{data.reserves}</TableCell>
                                    <TableCell align='right'>{data.reserveFactor}</TableCell>
                                    <TableCell align="right" className={classes.switchPadding}>
                                        {data.collateral ? <Switch data={data} /> : <SW.default disabled />}
                                    </TableCell>
                                    <TableCell align="right">
                                        <span className={classes.clearFont}>
                                            {(data.walletBalance > 0) ? nFormatter(decimalify(data.walletBalance.toString(), decimals[data.title])) : '0'} {data.title}
                                        </span> <br/>
                                        <span className={classes.faintFont}>
                                                ${(data.walletBalance > 0) ? nFormatter(decimalify((data.walletBalance * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
                                        </span>
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

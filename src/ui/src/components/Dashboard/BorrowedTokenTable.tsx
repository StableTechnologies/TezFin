/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Button, tooltipClasses, Typography } from '@mui/material';

// eslint-disable-next-line object-curly-newline
import { decimalify, formatTokenData, nFormatter, roundValue, truncateNum } from '../../util';

import TableSkeleton from '../Skeleton';
import BorrowModal from '../BorrowModal';

import { useStyles } from './style';
import LightTooltip from '../Tooltip/LightTooltip';

const BorrowedTokenTable = (props) => {
    const classes = useStyles();
    const { tableData } = props;
    const { address } = useSelector((state: any) => state.addWallet.account);
    const { allMarkets } = useSelector((state: any) => state.market);
    const { totalCollateral } = useSelector((state: any) => state.supplyComposition.supplyComposition);

    const [tokenDetails, setTokenDetails] = useState();
    const [openMktModal, setMktModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openRepayTab, setRepayTab] = useState(false);


    const closeModal = () => {
        setMktModal(false);
        setRepayTab(false);
    };

    const handleClickMktModal = (item) => {
        setTokenDetails(item);
        setMktModal(true);
    };

    const handleClickRepay = (item) => {
        setTokenDetails(item);
        setMktModal(true);
        setRepayTab(true);
    };

    const borrowedData = formatTokenData(tableData);

    useEffect(() => {
        allMarkets.map((x) => {
            if ((address && x.walletBalance) || (!address && x.marketSize)) {
                setLoading(false);
            }
            return loading;
        });
    }, [allMarkets]);

    return (
        <TableContainer className={`${classes.root} ${classes.tableCon}`}>
            {tokenDetails && <BorrowModal open={openMktModal} close={closeModal} tokenDetails={tokenDetails} tab={openRepayTab ? 'two' : undefined} />}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> Token </TableCell>
                        <TableCell align="center"> APY </TableCell>
                        <TableCell align="center"> Balance </TableCell>
                        <TableCell align="center"> </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {borrowedData.length === 0 && (
                        <>
                            {loading ? (
                                <TableSkeleton cell={4} />
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className={classes.emptyStateText}>
                                        {address
                                            ? 'You are not borrowing assets at this time.'
                                            : 'You are not connected to a wallet at this time.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    )}
                    {borrowedData &&
                        borrowedData.map((data) => (
                            <TableRow key={data.title} onClick={() => handleClickMktModal(data)}>
                                <TableCell className={classes.firstCell}>
                                    <div>
                                        <div className={classes.token}>
                                            <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />

                                            <div className={classes.tokenTitle}>
                                                <Typography className={classes.tokenName}> {data.name} </Typography>
                                                <Typography className={classes.faintFont}> {data.title} </Typography>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell align="center" className={classes.clearFont}>
                                    <span className={classes.clearFont}>
                                        {data.rate > 0
                                            ? // checks if rate is lower than 0.1% (all rates lower than 0.01% is shown as <0.01%)
                                              new BigNumber(data.rate).gt(new BigNumber(10000000000000000))
                                                ? roundValue(decimalify(data.rate, 18))
                                                : '<0.01'
                                            : '0'}
                                        %
                                    </span>
                                </TableCell>
                                <TableCell align="center">
                                    <LightTooltip
                                        sx={{
                                            [`& .${tooltipClasses.tooltip}`]: {
                                                marginBottom: '11px !important'
                                            }
                                        }}
                                        title={ <>
                                            <Typography className={classes.tooltipPrimaryText}>
                                                {`${decimalify(
                                                    data.outstandingLoan,
                                                    decimals[data.title],
                                                    decimals[data.title]
                                                ).replace(/\.?0+$/, '')} ${data.title}`}
                                            </Typography>
                                            <Typography className={classes.tooltipSecondaryText}>
                                                                                    $
                                                {data.balanceUnderlying > 0
                                                    ? nFormatter(
                                                        decimalify(
                                                            (data.outstandingLoan * data.usdPrice).toString(),
                                                            decimals[data.title],
                                                            decimals[data.title]
                                                        )
                                                    )
                                                    : '0.00'}
                                            </Typography>
                                        </>}
                                        placement="top"
                                    >
                                        <span className={classes.clearFont}>
                                            {data.outstandingLoan > 0 &&
                                            decimalify(
                                                data.outstandingLoan.toString(),
                                                decimals[data.title],
                                                decimals[data.title],
                                            ) < 0.01
                                                ? '>0.00'
                                                : nFormatter(
                                                      decimalify(
                                                          data.outstandingLoan.toString(),
                                                          decimals[data.title],
                                                          decimals[data.title],
                                                      ),
                                                  )}{' '}
                                            {data.title}
                                        </span>
                                    </LightTooltip>
                                    <br />
                                    <span className={classes.faintFont}>
                                        $
                                        {nFormatter(
                                            decimalify(
                                                (data.outstandingLoan * data.usdPrice).toString(),
                                                decimals[data.title],
                                                decimals[data.title],
                                            ),
                                        )}
                                    </span>
                                </TableCell>
                                <TableCell align="center" className={classes.repayCell}>
                                    <Button variant='contained' className={classes.detailsButton} onClick={() => handleClickRepay(data)}>
                                        R<Typography textTransform={'lowercase'}>epay</Typography>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BorrowedTokenTable;

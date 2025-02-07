/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { decimals } from 'tezoslendingplatformjs';
import BigNumber from 'bignumber.js';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Button, Typography } from '@mui/material';

import { decimalify, nFormatter, roundValue } from '../../util';

import AllMarketModal from '../AllMarketModal';
import TableSkeleton from '../Skeleton';

import { useStyles } from './style';

const SupplyMarketTokenTable = (props) => {
    const classes = useStyles();
    const { tableData } = props;
    const { address } = useSelector((state: any) => state.addWallet.account);

    const [tokenDetails, setTokenDetails] = useState();
    const [openMktModal, setMktModal] = useState(false);

    const closeModal = () => {
        setMktModal(false);
    };

    const handleClickMktModal = (item) => {
        setTokenDetails(item);
        setMktModal(true);
    };

    return (
        <TableContainer className={`${classes.root} ${classes.tableCon}`}>
            {tokenDetails && <AllMarketModal open={openMktModal} close={closeModal} tokenDetails={tokenDetails} />}
            <Table size="medium" sx={{ marginRight: '0px' }}>
                <TableHead>
                    <TableRow>
                        <TableCell className={classes.stickyCellLeft}>
                            Token
                        </TableCell>
                        <TableCell align="center"> Wallet </TableCell>
                        <TableCell align="center"> Supply APY </TableCell>
                        <TableCell className={classes.stickyCellRight} align="center"> </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableData?.map((data) => (
                        <React.Fragment key={data.title}>
                            {(address && data.walletBalance) || (!address && data.marketSize) ? (
                                <TableRow key={data.title} onClick={() => handleClickMktModal(data)}>
                                    <TableCell className={`${classes.firstCell} ${classes.stickyCellLeft} ${classes.stickyCellHover}`}>
                                        <div className={classes.token}>
                                            <img
                                                src={data.logo}
                                                alt={`${data.title}-Icon`}
                                                className={classes.img}
                                            />

                                            <div className={classes.tokenTitle}>
                                                <Typography className={classes.tokenName}> {data.name} </Typography>
                                                <Typography className={classes.faintFont}>
                                                    {' '}
                                                    {data.title}{' '}
                                                </Typography>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell align="center" className={classes.clearFont}>
                                        <span className={classes.clearFont}>
                                            {data.walletBalance > 0
                                                ? decimalify(
                                                      data.walletBalance.toString(),
                                                      decimals[data.title],
                                                      decimals[data.title],
                                                  ) < 0.01
                                                    ? '>0.00'
                                                    : nFormatter(
                                                          decimalify(
                                                              data.walletBalance.toString(),
                                                              decimals[data.title],
                                                              decimals[data.title],
                                                          ),
                                                      )
                                                : '0'}{' '}
                                            {data.title}
                                        </span>{' '}
                                        <br />
                                        <span className={classes.faintFont}>
                                            $
                                            {data.walletBalance > 0
                                                ? nFormatter(
                                                      decimalify(
                                                          (data.walletBalance * data.usdPrice).toString(),
                                                          decimals[data.title],
                                                          decimals[data.title],
                                                      ),
                                                  )
                                                : '0.00'}
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={classes.clearFont}>
                                        <span>
                                            {data.supplyRate > 0
                                                ? // checks if rate is lower than 0.1% (all rates lower than 0.01% is shown as <0.01%)
                                                  new BigNumber(data.supplyRate).gt(new BigNumber(10000000000000000))
                                                    ? roundValue(decimalify(data.supplyRate, 18))
                                                    : '<0.01'
                                                : '0'}
                                            %
                                        </span>
                                    </TableCell>
                                    <TableCell align="center" className={`${classes.fourthCell} ${classes.stickyCellRight} ${classes.stickyCellHover}`}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                size="medium"
                                                className={classes.supplyButton}
                                                onClick={() => handleClickMktModal(data)}
                                            >
                                                S<Typography textTransform={'lowercase'}>upply</Typography>
                                            </Button>
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableSkeleton index={data.title} cell={4} />
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default SupplyMarketTokenTable;

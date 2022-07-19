/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import { decimals } from 'tezoslendingplatformjs';
import { decimalify, nFormatter, truncateNum } from '../../util';

import AllMarketModal from '../AllMarketModal';
import TableSkeleton from '../Skeleton';

import { useStyles } from './style';
import LightTooltip from '../DashboardModal/LightTooltip';

const AllMarketTokenTable = (props) => {
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
            {tokenDetails && (
                <AllMarketModal
                    open={openMktModal}
                    close={closeModal}
                    tokenDetails={tokenDetails}
                />)}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> Token </TableCell>
                        <TableCell align="right"> Market Size </TableCell>
                        <TableCell align="right"> Total Borrowed </TableCell>
                        <TableCell align="right"> Supply APY </TableCell>
                        <TableCell align="right"> Borrow APY </TableCell>
                        <TableCell align="right"> Wallet </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tableData?.map((data) => (
                        <React.Fragment key={data.title}>
                            {
                                ((address && data.walletBalance) || (!address && data.marketSize))
                                    ? <TableRow key={data.title} onClick={() => handleClickMktModal(data)}>
                                        <TableCell>
                                            <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                            <Typography className={classes.tokenName}> {' '} {data.title} </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <span className={classes.clearFont}>
                                                {(data.marketSize > 0) ? nFormatter(decimalify(data.marketSize.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                            </span> <br/>
                                            <span className={classes.faintFont}>
                                                ${(data.marketSize > 0) ? nFormatter(decimalify((data.marketSize * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right">
                                            <span className={classes.clearFont}>
                                                {(data.totalBorrowed > 0) ? nFormatter(decimalify(data.totalBorrowed.toString(), decimals[data.title])) : '0'} {' '} {data.title}
                                            </span> <br/>
                                            <span className={classes.faintFont}>
                                                ${(data.totalBorrowed > 0) ? nFormatter(decimalify((data.totalBorrowed * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right" className={classes.clearFont}>
                                            <LightTooltip
                                                title={data.supplyRate > 0 ? `${decimalify(data.supplyRate, 18)}%` : ''}
                                                placement="bottom"
                                            >
                                                <span>
                                                    {(data.supplyRate > 0) ? `${truncateNum(decimalify(data.supplyRate, 18))}...` : 0}%
                                                </span>
                                            </LightTooltip>
                                        </TableCell>
                                        <TableCell align="right" className={classes.clearFont}>
                                            <LightTooltip
                                                title={data.borrowRate > 0 ? `${decimalify(data.borrowRate, 18)}%` : ''}
                                                placement="bottom"
                                            >
                                                <span>
                                                    {(data.borrowRate > 0) ? `${truncateNum(decimalify(data.borrowRate, 18))}...` : 0}%
                                                </span>
                                            </LightTooltip>
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
                                    : <TableSkeleton index={data.title} cell={6}/>
                            }
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AllMarketTokenTable;

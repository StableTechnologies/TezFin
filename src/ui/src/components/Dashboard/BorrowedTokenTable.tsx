import React, { useState } from 'react';

import BorrowModal from '../BorrowModal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Link, Typography } from '@mui/material';
import { decimalify } from '../../util';
import { decimals } from 'tezoslendingplatformjs';
import { formatBorrowedTokenData } from '../../library/util';

import { useStyles } from './style';


const BorrowedTokenTable = (props) => {
    const classes = useStyles();
    const { tableData } = props;

    const [tokenDetails, setTokenDetails] = useState();
    const [openMktModal, setMktModal] = useState(false);

    const closeModal = () => {
        setMktModal(false);
    };

    const handleClickMktModal = (item, event) => {
        setTokenDetails(item);
        setMktModal(true);
    };

    const displayData = formatBorrowedTokenData(tableData);

    return (
        <TableContainer className={`${classes.root} ${classes.tableCon}`}>
            {tokenDetails && (
                <BorrowModal
                    open={openMktModal}
                    close={closeModal}
                    tokenDetails={tokenDetails}
                />)}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> Token </TableCell>
                        <TableCell align="right"> APY </TableCell>
                        <TableCell align="right"> Balance </TableCell>
                        <TableCell align="right"> Limit used </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(displayData.length === 0) &&
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Typography className={classes.emptyStateText} textAlign="left"> You are not borrowing assets at this time. </Typography>
                            <Link href="#" className={classes.emptyStateLink} textAlign="left"> How to borrow assets </Link>
                          </TableCell>
                        </TableRow>
                    }
                    {displayData && displayData.map((data) => (
                        <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
                            <TableCell>
                                <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                <Typography className={classes.tokenName}>
                                   {" "} {data.title}
                                </Typography>
                            </TableCell>
                            <TableCell align="right"> {Number(data.rate).toFixed(2)}% </TableCell>
                            <TableCell align="right">
                                <span>
                                    {data.balanceUnderlying ? decimalify(data.balanceUnderlying.toString(), decimals[data.title]) : decimalify(data.balance, decimals[data.title]) || '0'} {data.title}
                                </span> <br/>
                                <span className={classes.faintFont}>
                                    ${data.balanceUsd ? decimalify(data.balanceUsd.toString(), decimals[data.title] + 18, 2) : '0.00'}
                                </span>
                            </TableCell>
                            <TableCell align="right">
                                <span>
                                    ${data.liquidityUsd > 0 ? data.liquidityUsd.toString() : '0.00'}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BorrowedTokenTable;

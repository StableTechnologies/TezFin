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

    // if (displayData.length === 0) { return (<></>); }

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
                        <TableCell> APY </TableCell>
                        <TableCell> Balance </TableCell>
                        <TableCell> Limit used </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {(displayData.length === 0) &&
                        <TableRow>
                          <TableCell colSpan={6}> You are not borrowing assets at this time.
                            <Link href="#" className={classes.emptyStateLink}> How to borrow assets </Link>
                          </TableCell>
                        </TableRow>
                    }
                    {displayData && displayData.map((data) => (
                        <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
                            <TableCell>
                                <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                <Typography sx={{ display: 'inline' }}>
                                   {" "} {data.title}
                                </Typography>
                            </TableCell>
                            <TableCell> {Number(data.rate).toFixed(6)}% </TableCell>
                            <TableCell>
                                <Typography>
                                    {data.balanceUnderlying ? decimalify(data.balanceUnderlying.toString(), decimals[data.title]) : decimalify(data.balance, decimals[data.title]) || '0'} {data.title}
                                </Typography>
                                <Typography className={classes.faintFont}>
                                    ${data.balanceUsd ? decimalify(data.balanceUsd.toString(), decimals[data.title] + 18, 2) : '0.00'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography>
                                    ${data.liquidityUsd > 0 ? data.liquidityUsd.toString() : '0.00'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BorrowedTokenTable;
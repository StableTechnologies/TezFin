import React, { useState } from 'react';

import BorrowModal from '../BorrowModal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
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

    if (displayData.length === 0) { return (<></>); }

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
                        <TableCell> Rate </TableCell>
                        <TableCell> Balance </TableCell>
                        <TableCell> Borrow limit used </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayData && displayData.map((data) => (
                        <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
                            <TableCell>
                                <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                <Typography sx={{ display: 'inline' }}>
                                    {data.title}
                                </Typography>
                            </TableCell>
                            <TableCell> {Number(data.rate).toFixed(6)}% </TableCell>
                            <TableCell>
                                <Typography>
                                    {data.balanceUnderlying ? decimalify(data.balanceUnderlying.toString(), decimals[data.title]) : decimalify(data.balance, decimals[data.title]) || '0'} {data.title}
                                </Typography>
                                <Typography className={classes.faintFont}>
                                    ${data.walletUnderlying > 0 ? data.walletUnderlying.toString() : '0.00'}
                                </Typography>
                            </TableCell>
                            <TableCell className={classes.toggle}>
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

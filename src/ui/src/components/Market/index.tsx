/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import CopyIcon from '../../assets/copyIcon.svg';
import { tokens } from '../Constants/index';

import { useStyles } from './style';

const Market = () => {
    const classes = useStyles();

    return (
        <TableContainer className={`${classes.root} ${classes.tableCon}`}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell> Borrower Address </TableCell>
                        <TableCell align="right"> Liquidator Address </TableCell>
                        <TableCell align="right"> Borrowed Token </TableCell>
                        <TableCell align="right"> Collateral Token </TableCell>
                        <TableCell align="right"> Repaid Value </TableCell>
                        <TableCell align="right"> Seized Value </TableCell>
                        <TableCell align="right"> Timestamp </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tokens && tokens.map((data) => (
                        <>
                            <TableRow key={data.title}>
                                <TableCell>
                                    <div className={classes.flexAdd}>
                                        <Typography className={classes.address}> tz1aMQrJ...wGUuKg </Typography> {/* //change class name */}
                                        <img src={CopyIcon} alt='Copy-Icon' className={classes.copyICon} />
                                    </div>
                                </TableCell>
                                <TableCell align="right">
                                    <div className={`${classes.flexAdd} ${classes.justifyEnd}`}>
                                        <Typography className={classes.address}> tz1aMQrJ...wGUuKg </Typography> {/* //change class name */}
                                        <img src={CopyIcon} alt='Copy-Icon' className={classes.copyICon} />
                                    </div>
                                </TableCell>
                                <TableCell align="right">
                                    <div className={`${classes.flexAdd} ${classes.justifyCenter}`}>
                                        <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                        <Typography> {' '} {data.title} </Typography>
                                    </div>
                                </TableCell>
                                <TableCell align="right">
                                    <div className={`${classes.flexAdd} ${classes.justifyCenter}`}>
                                        <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                        <Typography> {' '} {data.title} </Typography>
                                    </div>
                                </TableCell>
                                <TableCell align="right"> 3,356.18 BTCtz  </TableCell>
                                <TableCell align="right"> 4,356.18 XTZ   </TableCell>
                                <TableCell align="right">
                                    <span>
                                        April 14th, 2022 1:21:20
                                    </span> <br/>
                                    <span>
                                        Block Level: 11235
                                    </span>
                                </TableCell>
                            </TableRow>
                        </>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default Market;

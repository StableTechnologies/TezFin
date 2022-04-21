/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { decimals } from 'tezoslendingplatformjs';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

// eslint-disable-next-line object-curly-newline
import { decimalify, formatTokenData, nFormatter, truncateNum } from '../../util';

import TableSkeleton from '../Skeleton';
import BorrowModal from '../BorrowModal';

import { useStyles } from './style';

const BorrowedTokenTable = (props) => {
    const classes = useStyles();
    const { tableData } = props;

    const { address } = useSelector((state: any) => state.addWallet.account);
    const { allMarkets } = useSelector((state: any) => state.market);

    const [tokenDetails, setTokenDetails] = useState();
    const [openMktModal, setMktModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const closeModal = () => {
        setMktModal(false);
    };

    const handleClickMktModal = (item) => {
        setTokenDetails(item);
        setMktModal(true);
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
            {tokenDetails && (
                <BorrowModal
                    open={openMktModal}
                    close={closeModal}
                    tokenDetails={tokenDetails}
                />
            )}
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
                    {(borrowedData.length === 0)
                      && <>
                          {loading
                              ? <TableSkeleton cell={4}/>
                              : <TableRow>
                                  <TableCell colSpan={4} className={classes.emptyStateText}>
                                      { address
                                          ? 'You are not borrowing assets at this time.'
                                          : 'You are not connected to a wallet at this time.'
                                      }
                                  </TableCell>
                              </TableRow>
                          }
                      </>
                    }
                    {borrowedData && borrowedData.map((data) => (
                        <TableRow key={data.title} onClick={() => handleClickMktModal(data)}>
                            <TableCell>
                                <img src={data.logo} alt={`${data.title}-Icon`} className={classes.img} />
                                <Typography className={classes.tokenName}>
                                    {' '} {data.title}
                                </Typography>
                            </TableCell>
                            <TableCell align="right"> {truncateNum(data.rate)}% </TableCell>
                            <TableCell align="right">
                                <span>
                                    {(data.balanceUnderlying > 0) ? nFormatter(decimalify(data.balanceUnderlying.toString(), decimals[data.title], decimals[data.title])) : '0'} {' '} {data.title}
                                </span> <br/>
                                <span className={classes.faintFont}>
                                    ${(data.balanceUnderlying > 0) ? nFormatter(decimalify((data.balanceUnderlying * data.usdPrice).toString(), decimals[data.title], decimals[data.title])) : '0.00'}
                                </span>
                            </TableCell>
                            <TableCell align="right">
                                <span>
                                    ${(data.liquidityUnderlying > 0) ? nFormatter(decimalify((data.liquidityUnderlying * data.usdPrice).toString(), decimals[data.title])) : '0.00'}
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

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
import { Typography } from '@mui/material';

// eslint-disable-next-line object-curly-newline
import { decimalify, formatTokenData, truncateNum } from '../../util';

import TableSkeleton from '../Skeleton';
import BorrowModal from '../BorrowModal';

import { useStyles } from './style';
import MarketTooltip from '../Tooltip';

const BorrowedTokenTable = (props) => {
    const classes = useStyles();
    const { tableData } = props;

    const { address } = useSelector((state: any) => state.addWallet.account);
    const { allMarkets } = useSelector((state: any) => state.market);
    const { totalCollateral } = useSelector((state: any) => state.supplyComposition.supplyComposition);

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
                            <TableCell align="right" className={classes.clearFont}> {(data.rate > 0) ? truncateNum(decimalify(data.rate.toString(), 18)) : '0'}% </TableCell>
                            <TableCell align="right">
                                <MarketTooltip
                                    data={data.balanceUnderlying}
                                    dataUsd={new BigNumber(data.balanceUnderlying).multipliedBy(data.usdPrice).toNumber()}
                                    assetType={data.title}
                                    classes={classes}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <span className={classes.clearFont}>
                                    {truncateNum(
                                        new BigNumber(
                                            decimalify((data.balanceUnderlying * data.usdPrice).toString(), decimals[data.title], decimals[data.title])
                                        ).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100).toNumber()
                                    )}%
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

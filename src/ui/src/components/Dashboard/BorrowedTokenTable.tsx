import React, { useState } from 'react';

import BorrowModal from '../BorrowModal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import { decimalify, formatTokenData, nFormatter } from '../../util';
import { decimals } from 'tezoslendingplatformjs';

import { useStyles } from './style';
import { useSelector } from 'react-redux';


const BorrowedTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;

  const { address } = useSelector((state: any) => state.addWallet.account);

  const [tokenDetails, setTokenDetails] = useState();
  const [openMktModal, setMktModal] = useState(false);

  const closeModal = () => {
    setMktModal(false);
  };

  const handleClickMktModal = (item, event) => {
    setTokenDetails(item);
    setMktModal(true);
  };

  const displayData = formatTokenData(tableData);

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
            {(displayData.length === 0) &&
              <TableRow>
                <TableCell colSpan={4} className={classes.emptyStateText}>
                  { address ?
                    'You are not borrowing assets at this time.' :
                    'You are not connected to a wallet at this time.'
                  }
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
                    {(data.balanceUnderlying > 0) ? nFormatter(decimalify(data.balanceUnderlying.toString(), decimals[data.title])) : "0"} {" "} {data.title}
                  </span> <br/>
                  <span className={classes.faintFont}>
                    ${(data.balanceUnderlying > 0) ? nFormatter(decimalify((data.balanceUnderlying * data.usdPrice).toString(), decimals[data.title])) : "0.00"}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <span>
                    ${(data.liquidityUnderlying > 0) ? nFormatter(decimalify((data.liquidityUnderlying * data.usdPrice).toString(), decimals[data.title])) : "0.00"}
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

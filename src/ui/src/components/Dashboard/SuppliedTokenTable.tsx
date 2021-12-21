import React, { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import Switch from '../Switch';
import SupplyModal from '../SupplyModal';

import { decimalify } from '../../util';
import { decimals } from 'tezoslendingplatformjs';
import { formatSuppliedTokenData } from '../../library/util';

import { useStyles } from './style';

const SuppliedTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;

  const [tokenDetails, setTokenDetails] = useState();
  const [openSupplyModal, setSupplyModal] = useState(false);

  const closeModal = () => {
    setSupplyModal(false);
  };

  const handleClickMktModal = (item, event) => {
    setTokenDetails(item);
    setSupplyModal(true);
  };

    // const displayData = formatSuppliedTokenData(tableData);

    // if (displayData.length === 0) { return (<></>); }

  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {tokenDetails && (
        <SupplyModal
          open={openSupplyModal}
          close={closeModal}
          tokenDetails={tokenDetails}
        />
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell> Token </TableCell>
            <TableCell> APY/Earned </TableCell>
            <TableCell> Balance </TableCell>
            <TableCell> Collateral </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData && tableData.map((data) => (
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
                  ${data.walletUnderlying > 0 ? data.walletUnderlying.toString() : '0.00'}
                </Typography>
              </TableCell>
              <TableCell>
                <Switch data={data} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SuppliedTokenTable;

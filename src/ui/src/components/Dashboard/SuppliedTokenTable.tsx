import React, { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Link from '@mui/material/Link';

import Switch from '../Switch';
import SupplyModal from '../SupplyModal';
import CollateralizeModal from '../CollateralizeModal';
import DisableCollateralModal from '../DisableCollateralModal';
import Tez from '../../assets/largeXTZ.svg';

import { decimalify } from '../../util';
import { decimals } from 'tezoslendingplatformjs';
import { formatSuppliedTokenData } from '../../library/util';

import { useStyles } from './style';

const SuppliedTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;

  const [tokenDetails, setTokenDetails] = useState();
  const [openSupplyModal, setSupplyModal] = useState(false);
  const [collModal, setCollModal] = useState(false);
  const [disableCollModal, setDisableCollModal] = useState(false);

  const closeModal = () => {
    setSupplyModal(false);
    setDisableCollModal(false);
    setCollModal(false);
  };

  const handleClickMktModal = (item, event) => {
    setTokenDetails(item);
    if (event.target.type === 'checkbox') {
        if (item.collateral === true) {
            setDisableCollModal(true);
        }
        if (item.collateral === false) {
            setCollModal(true);
        }
    } else {
      setSupplyModal(true);
    }
};

  const displayData = formatSuppliedTokenData(tableData);

  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {tokenDetails && (
        <>
          <SupplyModal
            open={openSupplyModal}
            close={closeModal}
            tokenDetails={tokenDetails}
          />
          <DisableCollateralModal
            open={disableCollModal}
            close={closeModal}
            tokenDetails={tokenDetails}
        />
        <CollateralizeModal
            open={collModal}
            close={closeModal}
            tokenDetails={tokenDetails}
        />
        </>
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
          {(displayData.length === 0) &&
            <TableRow>
              <TableCell colSpan={6} className={classes.emptyStateText}> You are not supplying assets at this time.
                <Link href="#" className={classes.emptyStateLink}> How to supply assets </Link>
              </TableCell>
            </TableRow>
          }
          {displayData && displayData.map((data) => (
            <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
              <TableCell>
                <img src={Tez} alt={`${data.title}-Icon`} className={classes.img} />
                <Typography sx={{ display: 'inline' }}>
                  {" "} ꜰ{data.title}
                </Typography>
              </TableCell>
              <TableCell> {Number(data.rate).toFixed(2)}% </TableCell>
              <TableCell>
                <Typography>
                  {(data.balanceUnderlying > 0) ? decimalify(data.balanceUnderlying, decimals[data.title]) : '0.00'} {data.title}
                </Typography>
                <Typography className={classes.faintFont}>
                  ${data.balanceUsd ? decimalify(data.balanceUsd.toString(), decimals[data.title] + 18, 2) : '0.00'}
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

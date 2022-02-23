import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import TableSkeleton from '../Skeleton';
import Switch from '../Switch';
import SupplyModal from '../SupplyModal';
import CollateralizeModal from '../CollateralizeModal';
import DisableCollateralModal from '../DisableCollateralModal';

import Tez from '../../assets/largeXTZ.svg';
import questionCircleIcon from '../../assets/questionCircle.svg'

import { decimalify, formatTokenData, nFormatter } from '../../util';
import { decimals } from 'tezoslendingplatformjs';

import { useStyles } from './style';

const SuppliedTokenTable = (props) => {
  const classes = useStyles();
  const { tableData } = props;

  const { address } = useSelector((state: any) => state.addWallet.account);
  const { allMarkets } = useSelector((state: any) => state.market);

  const [tokenDetails, setTokenDetails] = useState();
  const [openSupplyModal, setSupplyModal] = useState(false);
  const [collModal, setCollModal] = useState(false);
  const [disableCollModal, setDisableCollModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const suppliedData = formatTokenData(tableData);

  useEffect(() => {
    allMarkets.map(x=>{
      if((address && x.walletBalance) || (!address && x.marketSize)) {
          setLoading(false);
        }
    });
  }, [allMarkets, address]);

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
            <TableCell align="right"> APY/Earned </TableCell>
            <TableCell align="right"> Balance </TableCell>
            <TableCell align="right" className={classes.collateralPadding}>
              Collateral {" "}
              <img src={questionCircleIcon} alt={"questionIcon"} className={classes.questionCircleIcon} />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(suppliedData.length === 0) &&
            <>
              {loading ?
              <TableSkeleton cell={4}/> :
              <TableRow>
                <TableCell colSpan={4} className={classes.emptyStateText}>
                  { address ?
                    'You are not supplying assets at this time.' :
                    'You are not connected to a wallet at this time.'
                  }
                </TableCell>
              </TableRow>
              }
            </>
          }
          {suppliedData && suppliedData.map((data) => (
            <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
              <TableCell>
                <img src={Tez} alt={`${data.title}-Icon`} className={classes.img} />
                <Typography className={classes.tokenName}>
                  {" "} ꜰ{data.title}
                </Typography>
              </TableCell>
              <TableCell align="right"> {Number(data.rate).toFixed(2)}% </TableCell>
              <TableCell align="right">
                <span>
                  {(data.balanceUnderlying > 0) ? nFormatter(decimalify(data.balanceUnderlying.toString(), decimals[data.title])) : '0.00'} {data.title}
                </span> <br/>
                <span className={classes.faintFont}>
                  ${(data.balanceUnderlying > 0) ? nFormatter(decimalify((data.balanceUnderlying * data.usdPrice).toString(), decimals[data.title])) : "0.00"}
                </span>
              </TableCell>
              <TableCell align="right" className={classes.switchPadding}>
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

import React, { useEffect, useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Tez from '../../assets/largeXTZ.svg';

import Switch from '../Switch';
import { useStyles } from './style';
import SupplyModal from '../SupplyModal';
import BorrowModal from '../BorrowModal';
import CollateralizeModal from '../CollateralizeModal';
import ConfirmModal from '../PendingModal/index.js';
import DisableCollateralModal from '../DisableCollateralModal';


const Market = (props) => {
  const classes = useStyles();
  const {heading1, heading2, heading3, heading4, toggle, tableData, supplyMkt, borrowMkt, supplyingMkt} =props;

  const [valueofRow, setValueOfRow] = useState();
  const [openMktModal, setMktModal] = useState(false);
  const [collModal, setCollModal] = useState(false);
  const [disableCollModal, setDisableCollModal] = useState(false);
  const [openConfirmModal, setConfirmModal] =useState(false);
  const [enableToken, setEnableToken] =useState(false);

  const closeModal = () => {
    setMktModal(false);
    setDisableCollModal(false);
    setCollModal(false);
  };

  const handleClickMktModal = (item, event) => {
    setValueOfRow(item);
    if (event.target.type === "checkbox") {
      if(item.collateral === true) { setDisableCollModal(true) }
      if(item.collateral === false) {setCollModal(true) }
    }
    else { setMktModal(true) }

  }

  const handleClickEnableToken = () => {
    setConfirmModal(true);
    setMktModal(false);
  };

  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  useEffect(() => {
    const timer = setTimeout(()=>{
      setConfirmModal(false);
      setMktModal(true);
    }, 3000);
    return () => { clearTimeout(timer); setEnableToken(true); };
  }, [openConfirmModal]);


  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {valueofRow &&
        <>
          {(supplyMkt || supplyingMkt) &&
            <SupplyModal open={openMktModal} close={closeModal} valueofRow={valueofRow} onClick={handleClickEnableToken} enableToken={enableToken} />
          }
          {borrowMkt &&
            <BorrowModal open={openMktModal} close={closeModal} valueofRow={valueofRow} />
          }
          {supplyingMkt &&
          <>
            {/* <CollateralizeModal open={openMktModal} close={closeModal} valueofRow={valueofRow} /> */}
          </>
          }
          <DisableCollateralModal open={disableCollModal} close={closeModal} valueofRow={valueofRow} />
          <CollateralizeModal open={collModal} close={closeModal} valueofRow={valueofRow} />
          <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} enableTokenText/>
        </>
      }
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{heading1}</TableCell>
            <TableCell>{heading2}</TableCell>
            <TableCell>
              {heading3}
            </TableCell>
            <TableCell>{heading4}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData && tableData.map(data =>(
            <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
              <TableCell>
                <img src={supplyingMkt ? Tez : data.logo} alt={data.title+ "-Icon"} className={classes.img} />
                <Typography sx={{ display: 'inline' }}> {data.title} </Typography>
              </TableCell>
              <TableCell> {data.apy ? data.apy + "%" : ""} </TableCell>
              <TableCell>
                <Typography>$ {data.wallet ?  data.wallet : "0.00"}  </Typography>
                {supplyMkt &&
                // <Typography>$ {data.wallet ?  data.wallet : "0.00" + data.title}  </Typography>
                  <Typography className={classes.faintFont}>  0 XTZ  </Typography>
                }
              </TableCell>
              <TableCell className={classes.toggle}>
              {toggle &&
                <Switch data={data}  />
              }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default Market;

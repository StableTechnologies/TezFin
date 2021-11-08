import React, { useEffect, useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import BasicSwitch from '../Switch';
import { useStyles } from './style';
import SupplyModal from '../SupplyModal';
import BorrowModal from '../BorrowModal';
import ConfirmModal from '../ConfirmModal/index.js';


const Market = (props) => {
  const classes = useStyles();
  const {heading1, heading2, heading3, heading4, toggle, tableData, supplyMkt, borrowMkt} =props;

  const [valueofRow, setValueOfRow] = useState();
  const [openMktModal, setMktModal] = useState(false);
  const [openConfirmModal, setConfirmModal] =useState(false);
  const [enableToken, setEnableToken] =useState(true);


  const closeMktModal = () => {
    setMktModal(false);
  };

  const handleClickMktModal = (item, event) => {
    if (event.target.type === "checkbox") return;
    setMktModal(true);
    setValueOfRow(item);
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
          {supplyMkt &&
            <SupplyModal open={openMktModal} close={closeMktModal} valueofRow={valueofRow} onClick={handleClickEnableToken} enableToken={enableToken} />
          }
          {borrowMkt &&
            <BorrowModal open={openMktModal} close={closeMktModal} valueofRow={valueofRow} onClick={handleClickEnableToken} />
          }
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
                <img src={data.logo} alt={data.title+ "-Icon"} className={classes.img} />
                <Typography sx={{ display: 'inline' }}> {data.title} </Typography>
              </TableCell>
              <TableCell> {data.apy ? data.apy + "%" : ""} </TableCell>
              <TableCell>
                <Typography>{data.wallet ? "$" + data.wallet : "0 " + data.title}  </Typography>
                {/* {supplyMkt &&
                  <Typography className={classes.faintFont}>  10,000 XTZ  </Typography>
                } */}
              </TableCell>
              <TableCell className={classes.toggle}>
              {toggle &&
                <BasicSwitch />
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

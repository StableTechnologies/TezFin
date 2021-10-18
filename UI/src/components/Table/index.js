import React, { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import BasicSwitch from '../Switch';
import { useStyles } from './style';
import MarketModal from '../MarketModal';
import SupplyModal from '../SupplyModal';
import BorrowModal from '../BorrowModal';
import ConfirmModal from '../ConfirmModal';


const BasicTable = (props) => {
  const classes = useStyles();

  const {heading1, heading2, heading3, heading4, toggle, tableData, openModal, val, supplyMkt, borrowMkt} =props;
  const [valueofRow, setValueOfRow] = useState();


// console.log(valueofRow, 'valueofRow');
  const [open, setOpen] = useState(false);
  const [openConfirmModal, setConfirmModal] =useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = (item, event) => {

    // openModal(item);
    setValueOfRow(item);
    if (event.target.type === "checkbox") return;
    handleClickOpen();
  }


  const handleClickConfirm = () => {
    setConfirmModal(true);
    setOpen(false);
  };

  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };


  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {valueofRow &&
        <>
          {/* <MarketModal open={open} close={handleClose} valueofRow={valueofRow} onClick={handleClickConfirm} /> */}
          {supplyMkt &&
            <SupplyModal open={open} close={handleClose} valueofRow={valueofRow} onClick={handleClickConfirm} />
          }
          {borrowMkt &&
            <BorrowModal open={open} close={handleClose} valueofRow={valueofRow} onClick={handleClickConfirm} />
          }
          <ConfirmModal open={openConfirmModal} close={handleCloseConfirm}/>
        </>
      }
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{heading1}</TableCell>
            <TableCell>{heading2}</TableCell>
            <TableCell>{heading3}</TableCell>
            <TableCell>{heading4}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map(data =>(
            <TableRow key={data.title} onClick={(event) => handleClick(data, event)}>
              <TableCell>
                <img src={data.logo} alt="" className={classes.img} />
                <Typography sx={{ display: 'inline' }}> {data.title} </Typography>
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
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

export default BasicTable;

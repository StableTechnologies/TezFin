import React, { useEffect, useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';

import BasicSwitch from '../Switch';
import { useStyles } from './style';
import SupplyModal from '../SupplyModal';
import BorrowModal from '../BorrowModal';
import ConfirmModal from '../ConfirmModal';


const Market = (props) => {
  const classes = useStyles();
  const {heading1, heading2, heading3, heading4, toggle, tableData, supplyMkt, borrowMkt} =props;

  const [valueofRow, setValueOfRow] = useState();
  const [openMktModal, setMktModal] = useState(false);
  const [openConfirmModal, setConfirmModal] =useState(false);
  const [enableToken, setEnableToken] =useState(false);


  const closeMktModal = () => {
    setMktModal(false);
  };

  const handleClickMktModal = (item, event) => {
    setValueOfRow(item);
    if (event.target.type === "checkbox") return;
    setMktModal(true);
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
            <TableCell>{heading3}</TableCell>
            <TableCell>{heading4}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map(data =>(
            <TableRow key={data.title} onClick={(event) => handleClickMktModal(data, event)}>
              <TableCell>
                <img src={data.logo} alt={data.title+ "-Icon"} className={classes.img} />
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

export default Market;
import React, { useState } from 'react';

// import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
// import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
// import { useSwitch } from '@mui/core/SwitchUnstyled';
// import SwitchUnstyled, { switchUnstyledClasses } from '@mui/core/SwitchUnstyled';

import BasicSwitch from '../Switch';
import { useStyles } from './style';
import Modal from '../Modal';


const BasicTable = (props) => {
  const classes = useStyles();

  const {heading1, heading2, heading3, heading4, toggle, tableData, openModal, val} =props;
  const [valueofRow, setValueOfRow] = useState();


// console.log(valueofRow, 'valueofRow');
  const [open, setOpen] = useState(false);

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

  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
      {valueofRow &&
        <Modal open={open} close={handleClose} valueofRow={valueofRow}/>
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

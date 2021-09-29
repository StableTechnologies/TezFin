import React from 'react';

import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Typography } from '@mui/material';
import { useSwitch } from '@mui/core/SwitchUnstyled';
import SwitchUnstyled, { switchUnstyledClasses } from '@mui/core/SwitchUnstyled';

import BasicSwitch from '../Switch';
import {tokens} from '../Constants';
import { useStyles } from './style';


const BasicTable = (props) => {
  const classes = useStyles();

  const {heading1, heading2, heading3, heading4, toggle} =props;

  return (
    <TableContainer className={`${classes.root} ${classes.tableCon}`}>
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
          {tokens.map(token =>(
            <TableRow key={token.title}>
              <TableCell>
                <img src={token.logo} alt="" className={classes.img} />
                <Typography sx={{ display: 'inline' }}> {token.title} </Typography>
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
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

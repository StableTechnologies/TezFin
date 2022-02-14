import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

import { useStyles } from './style';

const TableSkeleton = (props) => {
  const classes = useStyles();
  const { cell, key } = props;
  const cellArr = [];

  for(let n = 1; n < cell; n++) {
    cellArr.push(n);
  }

  return (
    <TableRow key={key} className={classes.root}>
      <TableCell>
        <Box className={classes.cellConOne}>
          <Skeleton variant="circular" className={classes.cellOneImg} />
          <Skeleton variant="text" className={classes.cellText} />
        </Box>
      </TableCell>
      {cellArr.map(() => (
        <TableCell>
          <Box className={classes.cellConTwo}>
            <Skeleton variant="text" width="70%" />
          </Box>
        </TableCell>
      ))}
    </TableRow>
  )
}

export default TableSkeleton
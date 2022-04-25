/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React from 'react';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

// eslint-disable-next-line import/extensions
import { useStyles } from './style';

const TableSkeleton = (props) => {
    const classes = useStyles();
    const { cell, index } = props;
    const cellArr = [];

    // eslint-disable-next-line no-plusplus
    for (let n = 1; n < cell; n++) {
        cellArr.push(n);
    }

    return (
        <TableRow key={index} className={classes.root}>
            <TableCell>
                <Box className={classes.cellConOne}>
                    <Skeleton variant="circular" className={classes.cellOneImg} />
                    <Skeleton variant="text" className={classes.cellText} />
                </Box>
            </TableCell>
            {cellArr.map((x) => (
                <TableCell key={x}>
                    <Box className={classes.cellConTwo}>
                        <Skeleton variant="text" width="70%" />
                    </Box>
                </TableCell>
            ))}
        </TableRow>
    );
};

export default TableSkeleton;

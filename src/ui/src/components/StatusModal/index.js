import React, { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import CloseButton from '../CloseButton';

import useStyles from './style';

const StatusModal = (props) => {
    const classes = useStyles();
    const { open, close, gifSrc, title, tokenText, closBtn, confirmError } = props;

    return (
      <Dialog open={open} className={classes.root}>
       {closBtn && <CloseButton onClick={close}/>}
        <DialogTitle className={classes.title}>
          {title}
        </DialogTitle>
        <DialogContent className={classes.gifCon}>
          <img src={gifSrc} alt={gifSrc} className={classes.gif}/>
        </DialogContent>
        <DialogContent>
          <DialogContentText className={classes.statusText}>
            {tokenText}
          </DialogContentText>
            {confirmError}
        </DialogContent>
      </Dialog>
    );
};

export default StatusModal;

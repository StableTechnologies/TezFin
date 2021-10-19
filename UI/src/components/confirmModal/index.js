import React from 'react';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import CloseButton from '../CloseBtn';

import confirm from '../../assets/confirm.gif';

import useStyles from './style';

const ConfirmModal = (props) => {
  const {open, close, enableTokenText, supplyTokenText} = props;

  const classes = useStyles();

  return (
    <Dialog open={open} className={classes.root}>
     <CloseButton onClick={close}/>
      <DialogTitle className={classes.title}>
        Confirm Transaction
      </DialogTitle>
      <DialogContent className={classes.gifCon}>
        <img src={confirm} alt="confirm-gif" className={classes.gif}/>
      </DialogContent>
      <DialogContent>
        <DialogContentText>
          {enableTokenText && "To enable XTZ token, please confirm the transaction."}
          {supplyTokenText && "To supply XTZ token, please confirm the transaction."}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmModal;

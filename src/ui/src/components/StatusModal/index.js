import React, { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import CloseButton from '../CloseButton';

import confirmGif from '../../assets/confirm.gif';
import successGif from '../../assets/success.gif';
import errorGif from '../../assets/error.gif';

import useStyles from './style';

const ConfirmModal = (props) => {
    const classes = useStyles();
    const { open, close, token, tokenText, error } = props;

    const [gif, setGif] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
      if(tokenText === 'success') {
        setGif(successGif);
        setTitle('Congrats!');
      }
      if(tokenText === 'error') {
        setGif(errorGif)
        setTitle('oops!');
      }
      return () => {
        setGif('')
        setTitle('');
      }
    }, [tokenText]);



    return (
      <Dialog open={open} className={classes.root}>
         <CloseButton onClick={close}/>
        <DialogTitle className={classes.title}>
          {title || 'Confirm Transaction'}
        </DialogTitle>
        <DialogContent className={classes.gifCon}>
          <img src={gif || confirmGif} alt="confirm-gif" className={classes.gif}/>
        </DialogContent>
        <DialogContent>
          <DialogContentText>
            {(tokenText === 'enable') && `To enable  ${token} token, please confirm the transaction.`}
            {(tokenText === 'withdraw') && `To withdraw ${token}, please confirm the transaction.`}
            {(tokenText === 'supply') && `To supply ${token} token, please confirm the transaction.`}
            {(tokenText === 'borrow') && `To borrow ${token}, please confirm the transaction.`}
            {(tokenText === 'repay') && `To repay ${token}, please confirm the transaction.`}
            {(tokenText === 'collateral') && `To enable ${token} as collateral, please confirm the transaction.`}
            {(tokenText === 'disable') && `To disable ${token} as collateral, please confirm the transaction.`}
            {(tokenText === 'verifying') && `verifying transaction, please hold.`}
            {(tokenText === 'success') && `Transaction completed succesfully.`}
            {(tokenText === 'error') && `${error.description}`}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    );
};

export default ConfirmModal;

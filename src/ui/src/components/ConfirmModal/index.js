import React from 'react';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import CloseButton from '../CloseButton';

import confirm from '../../assets/confirm.gif';

import useStyles from './style';

const ConfirmModal = (props) => {
    const {
        open, close, enableTokenText, supplyTokenText, token, tokenText
    } = props;

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
                    {(tokenText === 'enable') && `To enable  ${token} token, please confirm the transaction.`}
                    {(tokenText === 'withdraw') && `To withdraw ${token}, please confirm the transaction.`}
                    {(tokenText === 'supply') && `To supply ${token} token, please confirm the transaction.`}
                    {(tokenText === 'borrow') && `To borrow ${token}, please confirm the transaction.`}
                    {(tokenText === 'repay') && `To repay ${token}, please confirm the transaction.`}
                    {(tokenText === 'collateral') && `To enable ${token} as collateral, please confirm the transaction.`}
                    {(tokenText === 'disable') && `To disable ${token} as collateral, please confirm the transaction.`}
                    {/* {(tokenText === "collateral") && `To enable ꜰ${token} as collateral, please confirm the transaction.`}
          {(tokenText === "disable") && `To disable ꜰ${token} as collateral, please confirm the transaction.`} */}
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;

import React, { useEffect, useState } from 'react';

import StatusModal from './index';

import CloseButton from '../CloseButton';

import confirmGif from '../../assets/confirm.gif';
import successGif from '../../assets/success.gif';
import errorGif from '../../assets/error.gif';

import useStyles from './style';

const ConfirmModal = (props) => {
    const classes = useStyles();
    const { open, close, token, tokenText, approved } = props;

    return (
      <StatusModal
        {...props}
        title='Confirm Transaction'
        gifSrc={confirmGif}
        tokenText={ approved ? `verifying transaction, please hold.` :
          <>
            {(tokenText === 'withdraw') && `To withdraw ${token}, please confirm the transaction.`}
            {(tokenText === 'supply') && `To supply ${token} token, please confirm the transaction.`}
            {(tokenText === 'borrow') && `To borrow ${token}, please confirm the transaction.`}
            {(tokenText === 'repay') && `To repay ${token}, please confirm the transaction.`}
            {(tokenText === 'collateral') && `To enable ꜰ${token} as collateral, please confirm the transaction.`}
            {(tokenText === 'disable') && `To disable ꜰ${token} as collateral, please confirm the transaction.`}
          </>
        }
      />
    );
};

export default ConfirmModal;

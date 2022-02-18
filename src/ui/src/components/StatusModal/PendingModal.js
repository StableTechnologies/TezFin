import React, { useEffect, useState } from 'react';

import StatusModal from './index';

import IconButton from '@mui/material/IconButton';

import confirmGif from '../../assets/confirm.gif';
import CopyIcon from '../../assets/copyIcon.svg';

import useStyles from './style';
import { shorten } from '../../util';

const PendingModal = (props) => {
    const classes = useStyles();
    const { open, close, token, tokenText, response } = props;

    return (
      <StatusModal
        {...props}
        closBtn={response && true}
        title={ response ? 'Transaction In-Progress' : 'Confirm Transaction'}
        gifSrc={confirmGif}
        tokenText={ response ?
          <>
            Operation hash: {shorten(6, 6, response.transactionHash)}
              <IconButton aria-label="copy"
                onClick={() => navigator.clipboard.writeText(response.transactionHash)}
                className={classes.copyBtn}
                disableRipple
              >
                <img src={CopyIcon} alt="copy-icon" />
              </IconButton>
          </> :
          <>
            {(tokenText === 'withdraw') && `To withdraw ${token}, please confirm the transaction in your wallet.`}
            {(tokenText === 'supply') && `To supply ${token} token, please confirm the transaction in your wallet.`}
            {(tokenText === 'borrow') && `To borrow ${token}, please confirm the transaction in your wallet.`}
            {(tokenText === 'repay') && `To repay ${token}, please confirm the transaction in your wallet.`}
            {(tokenText === 'collateral') && `To enable ꜰ${token} as collateral, please confirm the transaction in your wallet.`}
            {(tokenText === 'disable') && `To disable ꜰ${token} as collateral, please confirm the transaction in your wallet.`}
          </>
        }
      />
    );
};

export default PendingModal;

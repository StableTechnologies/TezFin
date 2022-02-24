import React, { useEffect, useState } from 'react';

import Button from '@mui/material/Button';

import StatusModal from './index';

import errorGif from '../../assets/error.gif';

import useStyles from './style';

const ErrorModal = (props) => {
    const classes = useStyles();
    const { open, close, token, tokenText, error, confirmError } = props;

    return (
      <StatusModal
        {...props}
        closBtn={true}
        title={error && (error.title || 'Transaction Failed')}
        gifSrc={errorGif}
        tokenText={
          <>
            {(error) && (error.description || `could not ${tokenText} ${token} token`)}
            {(confirmError) && 'Could not confirm transaction completion on chain.'}
          </>
        }
        confirmError={
          confirmError &&
          <Button
            variant="outlined"
            onClick={()=> location.reload(true)}
            className={classes.refreshBtn}
          >
            Refresh
          </Button>
        }
      />
    );
};

export default ErrorModal;

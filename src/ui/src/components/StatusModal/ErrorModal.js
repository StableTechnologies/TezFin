import React, { useEffect, useState } from 'react';

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
        title='Oops!'
        gifSrc={errorGif}
        tokenText={
          <>
            {(error) && (error.description || `could not ${tokenText} ${token} token`)}
            {(confirmError) && 'Could not confirm transaction completion on chain, please refresh dashboard.'}
          </>
        }
        confirmError={ '1234567898765432' }
      />
    );
};

export default ErrorModal;

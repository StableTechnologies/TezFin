/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
import React from 'react';

import Button from '@mui/material/Button';

import StatusModal from './index';

import errorGif from '../../assets/error.gif';

import useStyles from './style';

const ErrorModal = (props) => {
    const classes = useStyles();
    const {
        token, tokenText, error, errType
    } = props;

    return (
        <StatusModal
            {...props}
            closBtn={true}
            title={
                <>
                    {(errType === 'error' && error) && (error.title || 'Transaction Failed')}
                    {errType === 'evaluationError' && ('Construction Failed')}
                </>
            }
            gifSrc={errorGif}
            tokenText={
                <>
                    {(errType === 'error' && error) && (error.description || `could not ${tokenText} ${token} token`)}
                    {(errType === 'confirmError') && 'Could not confirm transaction completion on chain.'}
                    {(errType === 'evaluationError') && 'Could not construct operation.'}
                </>
            }
            button={
                errType
              && <Button
                  variant="outlined"
                  // eslint-disable-next-line no-restricted-globals
                  onClick={(errType === 'confirmError') ? () => location.reload(true) : props.close}
                  className={classes.modalBtn}
              >
                  {(errType === 'confirmError') && 'Refresh'}
                  {((errType === 'error') || (errType === 'evaluationError')) && 'Okay'}
              </Button>
            }
        />
    );
};

export default ErrorModal;

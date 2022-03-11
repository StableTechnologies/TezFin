// eslint-disable-next-line no-use-before-define
import React from 'react';

import Button from '@mui/material/Button';

import StatusModal from './index';

import successGif from '../../assets/success.gif';

import useStyles from './style';

const SuccessModal = (props) => {
    const classes = useStyles();
    const {
        open, close, token, tokenText, amount
    } = props;

    return (
        <StatusModal
            open={open}
            close={close}
            closBtn={true}
            title='Congrats!'
            gifSrc={successGif}
            tokenText={<>
                {(tokenText === 'withdraw') && `You have successfully withdrawn ${token}.`}
                {(tokenText === 'supply') && `You have successfully supplied ${token} token.`}
                {(tokenText === 'borrow') && `You have successfully borrowed ${token}.`}
                {(tokenText === 'repay') && `You have successfully repaid ${token}.`}
                {(tokenText === 'collateral') && `You have successfully enabled ꜰ${token} as collateral.`}
                {(tokenText === 'disable') && `You have successfully disabled ꜰ${token} as collateral.`}
            </>}
            button={
                <Button
                    variant="outlined"
                    onClick={close}
                    className={classes.modalBtn}
                >
                    Okay
                </Button>
            }
        />
    );
};

export default SuccessModal;

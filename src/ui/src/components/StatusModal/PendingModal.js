// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import IconButton from '@mui/material/IconButton';

import StatusModal from './index';

import confirmGif from '../../assets/confirm.gif';
import CopyIcon from '../../assets/copyIcon.svg';

import useStyles from './style';
import { shorten } from '../../util';

const PendingModal = (props) => {
    const classes = useStyles();
    const { token, tokenText, response } = props;

    const { network } = useSelector((state) => state.nodes.tezosNode.conseilServerInfo);

    const [transactionHash, setTransactionHash] = useState('one');

    useEffect(() => {
        // eslint-disable-next-line no-unused-expressions
        response && setTransactionHash(response.response.transactionHash);
    }, [response]);

    return (
        <StatusModal
            {...props}
            closBtn={response && true}
            title={response ? 'Transaction In-Progress' : 'Confirm Transaction'}
            gifSrc={confirmGif}
            tokenText={response
                ? <>
                    Operation hash: {' '}
                    <a
                        href={`https://arronax.io/tezos/${network}/operations/${transactionHash}`}
                        target="_blank"
                        rel="noopener"
                        className={classes.hashLink}
                    >
                        {shorten(6, 6, transactionHash)}
                    </a>
                    <IconButton aria-label="copy"
                        // eslint-disable-next-line no-undef
                        onClick={() => navigator.clipboard.writeText(transactionHash)}
                        className={classes.copyBtn}
                        disableRipple
                    >
                        <img src={CopyIcon} alt="copy-icon" />
                    </IconButton>
                </>
                : <>
                    {(tokenText === 'withdraw') && `To withdraw ${token}, please confirm the transaction in your wallet.`}
                    {(tokenText === 'supply') && `To supply ${token} token, please confirm the transaction in your wallet.`}
                    {(tokenText === 'borrow') && `To borrow ${token}, please confirm the transaction in your wallet.`}
                    {(tokenText === 'repay') && `To repay ${token} loan, please confirm the transaction in your wallet.`}
                    {(tokenText === 'collateral') && `To enable ꜰ${token} as collateral, please confirm the transaction in your wallet.`}
                    {(tokenText === 'disable') && `To disable ꜰ${token} as collateral, please confirm the transaction in your wallet.`}
                </>
            }
        />
    );
};

export default PendingModal;

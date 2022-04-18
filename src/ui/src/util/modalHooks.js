/* eslint-disable import/prefer-default-export */
import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

export const useSupplyErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Supply');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Funds');
            setErrorText('');
            setDisabled(true);
        }
        return () => {
            setText('Supply');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

export const useBorrowErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Borrow');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Collateral');
            setErrorText('You must supply assets as collateral to increase your borrow limit.');
            setDisabled(true);
        }
        return () => {
            setText('Borrow');
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

export const useWithdrawErrorText = (tokenValue, limit) => {
    const text = 'Withdraw';
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setDisabled(true);
            setErrorText('You must repay your borrowed amounts before you can withdraw.');
        }
        return () => {
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

export const useRepayErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Repay');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Funds');
            setErrorText('');
            setDisabled(true);
        }
        return () => {
            setText('Repay');
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

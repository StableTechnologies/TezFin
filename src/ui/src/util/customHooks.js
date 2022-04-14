/* eslint-disable import/prefer-default-export */
import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

export const useSupplyErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Supply');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Funds');
            setDisabled(true);
        }
        return () => {
            setText('Supply');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, disabled };
};

export const useBorrowErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Borrow');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Collateral');
            setDisabled(true);
        }
        return () => {
            setText('Borrow');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, disabled };
};

export const useRepayErrorText = (tokenValue, limit) => {
    const [text, setText] = useState('Repay');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Funds');
            setDisabled(true);
        }
        return () => {
            setText('Repay');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, disabled };
};

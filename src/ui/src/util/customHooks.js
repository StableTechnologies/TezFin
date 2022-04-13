/* eslint-disable import/prefer-default-export */
import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

export const useSupplyErrorText = (tokenValue, limit) => {
    const [buttonText, setButtonText] = useState('Supply');

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setButtonText('Insufficient Funds');
        }
        return () => {
            setButtonText('Supply');
        };
    }, [tokenValue, limit]);

    return buttonText;
};

export const useBorrowErrorText = (tokenValue, limit) => {
    const [buttonText, setButtonText] = useState('Borrow');

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setButtonText('Insufficient Collateral');
        }
        return () => {
            setButtonText('Borrow');
        };
    }, [tokenValue, limit]);

    return buttonText;
};

export const useRepayErrorText = (tokenValue, limit) => {
    const [buttonText, setButtonText] = useState('Repay');

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setButtonText('Insufficient Funds');
        }
        return () => {
            setButtonText('Repay');
        };
    }, [tokenValue, limit]);

    return buttonText;
};

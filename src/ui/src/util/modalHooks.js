/* eslint-disable import/prefer-default-export */
import BigNumber from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { decimalify } from './index';

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

export const useWithdrawErrorText = (tokenValue, limit, tokenDetails) => {
    const text = 'Withdraw';
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    const { supplying, collateralized } = useSelector((state) => state.supplyComposition.supplyComposition);
    const { borrowing } = useSelector((state) => state.borrowComposition.borrowComposition);

    const tokenValueUsd = new BigNumber(tokenValue).multipliedBy(new BigNumber(tokenDetails.usdPrice)).toNumber();
    const pendingSupplyingUsd = new BigNumber(supplying).minus(new BigNumber(tokenValueUsd)).toNumber();
    let pendingCollateralizedUsd = collateralized;
    if (tokenDetails.collateral) {
        pendingCollateralizedUsd = new BigNumber(collateralized).minus(new BigNumber(tokenValueUsd)).toNumber();
    }

    const pendingSupplyingUsdLimit = new BigNumber(pendingSupplyingUsd).multipliedBy(
        new BigNumber(tokenDetails.collateralFactor)
    ).toNumber();
    const pendingCollateralizedUsdLimit = new BigNumber(pendingCollateralizedUsd).multipliedBy(
        new BigNumber(tokenDetails.collateralFactor)
    ).toNumber();

    useEffect(() => {
        if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setDisabled(true);
            setErrorText('You cannot withdraw an amount greater than the amount you supply.');
        } else if ((borrowing > pendingSupplyingUsdLimit) || (tokenDetails.collateral && borrowing > pendingCollateralizedUsdLimit)) {
            setDisabled(true);
            setErrorText('You must repay your borrowed amounts before you can withdraw your funds.');
        } else {
            setErrorText('');
            setDisabled(false);
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
            setErrorText('You can only repay an amount equal to your borrow amount + interest. Any amount over this threshold will not be taken.');
        }
        return () => {
            setText('Repay');
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

export const useDisableTokenErrorText = (tokenDetails) => {
    const text = 'Disable Token';
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    const { collateralized } = useSelector((state) => state.supplyComposition.supplyComposition);
    const { borrowing } = useSelector((state) => state.borrowComposition.borrowComposition);
    const { borrowedMarkets } = useSelector((state) => state.market);

    const tokenValueUsd = (tokenDetails.balanceUnderlying > 0) && decimalify(new BigNumber(tokenDetails.balanceUnderlying).multipliedBy(
        new BigNumber(tokenDetails.usdPrice)
    ).toNumber(), decimals[tokenDetails.title], decimals[tokenDetails.title]);
    const pendingCollateralizedUsd = new BigNumber(collateralized).minus(new BigNumber(tokenValueUsd)).toNumber();
    const pendingCollateralizedUsdLimit = new BigNumber(pendingCollateralizedUsd).multipliedBy(
        new BigNumber(tokenDetails.collateralFactor)
    ).toNumber();

    let isBorrowed;
    useEffect(() => {
        borrowedMarkets.map((x) => {
            if (x.assetType === tokenDetails.assetType) {
                isBorrowed = true;
                setDisabled(true);
            }
            return isBorrowed;
        });
    }, [tokenDetails]);

    useEffect(() => {
        if (isBorrowed) {
            setErrorText('You cannot disable collateral on the same asset you borrowed. Please repay your balance first.');
            setDisabled(true);
        } else if (borrowing > pendingCollateralizedUsdLimit) {
            setErrorText('You cannot disable collateral if it causes your borrowed amount to go beyond the collateral ratio. Please repay some of your borrowed amount first.');
            setDisabled(true);
        } else {
            setErrorText('');
            setDisabled(false);
        }
        return () => {
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenDetails]);

    return { text, errorText, disabled };
};

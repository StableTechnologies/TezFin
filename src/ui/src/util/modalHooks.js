/* eslint-disable import/prefer-default-export */
import BigNumber from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { decimalify } from './index';

/**
 * This function is used to ensure a user enters a valid amount to supply.
 *
 * @param tokenValue amount to be supplied.
 * @param limit Max amount a user is able to supply in a transaction.
 */
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

/**
 * This function is used to ensure a user enters a valid amount to borrow.
 *
 * @param tokenValue amount to be borrowed.
 * @param limit Max amount a user is able to borrow in a transaction.
 * @param tokenDetails Underlying asset data.
 */
export const useBorrowErrorText = (tokenValue, limit, tokenDetails) => {
    const [text, setText] = useState('Borrow');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    const { allMarkets } = useSelector((state) => state.market);

    let marketSize;
    let totalBorrowed;
    // eslint-disable-next-line array-callback-return
    allMarkets.map((x) => {
        if (x.assetType === tokenDetails.assetType) {
            marketSize = decimalify(x.marketSize.toString(), decimals[x.title], decimals[x.title]);
            totalBorrowed = decimalify(x.totalBorrowed.toString(), decimals[x.title], decimals[x.title]);
        }
    });
    const availableBorrowAmount = new BigNumber(marketSize).minus(new BigNumber(totalBorrowed)).toNumber();

    useEffect(() => {
        if ((Number(tokenValue) > 0) && (Number(tokenValue) > availableBorrowAmount)) {
            setErrorText('You cannot borrow more than the amount available on the market.');
            setDisabled(true);
        } else if (new BigNumber(tokenValue).gt(new BigNumber(limit))) {
            setText('Insufficient Collateral');
            setErrorText('You must supply assets as collateral to increase your borrow limit.');
            setDisabled(true);
        } else {
            setText('Borrow');
            setErrorText('');
            setDisabled(false);
        }
        return () => {
            setText('Borrow');
            setErrorText('');
            setDisabled(false);
        };
    }, [tokenValue, limit]);

    return { text, errorText, disabled };
};

/**
 * This function is used to ensure a user enters a valid amount to redeem.
 *
 * @param tokenValue amount to be redeemed.
 * @param limit Max amount a user is able to redeem in a transaction.
 * @param tokenDetails Underlying asset data.
 */
export const useWithdrawErrorText = (tokenValue, limit, tokenDetails) => {
    const text = 'Withdraw';
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    const { supplying, collateralized } = useSelector((state) => state.supplyComposition.supplyComposition);
    const { borrowing } = useSelector((state) => state.borrowComposition.borrowComposition);

    const tokenValueUsd = decimalify((new BigNumber(tokenValue).multipliedBy(new BigNumber(tokenDetails.usdPrice)).toNumber()), decimals[tokenDetails.title], decimals[tokenDetails.title]);
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

/**
 * This function is used to ensure a user enters a valid amount to repay.
 *
 * @param tokenValue amount to be repaid.
 * @param limit Max amount a user is able to repay in a transaction.
 */
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

/**
 * This function is used to ensure a user is allowed to disable a token.
 *
 * @param tokenDetails Underlying asset data.
 */
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

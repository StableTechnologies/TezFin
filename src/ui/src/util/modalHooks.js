/* eslint-disable import/prefer-default-export */
import BigNumber from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { decimalify } from './index';

const toBigNumberInput = (value) => {
    if (value === '' || value === null || value === undefined) {
        return '0';
    }
    if (typeof value === 'object' && typeof value.toString === 'function') {
        return value.toString();
    }
    return value;
};

const bn = (value) => new BigNumber(toBigNumberInput(value));

/**
 * This function is used to ensure a user enters a valid amount to supply.
 *
 * @param tokenValue amount to be supplied.
 * @param limit Max amount a user is able to supply in a transaction.
 */
export const useSupplyErrorText = (tokenValue, limit, tokenDetails) => {
    const [text, setText] = useState('Supply');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (!tokenDetails.isListed || tokenDetails.mintPaused) {
            setErrorText('Supplying is temporarily disabled for this market.');
            setDisabled(true);
        }
        if (bn(tokenValue).gt(bn(limit))) {
            setText('Insufficient Funds');
            setErrorText('');
            setDisabled(true);
        } else {
            setText('Supply');
            setErrorText('');
            setDisabled(false);
        }
        return () => {
            setText('Supply');
            setDisabled(false);
        };
    }, [tokenValue, limit, tokenDetails.isListed, tokenDetails.mintPaused]);

    return { text, errorText, disabled };
};

/**
 * This function is used to ensure a user enters a valid amount to borrow.
 *
 * @param tokenValue amount to be borrowed.
 * @param limit Max amount a user is able to borrow in a transaction.
 * @param tokenDetails Underlying asset data.
 */
export const useBorrowErrorText = (tokenValue, borrowLimit, tokenDetails) => {
    const [text, setText] = useState('Borrow');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    const limit = Number(bn(borrowLimit)
        .dividedBy(bn(tokenDetails.usdPrice))
        .toFixed(decimals[tokenDetails.title]));

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
    const availableBorrowAmount = bn(marketSize).minus(bn(totalBorrowed)).toNumber();

    useEffect(() => {
        if (!tokenDetails.isListed || tokenDetails.borrowPaused) {
            setText('Borrow');
            setErrorText('Borrowing is temporarily disabled for this market.');
            setDisabled(true);
        } else if ((Number(tokenValue) > 0) && (Number(tokenValue) > availableBorrowAmount)) {
            setErrorText('You cannot borrow more than the amount available on the market.');
            setDisabled(true);
        } else if (bn(tokenValue).gt(bn(limit))) {
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
    }, [tokenValue, limit, availableBorrowAmount, tokenDetails.isListed, tokenDetails.borrowPaused]);

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

    const tokenValueUsd = tokenValue
        ? bn(tokenValue).multipliedBy(bn(tokenDetails.usdPrice)).toNumber()
        : 0;
    let pendingSupplyingUsd = bn(supplying).minus(bn(tokenValueUsd)).toNumber();
    pendingSupplyingUsd = pendingSupplyingUsd > 0 ? pendingSupplyingUsd : 0;

    let pendingCollateralizedUsd = collateralized;
    if (tokenDetails.collateral) {
        pendingCollateralizedUsd = bn(collateralized).minus(bn(tokenValueUsd)).toNumber();
    }

    const pendingSupplyingUsdLimit = bn(pendingSupplyingUsd).multipliedBy(
        bn(tokenDetails.collateralFactor)
    ).toNumber();
    const pendingCollateralizedUsdLimit = bn(pendingCollateralizedUsd).multipliedBy(
        bn(tokenDetails.collateralFactor)
    ).toNumber();

    useEffect(() => {
        if (!tokenDetails.isListed || tokenDetails.redeemPaused) {
            setDisabled(true);
            setErrorText('Withdrawals are temporarily disabled for this market.');
        } else if (bn(tokenValue).gt(bn(limit))) {
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
    }, [
        tokenValue,
        limit,
        borrowing,
        pendingSupplyingUsdLimit,
        pendingCollateralizedUsdLimit,
        tokenDetails.collateral,
        tokenDetails.isListed,
        tokenDetails.redeemPaused
    ]);

    return { text, errorText, disabled };
};

/**
 * This function is used to ensure a user enters a valid amount to repay.
 *
 * @param tokenValue amount to be repaid.
 * @param limit Max amount a user is able to repay in a transaction.
 */
export const useRepayErrorText = (tokenValue, limit, tokenDetails) => {
    const [text, setText] = useState('Repay');
    const [errorText, setErrorText] = useState('');
    const [disabled, setDisabled] = useState(false);

    useEffect(() => {
        if (bn(tokenValue).multipliedBy(bn(10).pow(bn(decimals[tokenDetails.title].toString()))).gt(bn(tokenDetails.walletBalance))) {
            setErrorText('Insufficient funds for repayment.');
            setDisabled(true);
        } else {
            setText('Repay');
            setErrorText('');
            setDisabled(false);
        }
    }, [tokenValue, limit, tokenDetails]);

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

    const tokenValueUsd = (tokenDetails.balanceUnderlying > 0)
        && bn(
            decimalify(tokenDetails.balanceUnderlying, decimals[tokenDetails.title], decimals[tokenDetails.title])
        ).multipliedBy(bn(tokenDetails.usdPrice)).toNumber();

    const pendingCollateralizedUsd = bn(collateralized).minus(bn(tokenValueUsd)).toNumber();
    const pendingCollateralizedUsdLimit = bn(pendingCollateralizedUsd).multipliedBy(
        bn(tokenDetails.collateralFactor)
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

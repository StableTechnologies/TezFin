/* eslint-disable no-unused-expressions */
import { decimals } from 'tezoslendingplatformjs';

import { decimalify } from './index';

export const supplyingMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5);
        } else {
            setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
    }
    if (tabValue === 'two') {
        setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title]));
    }
};

export const borrowingMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount) => {
    if (tabValue === 'one') {
        setMaxAmount(decimalify(borrowLimit.toString(), decimals[tokenDetails.title]) * 0.8);
    }
    // TODO: calculate the max value to repay properly.
    if (tabValue === 'two') {
        setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title]));
    }
};

export const marketsMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            tokenDetails.walletBalance > 5
                ? setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5)
                : setMaxAmount(0);
        } else {
            setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
    }
    if (tabValue === 'two') {
        // TODO: calculate the max value to borrow properly.
        setMaxAmount(decimalify(borrowLimit.toString(), decimals[tokenDetails.title]) * 0.8);
    }
};

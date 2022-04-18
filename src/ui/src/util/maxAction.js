/* eslint-disable no-unused-expressions */
import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { decimalify } from './index';

export const supplyingMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            decimalify(tokenDetails.walletBalance, decimals[tokenDetails.title]) > 5
                ? setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5)
                : setMaxAmount(0);
        } else {
            setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
    }
    if (tabValue === 'two') {
        setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title], decimals[tokenDetails.title]));
    }
};

export const borrowingMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount) => {
    if (tabValue === 'one') {
        const limit = new BigNumber(borrowLimit).dividedBy(new BigNumber(tokenDetails.usdPrice)).toNumber();
        limit >= 0
            ? setMaxAmount(limit)
            : setMaxAmount(0);
    }
    // TODO: calculate the max value to repay properly.
    if (tabValue === 'two') {
        setMaxAmount(decimalify(tokenDetails.balanceUnderlying.toString(), decimals[tokenDetails.title], decimals[tokenDetails.title]));
    }
};

export const marketsMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            decimalify(tokenDetails.walletBalance, decimals[tokenDetails.title]) > 5
                ? setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5)
                : setMaxAmount(0);
        } else {
            setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
    }
    if (tabValue === 'two') {
        const limit = new BigNumber(borrowLimit).dividedBy(new BigNumber(tokenDetails.usdPrice)).toNumber();
        limit >= 0
            ? setMaxAmount(limit)
            : setMaxAmount(0);
    }
};

/* eslint-disable no-unused-expressions */
import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { decimalify } from './index';

/**
 * This function is used to get the max amount a user is able to supply/withdraw in a transaction.
 *
 * @param tabValue Current tab value.
 * @param tokenDetails Token data.
 * @param borrowLimit Borrow limit of a user.
 * @param setMaxAmount Sets the max amount.
 */
export const supplyingMaxAction = (tabValue, tokenDetails, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            decimalify(tokenDetails.walletBalance, decimals[tokenDetails.title]) > 0.1
                ? setMaxAmount(
                      decimalify(
                          tokenDetails.walletBalance.toString(),
                          decimals[tokenDetails.title],
                          decimals[tokenDetails.title],
                      ) - 0.1,
                  )
                : setMaxAmount(0);
        } else {
            setMaxAmount(
                decimalify(
                    tokenDetails.walletBalance.toString(),
                    decimals[tokenDetails.title],
                    decimals[tokenDetails.title],
                ),
            );
        }
    }
    if (tabValue === 'two') {
        setMaxAmount(
            decimalify(
                tokenDetails.balanceUnderlying.toString(),
                decimals[tokenDetails.title],
                decimals[tokenDetails.title],
            ),
        );
    }
};

/**
 * This function is used to get the max amount a user is able to borrow/rrepay in a transaction.
 *
 * @param tabValue Current tab value.
 * @param tokenDetails Token data.
 * @param borrowLimit Borrow limit of a user.
 * @param setMaxAmount Sets the max amount.
 */
export const borrowingMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount, blockDelta = 0) => {
    if (tabValue === 'one') {
        const limit = Number(new BigNumber(borrowLimit).dividedBy(new BigNumber(tokenDetails.usdPrice)).dividedBy(new BigNumber(2)).toFixed(decimals[tokenDetails.title]));
        limit >= 0 ? setMaxAmount(limit) : setMaxAmount(0);
    }
    // TODO: calculate the max value to repay properly.
    if (tabValue === 'two') {
        setMaxAmount(
            decimalify(
                tokenDetails.getOutstandingLoanAtBlockDelta(blockDelta).toString(),
                decimals[tokenDetails.title],
                decimals[tokenDetails.title],
            ),
        );
    }
};

/**
 * This function is used to get the max amount a user is able to supply/borrow in a transaction.
 *
 * @param tabValue Current tab value.
 * @param tokenDetails Token data.
 * @param borrowLimit Borrow limit of a user.
 * @param setMaxAmount Sets the max amount.
 */
export const marketsMaxAction = (tabValue, tokenDetails, borrowLimit, setMaxAmount) => {
    if (tabValue === 'one') {
        if (tokenDetails.title.toLowerCase() === 'xtz'.toLowerCase()) {
            decimalify(tokenDetails.walletBalance, decimals[tokenDetails.title]) > 0.1
                ? setMaxAmount(
                      decimalify(
                          tokenDetails.walletBalance.toString(),
                          decimals[tokenDetails.title],
                          decimals[tokenDetails.title],
                      ) - 0.1,
                  )
                : setMaxAmount(0);
        } else {
            setMaxAmount(
                decimalify(
                    tokenDetails.walletBalance.toString(),
                    decimals[tokenDetails.title],
                    decimals[tokenDetails.title],
                ),
            );
        }
    }
    if (tabValue === 'two') {
        const limit = Number(new BigNumber(borrowLimit).dividedBy(new BigNumber(tokenDetails.usdPrice)).dividedBy(new BigNumber(2)).toFixed(decimals[tokenDetails.title]));
        limit >= 0 ? setMaxAmount(limit) : setMaxAmount(0);
    }
};

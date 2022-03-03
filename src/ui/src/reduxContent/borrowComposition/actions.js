import { decimals } from 'tezoslendingplatformjs';
import { BigNumber } from 'bignumber.js';
import bigInt from 'big-integer';
import { decimalify } from '../../util';

import { GET_BORROW_COMPOSITION_DATA } from './types';

/**
 * This function is used to get the borrowComposition data of an account
 *
 * @param   account
 * @returns borrowComposition
 */
// eslint-disable-next-line import/prefer-default-export
export const borrowCompositionAction = (account, borrowedMarkets) => async (dispatch) => {
    let borrowComposition = {};
    const assets = [];
    let borrowLimit;

    if (Object.keys(borrowedMarkets).length > 0) {
        borrowedMarkets.map((x) => {
            assets.push({
                title: x.title,
                usdPrice: x.usdPrice,
                balanceUnderlying: x.balanceUnderlying,
                total: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title])
            });
            return borrowedMarkets;
        });

        const totalUsdValue = assets.reduce((a, b) => a + b.total, 0);
        const scale = new BigNumber('1000000000000000000000000');
        if (account.health) {
            borrowLimit = new BigNumber(account.totalCollateralUsd.multiply(bigInt(account.health)).toString()).dividedBy(scale);
        }

        const rate = ((totalUsdValue / borrowLimit) * 100);
        const limitBalance = borrowLimit - totalUsdValue;

        borrowComposition = {
            assets,
            totalUsdValue,
            borrowLimit,
            rate,
            limitBalance
        };
    }

    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { decimalify } from '../../util';

import { GET_BORROW_COMPOSITION_DATA } from './types';

/**
 * This function is used to get the borrowComposition data of an account
 *
 * @param   account
 * @returns borrowComposition
 */
// eslint-disable-next-line import/prefer-default-export
export const borrowCompositionAction = (borrowedMarkets) => async (dispatch, getState) => {
    const state = getState();

    const { totalCollateral } = state.supplyComposition.supplyComposition;

    let borrowComposition = {};
    const assets = [];
    let borrowing = 0;
    let borrowUtilization = 0;
    let borrowLimit = 0;

    if (Object.keys(borrowedMarkets).length > 0) {
        borrowedMarkets.map((x) => {
            assets.push({
                title: x.title,
                usdPrice: x.usdPrice,
                balanceUnderlying: x.balanceUnderlying,
                collateralFactor: new BigNumber(x.collateralFactor).toNumber(),
                total: new BigNumber(decimalify(x.balanceUnderlying, decimals[x.title], decimals[x.title])).multipliedBy(new BigNumber(x.usdPrice)).toNumber()
            });
            return borrowedMarkets;
        });
        borrowing = assets.reduce((a, b) => a + b.total, 0);
    }
    if (totalCollateral > 0) {
        borrowUtilization = new BigNumber(borrowing).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100);
        borrowLimit = totalCollateral - borrowing;
    }

    const limitBalance = borrowLimit - borrowing;
    borrowComposition = {
        assets,
        borrowing,
        borrowLimit,
        borrowUtilization,
        limitBalance
    };

    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

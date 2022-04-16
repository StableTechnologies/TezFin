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
export const borrowCompositionAction = (account, borrowedMarkets) => async (dispatch, getState) => {
    const state = getState();

    const { totalCollateral } = state.supplyComposition.supplyComposition;

    let borrowComposition = {};
    const assets = [];

    if (Object.keys(borrowedMarkets).length > 0) {
        borrowedMarkets.map((x) => {
            assets.push({
                title: x.title,
                usdPrice: x.usdPrice,
                balanceUnderlying: x.balanceUnderlying,
                collateralFactor: new BigNumber(x.collateralFactor).toNumber(),
                total: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title])
            });
            return borrowedMarkets;
        });

        const borrowing = assets.reduce((a, b) => a + b.total, 0);
        const borrowLimit = totalCollateral - borrowing;
        const limitBalance = borrowLimit - borrowing;
        const borrowUtilization = new BigNumber(borrowing).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100);

        borrowComposition = {
            assets,
            borrowing,
            borrowLimit,
            borrowUtilization,
            limitBalance
        };
    }

    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

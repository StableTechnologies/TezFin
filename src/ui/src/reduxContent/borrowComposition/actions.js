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

    const { collateral } = state.supplyComposition.supplyComposition;
    const totalCollateral = collateral * 0.8;

    let borrowComposition = {};
    const assets = [];

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

        const borrowing = assets.reduce((a, b) => a + b.total, 0);
        const borrowLimit = totalCollateral - borrowing;
        const rate = (borrowing / borrowLimit) * 100;
        const limitBalance = borrowLimit - borrowing;

        borrowComposition = {
            assets,
            borrowing,
            borrowLimit,
            rate,
            limitBalance
        };
    }

    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

/* eslint-disable no-unused-expressions */
import { decimals } from 'tezoslendingplatformjs';
import { decimalify } from '../../util';

import { GET_SUPPLY_COMPOSITION_DATA } from './types';
import { tokenColor } from '../../components/Constants';

/**
 * This function is used to get the supplyComposition data of an account.
 *
 * @param  suppliedMarkets
 * @returns supplyComposition
 */
// eslint-disable-next-line import/prefer-default-export
export const supplyCompositionAction = (suppliedMarkets) => async (dispatch) => {
    let supplyComposition = {};
    const assets = [];

    if (Object.keys(suppliedMarkets).length > 0) {
        suppliedMarkets.map((x) => {
            assets.push({
                title: x.title,
                usdPrice: x.usdPrice,
                balanceUnderlying: x.balanceUnderlying,
                total: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title]),
                color: tokenColor[x.title],
                collateral: x.collateral,
                collateralUsd: 0
            });
            return suppliedMarkets;
        });

        const supplying = assets.reduce((a, b) => a + b.total, 0);
        assets.map((x) => {
            x.rate = ((x.total / supplying) * 100);
            x.collateral && (x.collateralUsd = x.total);
        });

        const totalCollateralUsd = assets.reduce((a, b) => a + b.collateralUsd, 0);

        supplyComposition = {
            assets,
            supplying,
            collateral: totalCollateralUsd
        };
    }

    dispatch({ type: GET_SUPPLY_COMPOSITION_DATA, payload: supplyComposition });
};

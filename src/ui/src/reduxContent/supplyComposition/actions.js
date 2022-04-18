/* eslint-disable no-unused-expressions */
import { BigNumber } from 'bignumber.js';
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
    let supplying = 0;
    let collateralized = 0;
    let totalCollateral = 0;

    if (Object.keys(suppliedMarkets).length > 0) {
        suppliedMarkets.map((x) => {
            assets.push({
                title: x.title,
                usdPrice: x.usdPrice,
                balanceUnderlying: x.balanceUnderlying,
                balanceUnderlyingUsd: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title]),
                color: tokenColor[x.title],
                collateral: x.collateral,
                collateralFactor: new BigNumber(x.collateralFactor).toNumber(),
                totalCollateralUnderlying: 0,
                collateralUsd: 0
            });
            return suppliedMarkets;
        });

        supplying = assets.reduce((a, b) => a + b.balanceUnderlyingUsd, 0);
        assets.map((x) => {
            x.rate = ((x.balanceUnderlyingUsd / supplying) * 100);
            if (x.collateral) {
                x.collateralUsd = x.balanceUnderlyingUsd;
                x.totalCollateralUnderlying = new BigNumber(x.collateralUsd).multipliedBy(new BigNumber(x.collateralFactor)).toNumber();
            }
        });

        collateralized = assets.reduce((a, b) => a + b.collateralUsd, 0);
        totalCollateral = assets.reduce((a, b) => a + b.totalCollateralUnderlying, 0);
    }
    supplyComposition = {
        assets,
        supplying,
        collateralized,
        totalCollateral
    };

    dispatch({ type: GET_SUPPLY_COMPOSITION_DATA, payload: supplyComposition });
};

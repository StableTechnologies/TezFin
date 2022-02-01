import { TezosLendingPlatform, decimals } from 'tezoslendingplatformjs';
import { BigNumber } from "bignumber.js";
import { decimalify, nFormatter } from '../../util';

import { GET_SUPPLY_COMPOSITION_DATA } from './types.js';
import { tokenColor } from '../../components/Constants';


/**
 * This function is used to get the supplyComposition data of an account
 *
 * @param  account
 * @returns supplyComposition
 */
export const supplyCompositionAction = (account, suppliedMarkets) => async (dispatch) => {
    let supplyComposition = {} ;
    let assets = [];

    if(Object.keys(suppliedMarkets).length > 0) {
      suppliedMarkets.map(x => {
        assets.push({
          title: x.title,
          usdPrice: x.usdPrice,
          balanceUnderlying: x.balanceUnderlying,
          total: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title]),
          color: tokenColor[x.title],
        })
      });

      const totalUsdValue = assets.reduce((a,b) => a + b.total, 0);
      assets.map(x => {
        x.rate = ((x.total / totalUsdValue) * 100).toFixed(2);
      })

      supplyComposition = {
        assets: assets,
        totalUsdValue: totalUsdValue,
        collateral: account.totalCollateralUsd,
      }
    }

    dispatch({ type: GET_SUPPLY_COMPOSITION_DATA, payload: supplyComposition });
};

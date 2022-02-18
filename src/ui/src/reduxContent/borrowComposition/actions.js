import { TezosLendingPlatform, decimals } from 'tezoslendingplatformjs';
import { BigNumber } from "bignumber.js";
import bigInt from 'big-integer';
import { decimalify } from '../../util';
import { tokenColor } from '../../components/Constants';

import { GET_BORROW_COMPOSITION_DATA } from './types.js';

/**
 * This function is used to get the borrowComposition data of an account
 *
 * @param   account
 * @returns borrowComposition
 */
export const borrowCompositionAction = (account, borrowedMarkets) => async (dispatch) => {
    let borrowComposition = {} ;
    let assets = [];
    let borrowLimit;

    if(Object.keys(borrowedMarkets).length > 0) {
      borrowedMarkets.map(x => {
        assets.push({
          title: x.title,
          usdPrice: x.usdPrice,
          balanceUnderlying: x.balanceUnderlying,
          total: decimalify((x.balanceUnderlying * x.usdPrice), decimals[x.title]),
        })
      });

      const totalUsdValue = assets.reduce((a,b) => a + b.total, 0);
      const scale = new BigNumber('1000000000000000000000000');
      if(account.health) {
        borrowLimit = new BigNumber(account.totalCollateralUsd.multiply(bigInt(account.health)).toString()).dividedBy(scale).toFixed(2);
      }

      const rate = ((totalUsdValue / borrowLimit) * 100);
      const limitBalance = borrowLimit - totalUsdValue;

      borrowComposition = {
        assets: assets,
        totalUsdValue: totalUsdValue,
        borrowLimit: borrowLimit,
        rate: rate,
        limitBalance: limitBalance
      }
    }

    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

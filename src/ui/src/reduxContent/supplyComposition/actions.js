import {GET_SUPPLY_COMPOSITION_DATA} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';


/**
 * This function is used to get the supplyComposition data of an account
 *
 * @param  account
 * @returns supplyComposition
 */
export const supplyCompositionAction = (account)=> async (dispatch) => {
  const supplyComposition = TezosLendingPlatform.supplyComposition(account);
  dispatch({ type: GET_SUPPLY_COMPOSITION_DATA, payload: supplyComposition });
}


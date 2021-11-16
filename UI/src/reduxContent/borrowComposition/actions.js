import {GET_BORROW_COMPOSITION_DATA} from './types.js';

import {TezosLendingPlatform} from 'tezoslendingplatformjs';

/**
 * This function is used to get the borrowComposition data of an account
 *
 * @param {object} account
 * @returns borrowComposition
 */
export const borrowCompositionAction = (account)=> async (dispatch) => {
  const borrowComposition = await TezosLendingPlatform.borrowComposition(account);
  dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
}


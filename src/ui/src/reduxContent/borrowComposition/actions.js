import { TezosLendingPlatform } from 'tezoslendingplatformjs';
import { GET_BORROW_COMPOSITION_DATA } from './types.js';

/**
 * This function is used to get the borrowComposition data of an account
 *
 * @param   account
 * @returns borrowComposition
 */
export const borrowCompositionAction = (account) => async (dispatch) => {
    const borrowComposition = TezosLendingPlatform.borrowComposition(account);
    dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
};

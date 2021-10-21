import {GET_BORROW_COMPOSITION_DATA} from './types.js';

import {TezosLendingPlatform} from '../../util/TezosLendingPlatform';

export const borrowCompositionAction = (account)=> async (dispatch) => {
  const borrowComposition = await TezosLendingPlatform.borrowComposition(account);
  dispatch({ type: GET_BORROW_COMPOSITION_DATA, payload: borrowComposition });
}


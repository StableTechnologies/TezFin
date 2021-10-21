import {GET_SUPPLY_COMPOSITION_DATA} from './types.js';

import {TezosLendingPlatform} from '../../util/TezosLendingPlatform';

export const supplyCompositionAction = (account)=> async (dispatch) => {
  const supplyComposition = await TezosLendingPlatform.supplyComposition(account);
  dispatch({ type: GET_SUPPLY_COMPOSITION_DATA, payload: supplyComposition });
}


import {GET_SUPPLY_MARKET_DATA} from './types.js';

import {TezosLendingPlatform} from '../../util/TezosLendingPlatform';
import {tokens} from '../../components/Constants';

export const supplyMarketAction = () => {
  return {
    type: GET_SUPPLY_MARKET_DATA,
    payload: tokens
  }
}

import {enableMapSet, produce, produceWithPatches, enablePatches, applyPatches} from "immer"
import {marketTestData} from './markets'
import { AssetType, Comptroller, FToken, Governance, MarketMap, PriceFeed, ProtocolAddresses, testnetAddresses, TezosLendingPlatform, TokenStandard, UnderlyingAsset } from 'tezoslendingplatformjs';
enableMapSet();

enablePatches();

export interface State { markets: Map<string,any>, protocolAddresses: any};

export interface StateHistory { state: State , historyPointer: number , patches: any[], inversePatches: any[], next(): StateHistory | null, previous(): StateHistory | null}

export function state(markets: Map<string,any>, protocolAddresses: any) : State {
	return {
		markets,
		protocolAddresses
	}
}
function previous(sh: StateHistory): () => StateHistory {
  return () => {
    if (sh.historyPointer <= sh.inversePatches.length) {
      return {
        state: applyPatches(sh.state, sh.inversePatches[sh.historyPointer]),
        historyPointer: sh.historyPointer + 1,
        patches: sh.patches,
        inversePatches: sh.inversePatches,
        next: next(sh),
        previous: previous(sh),
      };
    } else return sh;
  };
}


function next(sh: StateHistory): () => StateHistory {
  return () => {
    if (sh.historyPointer > 0) {
      return {
        state: applyPatches(sh.state, sh.inversePatches[sh.historyPointer]),
        historyPointer: sh.historyPointer - 1,
        patches: sh.patches,
        inversePatches: sh.inversePatches,
        next: next(sh),
        previous: previous(sh),
      };
    } else return sh;
  };
}
function addMarket(currentState: StateHistory, markets: any): StateHistory {
  const [state, patches, inversePatches] = produceWithPatches(
    currentState.state,
    (draft) => {
      Object.keys(markets).forEach((ftoken) => {
        draft.markets.set(ftoken, markets[ftoken]);
      });
    }
  );
	currentState.state = state;
	currentState.patches.push(patches);
	currentState.inversePatches.push(inversePatches);
	return currentState;
}

const stateInner: State = {markets: new Map(), protocolAddresses: new Object()};
const state0 = {state: stateInner, historyPointer: 0, patches: [], inversePatches: [], next: () => null, previous: () => null};
const nav0 = { next: next(state0), previous: previous(state0) }
export const initialState: StateHistory = Object.assign(state0, nav0);

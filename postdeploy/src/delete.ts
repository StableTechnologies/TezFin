import {enableMapSet, produce, produceWithPatches, enablePatches, applyPatches} from "immer"
import {marketTestData} from './markets'
import { AssetType, Comptroller, FToken, Governance, MarketMap, PriceFeed, ProtocolAddresses, testnetAddresses, TezosLendingPlatform, TokenStandard, UnderlyingAsset } from 'tezoslendingplatformjs';
enableMapSet();

enablePatches();

export interface queryFtokenStorage {
  comptroller: Comptroller.Storage,
  protoAddress: ProtocolAddresses,
  server: string,
}
export interface State { markets: Map<string,any>};

export interface StateHistory { state: State , historyPointer: number , patches: any[], inversePatches: any[], next(): StateHistory | null, previous(): StateHistory | null}

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
function addMarket2(currentState: StateHistory, markets: any): StateHistory {
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

function addMarket(state: State, markets: any): State {
  return produce(state, (draft) => {
    Object.keys(markets).forEach((ftoken) => {
      draft.markets.set(ftoken, markets[ftoken]);
    });
  });
}
const state0: State = {markets: new Map()};
const state1 = {state: state0, historyPointer: 0, patches: [], inversePatches: [], next: () => null, previous: () => null};
const nextPrevious0 = { next: next(state1), previous: previous(state1) }
const initState: StateHistory = Object.assign(state1, nextPrevious0);
//const state1 = addMarket(state0, marketTestData);
const stateHistory1 = addMarket2(initState, marketTestData);
console.log('\n\n\nstate ' ,stateHistory1);
console.log('\n\n\nprevious state' ,stateHistory1.previous());
console.log('\n\n\nnext state' ,stateHistory1.next());
//console.log(JSON.stringify(stateHistory1));


/*
export async function getFtokenStorages(
  state: State,
  remotes: queryFtokenStorage
): Promise<State> {
  return await produce(state, async (draft) => {
    draft.ftokens = await TezosLendingPlatform.GetFtokenStorages(
      remotes.comptroller,
      remotes.protoAddress,
      remotes.server
    );
  });
}
*/

/*
const collection = {
  map: new Map(),
  set: new Set(),
  storedAsObject: {},
  storedAsDraft: {},
};

collection.set.add(collection.storedAsObject);
collection.map.set(collection.storedAsObject, 'value');

const newCollection = produce(collection, (draft) => {
  console.log(draft.set.has(draft.storedAsObject)); // false
  console.log(draft.map.has(draft.storedAsObject)); // false

  draft.set.add(draft.storedAsDraft);
  draft.map.set(draft.storedAsDraft, 'value');
});

console.log(newCollection.set.has(newCollection.storedAsDraft)); // true
console.log(newCollection.map.has(newCollection.storedAsDraft)); // false
*/

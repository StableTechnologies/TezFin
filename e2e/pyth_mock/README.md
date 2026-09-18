# Test-only Pyth EVM mock

This isolated Foundry project provides only the read ABI consumed by
`contracts/TezFinOracle.py`:

```solidity
getPriceNoOlderThan(bytes32,uint256)
    returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)
```

It does not implement Pyth signatures, Wormhole guardians, VAA/Hermes
verification, consensus, update fees, or price-feed updates. The admin setters
exist solely to control integration fixtures.

Run unit tests from this directory:

```sh
cd e2e/pyth_mock
forge test
```

Deploy three configured Shadownet feeds with the Foundry script:

```sh
MOCK_DEPLOYER_PRIVATE_KEY="$EVM_PRIVATE_KEY" \
  forge script script/DeployPythMock.s.sol:DeployPythMock \
  --rpc-url https://node.shadownet.etherlink.com --broadcast
```

The full live runner is deliberately opt-in and requires both an EVM deployer
credential and the Shadownet Tezos admin credential. It writes no production
manifest and refuses non-Shadownet RPCs:

```sh
ALLOW_SHADOWNET_MOCK=1 EVM_PRIVATE_KEY="$EVM_PRIVATE_KEY" \
  TEZOS_PRIVATE_KEY="$TEZOS_PRIVATE_KEY" \
  ./e2e/pyth_mock/run_shadownet_integration.sh
```

By default the runner uses `TezFinOracle` from the Shadownet manifest. To test
a freshly originated oracle compiled from the current source, set
`TEZFIN_ORACLE_ADDRESS` to that new Shadownet address; the temporary manifest
will use it without changing the checked-in manifest.

`setIgnoreAgeCheck(true)` permits an old or future timestamp to cross the NAC
boundary so TezFinOracle's own stale, future, and rollback validation remains
the behavior under test. Restore a valid timestamp with `SetPythPrice.s.sol` or
another `setPrice` call after a failure scenario.

## Raw NAC probe

`NacProbe.py` is test-only diagnostic infrastructure. It calls the same
`staticcall_evm` view as TezFinOracle and returns the raw response without
decoding it. Its `decodedPrice` view additionally applies the same unsigned
first-word decoder used by TezFinOracle. Use both views to distinguish an EVM
ABI problem from a Michelson decoder problem.

Compile it against the Shadownet manifest:

```sh
DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.shadownet.json \
  ~/smartpy-cli/SmartPy.sh compile e2e/pyth_mock/NacProbe.py \
  /tmp/tezfin-nac-probe --purge --protocol kathmandu
```

Originate it with the same Shadownet Tezos signer used for the oracle. The
following command uses the compiled JSON artifacts and does not modify the
checked-in manifest:

```sh
ORACLE_COMPILE_DIR=/tmp/tezfin-nac-probe \
node --input-type=commonjs <<'NODE'
const fs = require('fs');
const path = require('path');
const { createTezosClient } = require('./deploy/deploy_script/util.js');

(async () => {
  const dir = path.resolve(process.env.ORACLE_COMPILE_DIR, 'NacProbe');
  const code = JSON.parse(fs.readFileSync(path.join(dir, 'step_000_cont_0_contract.json')));
  const init = JSON.parse(fs.readFileSync(path.join(dir, 'step_000_cont_0_storage.json')));
  const { tezos } = await createTezosClient();
  const params = { balance: '0', code, init };
  const estimate = await tezos.estimate.originate(params);
  const operation = await tezos.contract.originate({
    ...params,
    fee: Math.ceil(estimate.suggestedFeeMutez * 1.2),
    gasLimit: estimate.gasLimit,
    storageLimit: estimate.storageLimit,
  });
  console.log(`[INFO] Injected: ${operation.hash}`);
  await operation.confirmation(1, 45);
  console.log(`NAC_PROBE_ADDRESS=${(await operation.contract()).address}`);
})().catch((error) => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
NODE
```

Set the originated address and call the view with the mock address and complete
calldata. The view input is a Michelson pair: `(destination string, calldata bytes)`.

```sh
export NAC_PROBE_ADDRESS=KT1...
export PYTH_MOCK_ADDRESS=0x...
export PYTH_FEED_ID=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
export PYTH_CALLDATA="0xa4ae35e0${PYTH_FEED_ID#0x}$(printf '%064x' 60)"
export TEZOS_SOURCE=tz1XTWbfhyWK9xmPAa6TyQUSv437JFgZDzgA

node <<'NODE'
const rpc = 'https://michelson.etherlink.shadownet.octez.io';
const body = {
  contract: process.env.NAC_PROBE_ADDRESS,
  view: 'rawPythResponse',
  input: {
    prim: 'Pair',
    args: [
      { string: process.env.PYTH_MOCK_ADDRESS },
      { bytes: process.env.PYTH_CALLDATA.slice(2) },
    ],
  },
  chain_id: 'NetXtLrzvQDobza',
  source: process.env.TEZOS_SOURCE,
  payer: process.env.TEZOS_SOURCE,
  gas: '1040000',
  unparsing_mode: 'Readable',
};
const response = await fetch(
  `${rpc}/chains/main/blocks/head/helpers/scripts/run_script_view`,
  { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
);
console.log(response.status);
console.log(await response.text());
NODE
```

Repeat the same request with:

```js
view: 'decodedPrice'
```

The successful result must be the Michelson integer `6000000000`. If
`rawPythResponse` is correct and `decodedPrice` is also `6000000000`, the
remaining issue is specific to the larger TezFinOracle code path. If
`decodedPrice` is zero or fails, the decoder/runtime behavior is isolated in
this small probe.

The live runner also calls `getValidatedPrice` directly and asserts these
contract-level rejections: stale price, timestamp rollback with a non-zero
previous timestamp, excessive confidence, price bounds, and price deviation.

For the signed decoder used by `TezFinOracle._decodeSignedWord`, use:

```js
view: 'decodedSignedPrice'
```

It must also return `6000000000`. A mismatch between `decodedPrice` and
`decodedSignedPrice` reproduces the production failure without originating a
larger oracle diagnostic contract.

Use `decodedConfidence` to inspect the second ABI word. For the standard BTC
fixture it must return `1000000`; the TezFin validation rule then accepts it
because `1000000 * 4 <= 6000000000`.

The successful result must be a 128-byte Michelson `bytes` value. Compare its
four 32-byte words with `cast rpc eth_call` against the same mock and calldata.
If the words differ, the issue is in NAC transport; if they match, the issue
is inside TezFinOracle's byte decoding or validation path.

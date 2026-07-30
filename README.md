# TezFin

This project is the implementation of Compound Protocol on Tezos chain using SmartPy language.

Node.js 22 is required for the JavaScript and TypeScript packages. Run `nvm use` from the repository root before installing dependencies.

The diagram demonstrates relations between contracts
![](https://github.com/RSerhii/TezFin/blob/master/docs/ContractsRelations.png)

The platform consists of the following contracts
 - Governance - admin contract that has the ability to change parameters in Comptroller and ꜰTokens. The first version of Tezfin has a centralized Governance that works as an admin proxy
 - Comptroller - the risk management layer. It determines how much collateral a user is required to maintain, and whether (and by how much) a user can be liquidated. Each time a user interacts with a ꜰToken, the Comptroller is asked to approve or deny the transaction
   - Price oracle - third-party contract that provides price data. Used by Comptroller for liquidity calculation 
 - ꜰToken - Tezfin market for the underlying token
   - Interest Rate Model - specifies rules of acquiring interest rate and borrow rate
   - Underlying token - the contract of the actual asset. Tezfin supports both FA1.2 and FA2 tokens

For the detailed description please refer to the [wiki pages](https://github.com/RSerhii/TezFin/wiki).

## Project Structure

SmartPy Legacy CLI **0.16.0** is the only supported compiler version for this
codebase. The contracts use the legacy SmartPy syntax and cannot be compiled with
the current SmartPy language without a reviewed migration.

Install the pinned compiler and runtime dependencies with:

```sh
tools/install-smartpy.sh
```

The installer fails closed unless the downloaded archive matches the repository's
SHA-256 pin, installs npm dependencies with `npm ci` from
`tools/smartpy/package-lock.json`, and verifies that the compiler reports exactly
`SmartPy Version: 0.16.0`. Do not use the upstream `curl | bash` installer for
release builds.

CI additionally pins Ubuntu 22.04, Node.js 22.16.0, Python 3.11.11, and GitHub
Actions to immutable commit SHAs.

Node.js 22.16.0 is also the required local and production deployment runtime.
Use `nvm use` (or a version manager that reads `.node-version`) before running
`npm ci`; the deployment package rejects other Node.js versions because Taquito
25 requires Node.js 22 or newer.

Code is organized in the following structure

 - [contracts](contracts) - contains SmartPy code of smart contracts
    - [interfaces](contracts/interfaces) - smart contracts interfaces with description of external entry points
    - [utils](contracts/utils) - smart contracts extensions with utility functions
    - [tests](contracts/tests) - unit tests
        - [mock](contracts/tests/mock) - mock contracts for test purposes
        - [utils](contracts/tests/utils) - unit tests utility functions
        - [CTokenTest.py](contracts/tests/CTokenTest.py) - unit tests for generic ꜰToken code
        - [CFA12Test.py](contracts/tests/CFA12Test.py) - unit tests for FA1.2 ꜰToken template
        - [CFA2Test.py](contracts/tests/CFA2Test.py) - unit tests for FA2 ꜰToken template
        - [CXTZTest.py](contracts/tests/CXTZTest.py) - unit tests for XTZ ꜰToken implementation
        - [InterestRateModelTest.py](contracts/tests/InterestRateModelTest.py) - unit tests for interest rate model
        - [ComptrollerTest.py](contracts/tests/ComptrollerTest.py) - unit tests for Comptroller
        - [GovernanceTest.py](contracts/tests/GovernanceTest.py) - unit tests for Governance
    - [InterestRateModel.py](contracts/InterestRateModel.py) - interest rate model, calculates supply and borrow rate for ꜰToken instance
    - [CToken.py](contracts/CToken.py) - ꜰToken generic code
    - [CFA12.py](contracts/CFA12.py) - FA1.2 ꜰToken template
    - [CFA2.py](contracts/CFA2.py) - FA2 ꜰToken template
    - [CXTZ.py](contracts/CXTZ.py) - XTZ ꜰToken implementation
    - [Comptroller.py](contracts/Comptroller.py) - The risk model contract
    - [Governance.py](contracts/Governance.py) - Performs control over the protocol
 - [docs](docs) - materials for documentation
 - [deploy](deploy) - contains scipts for compilation and deployment
    - [test_data](deploy/test_data) - additional contracts for deploment on testnet
    - [compile_targets](deploy/compile_targets) - contains description of compilation targets
       - [Config.json](deploy/compile_targets/Config.json) - contracts compilation configuration
    - [deploy_script](deploy/deploy_script)
       - [config.json](deploy/deploy_script/config.json) - deploy configuration with secret data
       - [deploy.js](deploy/deploy_script/deploy.js) - conseiljs deployment script
    - [shell_scripts](deploy/shell_scripts) - shell scripts to compile and deploy contracts in one command

## Run Contract Unit Tests

To run tests use SmartPy CLI from the core project directory. Create a folder for test outputs. Example:


```sh
mkdir TezFinTest
cd TezFin
~/smartpy-cli/SmartPy.sh test contracts/tests/CTokenTest.py ../TezFinTest/ --html
```

After executing the previous command, an HTML report will be generated in "../TezFinTest/CToken_Tests/log.html"

The following script does the same as above, but for all test files at once.
```sh
cd TezFin
./contracts/tests/run_tests.sh ~/smartpy-cli/SmartPy.sh
```

The contract suite includes `CapPostStateTest.py`, which exercises supply and
borrow caps through real ꜰToken `mint` and `borrow` entrypoints at below-cap,
exact-cap, and cap-plus-one boundaries, including exchange-rate rounding.

## Required Deployment Tests

These checks guard the deployment pipeline itself (not the contracts' business logic)
and all run offline/in CI without needing a live Tezos node:

- **Per-market IRM wiring** (`deploy/compile_targets/tests/test_irm_wiring.py`) - static
  check that each ꜰToken market compile target (`CompileCUSDt.py`, `CompileCUSDtz.py`,
  `CompileCXTZ.py`, `CompileTzBTC.py`) references its own, asset-specific
  `<Market>_IRM` config key instead of accidentally reusing another market's IRM.
  ```sh
  python3 deploy/compile_targets/tests/test_irm_wiring.py
  ```
- **Deploy pipeline wiring** (`deploy/compile_targets/tests/test_deploy_pipeline_wiring.py`)
  - three cheap, static (no SmartPy, no network) checks in one script:
  - every `Compile*.py` referenced from `deploy_previewnet.sh`/`deploy_mainnet.sh`
    actually exists on disk (catches a typo'd/renamed/deleted compile target left
    dangling in a shell script);
  - `CompileCtzBTC_IRM.py` reads its parameters only from `CFG.CtzBTC_IRM` (its own,
    asset-specific IRM config block), not another market's by mistake;
  - `Config.py` (Python) and `util.js`'s `resolveDeployResultPath()` (JS) actually
    resolve to the same default manifest file for a given `networkProfile`
    ("previewnet"/"mainnet"/unset) - executed for real (each language's actual source,
    not a re-implementation) rather than just asserted in a comment.
  ```sh
  python3 deploy/compile_targets/tests/test_deploy_pipeline_wiring.py
  ```
- **Mainnet governance payload**
  (`deploy/compile_targets/tests/test_mainnet_governance_payload.py`) - validates
  that the checked-in manifest uses an oracle max age accepted by the contract,
  configures price bounds and market caps before activation, keeps unapproved
  markets fail-closed, and controls mint, borrow, redeem, and liquidation
  independently.
  ```sh
  python3 deploy/compile_targets/tests/test_mainnet_governance_payload.py
  ```
- **Contract origination size threshold**
  (`deploy/compile_targets/tests/test_operation_size.py`) - performs a **fresh SmartPy
  compile** (not a read of whatever is checked into `compiled_contracts/`, which can be
  stale relative to the current change) of Governance, TezFinOracle, and Comptroller
  into a temporary directory, using the **same SmartPy CLI flags each target is
  compiled with in `deploy_previewnet.sh`/`deploy_mainnet.sh`** (e.g.
  `--erase-comments --erase-var-annots --initial-cast` for Comptroller), against a
  throwaway manifest of placeholder addresses (`e2e/deploy_result/deploy.json`), then
  measures the **complete origination operation** for each and checks it against the
  32768-byte Tezos manager-operation limit.

  The measured quantity matters here. SmartPy's `*_sizes.csv` reports only the packed
  Micheline size of the contract code and the initial storage, but the protocol's
  `max_operation_data_length` applies to the whole signed operation, which also carries
  the branch, source, fee/counter/gas/storage limits and a 64-byte signature - about 140
  bytes more. This check therefore forges a real origination operation offline with
  `@taquito/local-forging` (see `deploy_script/measure_origination_size.js`) and gates on
  that, which is the same number Taquito reports as `estimate.originate().opSize`.
  Because the forging is local it needs no RPC, no funded account and no secret key, so
  the authoritative figure is available on every commit rather than only at deploy time.
  The code+storage numbers are still printed alongside it for continuity.

  It also warns when the remaining margin is under ~162 bytes, since Taquito batches a
  reveal into the same operation group when the deployer's public key has not yet been
  revealed, and that reveal shares the same 32768-byte budget.

  Requires the SmartPy CLI and `npm ci` in `deploy/deploy_script`; fails loudly
  (non-zero exit) if the CLI can't be found, if the forger is unavailable, or if every
  compile attempt fails, rather than silently reporting success with nothing checked.
  ```sh
  python3 deploy/compile_targets/tests/test_operation_size.py ~/smartpy-cli/SmartPy.sh
  ```

  To measure a single already-compiled contract directly:
  ```sh
  cd deploy/deploy_script
  npm run measure:origination-size -- ../../TezFinBuild/compiled_contracts/Comptroller --json
  ```
- **Reproducible contract compilation**
  (`deploy/compile_targets/tests/test_reproducible_build.py`) - compiles every contract
  originated by `deploy_mainnet.sh` twice in clean temporary directories with the
  same production flags, then compares SHA-256 hashes of canonical contract and
  storage JSON. CI publishes the resulting
  `compiled-contract-hashes.json` artifact for deployment and multisig review.
  ```sh
  COMPILED_HASHES_OUTPUT=compiled-contract-hashes.json \
    python3 deploy/compile_targets/tests/test_reproducible_build.py ~/smartpy-cli/SmartPy.sh
  ```
- **Deploy script guards** (`deploy/deploy_script/test/deploy_guards.test.js`) - unit
  tests (Node's built-in test runner, no network access) for the safety checks in
  `util.js`, `assert_network.js`, and `mainnet_preflight.js`: chain-id mismatch
  rejection (manifest vs. connected RPC), Micheline code/storage comparison used to
  decide whether an existing manifest entry can be safely reused, manifest path
  resolution (`DEPLOY_MANIFEST` env var vs. per-profile default), and mainnet preflight's
  required-canonical-key / vetted-address-allowlist checks.
  ```sh
  cd deploy/deploy_script
  npm ci
  npm test
  ```

All three are wired into CI (`.github/workflows/ci.yml`).

Not currently automated (documented here as a manual pre-mainnet step instead): a live
dry run of `deploy_mainnet.sh` against a real mainnet-like node, and confirming the
`MAINNET_CHAIN_IDS` value in `assert_network.js` against the node you actually connect
to before relying on it to reject a misconfigured network.

## Run Contract E2E Tests

To run e2e tests use the following command, you will need latest smartpy cli installed.

```sh
cd TezFin
./e2e/shell_scripts/deploy_all_contracts.sh ~/smartpy-cli/SmartPy.sh
```

## Compile & Deploy Contracts

Before listing an underlying, complete the [market listing checklist](docs/MarketListingChecklist.md). In particular, this cash-accounting design supports only exact-transfer underlyings.

To compile and deploy all contracts at once:
1. Configure parameters for contracts compilation in [Config.json](deploy/compile_targets/Config.json). Reffer to [Compilation arguments](https://github.com/RSerhii/TezFin/wiki/Compilation-arguments)
2. The deployer is configured for Tezos X Previewnet in [config.json](deploy/deploy_script/config.json). Keep only the public deployment address there; provide the matching private key from your shell (never commit it):
```sh
export TEZOS_PRIVATE_KEY='edsk...'
```
   Before deploying to a different network or with a different deployment account, update
   `originator.pkh` (and `tezosNode` / `chainId`) in `config.json` to match the target. This is an
   intentional manual step: the deployer will refuse to run if the signing key does not match the
   configured `originator.pkh`, so committing the wrong address is a safe failure, not a silent one.
   Alternatively, set `TEZOS_MNEMONIC` for a standard Tezos wallet seed phrase (and `TEZOS_MNEMONIC_PASSWORD` only if your wallet used one). The default derivation path is `44'/1729'/0'/0'`; override it with `TEZOS_DERIVATION_PATH` if needed. Legacy fundraiser accounts additionally require `TEZOS_FUNDS_EMAIL` and `TEZOS_FUNDS_PASSWORD`. The signer must match `originator.pkh` and have Previewnet XTZ.
   Previewnet fee estimates can change between simulation and injection; the deployer applies a 20% fee margin. Override it only when needed with `TEZOS_FEE_SAFETY_MULTIPLIER`.
3. Install deployment dependencies
```sh
cd deploy/deploy_script
npm install
npm run check
npm run prepare:deploy
```
4. Run the deployment script for the target network:
   - Previewnet:
     ```sh
     ./deploy/shell_scripts/deploy_previewnet.sh ~/smartpy-cli/SmartPy.sh
     ```
   - Mainnet (see [Mainnet Deployment](#mainnet-deployment) below before running this):
     ```sh
     MAINNET_DEPLOY_CONFIRM=yes ./deploy/shell_scripts/deploy_mainnet.sh ~/smartpy-cli/SmartPy.sh
     ```

> To deploy a specific contract run the corresponding script in [shell_scripts](deploy/shell_scripts)

### Mainnet Deployment

`deploy_mainnet.sh` is a separate, stricter profile from `deploy_previewnet.sh`:

- It never runs `CompileTestData.py` — no mock tokens or mock oracle are ever compiled or
  originated on this path.
- It refuses to run unless `deploy_script/config.json` declares `networkProfile: "mainnet"` **and**
  the connected RPC reports a known mainnet chain id (`assert_network.js`). It also exports
  `DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.mainnet.json` at the top of the script (unless
  already set) so every step — the plan/preflight check, `prepare.js`, `deploy.js`, and the SmartPy
  compile targets — reads and writes the exact same manifest file.
- Before touching the manifest at all, it runs `mainnet_preflight.js`, which requires the manifest to
  already contain vetted, on-chain-verified canonical addresses for `PriceOracle`, `USDt`, and `tzBTC`
  (checked both against an on-chain existence check and a required hardcoded allowlist in
  `mainnet_preflight.js`; a missing allowlist entry fails deployment), prints the full deployment plan (network, chain id, manifest,
  canonical inputs, and any addresses already recorded in the manifest), and requires
  `MAINNET_DEPLOY_CONFIRM=yes` to proceed past that point. Only after this passes does `prepare.js` run
  and write `OriginatorAddress` to the manifest — declining confirmation leaves the manifest untouched.
- Before every mainnet origination, the programmatic preflight in `util.js` also runs
  `verify_mainnet_oracle.js`. This applies to both the shell script and raw `node deploy.js` usage and
  rejects missing views, zero prices, stale or future timestamps, and millisecond timestamps.
- After origination it reminds you to complete the [Post-Deployment Admin
  Handoff](#post-deployment-admin-handoff-mainnet) before unpausing any market.

> `USDtz` is intentionally not required by `mainnet_preflight.js`: no compile target in either deploy
> script currently originates a `CUSDtz` market. If a `CUSDtz` market is added to the mainnet pipeline
> later, add `USDtz` back to `REQUIRED_CANONICAL_KEYS` (and to the allowlist) in
> `mainnet_preflight.js`.

### Deployment Manifest

The deploy scripts track originated addresses in a manifest file
([`TezFinBuild/deploy_result/deploy.json`](TezFinBuild/deploy_result/deploy.json) by default). This
file also stores the `chainId` it was created against; the deployer refuses to reuse a manifest
whose `chainId` doesn't match the connected RPC.

- The tracked `deploy.json` is the populated **Previewnet deployment record** and may be committed so
  an interrupted Previewnet deployment can resume. Do not edit or replace its addresses manually:
  existing entries are reused only after each address is verified on-chain (matching code and
  critical storage addresses, plus all immutable IRM rate parameters), never silently. Mainnet
  deployment records must use `deploy.mainnet.json` (or another explicit `DEPLOY_MANIFEST` path) and
  must never be written to `deploy.json`.
- The manifest path resolution is centralized (`resolveDeployResultPath()` in `util.js`, mirrored by
  `Config.py` for the SmartPy side) so every tool agrees on the same file:
  1. `DEPLOY_MANIFEST`, if set, always wins.
  2. Otherwise, the default is derived from `deploy_script/config.json`'s `networkProfile`:
     `deploy.mainnet.json` when it's `"mainnet"`, `deploy.json` otherwise.
  To keep Previewnet and mainnet deployments in fully separate files, set `DEPLOY_MANIFEST` to an
  explicit path before running `npm run prepare:deploy` and the deploy shell scripts, e.g.:
  ```sh
  export DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.mainnet.json
  ```
  Never reuse a Previewnet manifest for a mainnet run (or vice versa).
- If you need to restart a deployment from scratch on the same network, delete or rename the
  manifest file first rather than editing it in place.

### PriceOracle Configuration

`TezFinOracle` (and therefore `Comptroller`) requires a `PriceOracle` address in the manifest before
it can be compiled — `CompileTezFinOracle.py` validates this dependency and fails with a clear error
if `PriceOracle` is missing, instead of silently compiling with a stale value. Both deploy scripts
also run `verify_oracle.js` right before compiling `TezFinOracle`, which checks that the configured
`PriceOracle` address actually exists on the connected chain (not just that the manifest key is
present) and fails closed if it does not.

`TezFinOracle` ([`contracts/TezFinOracle.py`](contracts/TezFinOracle.py)) is a thin proxy: it forwards
price lookups to the address stored as `oracle` (the `PriceOracle` from the manifest) and expects that
address to expose the on-chain view `get_price_with_timestamp(string) -> pair(nat, timestamp)` for
symbols such as `XTZUSDT` and `BTCUSDT`. It also has a small admin-controlled override map for assets
the upstream feed does not support (e.g. USD and USDT). `TezFinOracle`'s own `admin` (settable via
`set_pending_admin` / `accept_admin`) controls those overrides and can repoint `oracle` to a different
feed with `set_oracle`.

- **Previewnet**: `CompileTestData.py` compiles and deploys a mock `PriceOracle`
  ([`deploy/test_data/PriceOracle.py`](deploy/test_data/PriceOracle.py)) as part of
  `deploy_previewnet.sh`. This mock is for Previewnet only, is **not** Harbinger — it's a bare
  stand-in that mimics the same `get` callback interface. It has **no administrator check**: its
  `setPrice` entry point can be called by any address to set any price for any asset. Do not treat a
  Previewnet deployment using this mock as representative of mainnet price-feed security.
- **Mainnet**: `deploy_mainnet.sh` never compiles or originates the mock oracle (it does not run
  `CompileTestData.py` at all). Put the exact address of the vetted production Harbinger (or
  Harbinger-compatible) oracle directly under the `PriceOracle` key in the mainnet manifest
  (`DEPLOY_MANIFEST`) before running `deploy_mainnet.sh`; `mainnet_preflight.js` verifies it exists
  on-chain before anything is compiled. The mandatory programmatic deployment preflight executes the
  exact XTZ, USDT, and tzBTC views before origination and rejects zero, stale, or
  future/millisecond timestamps. Document,
  alongside the mainnet manifest, which oracle instance/administrator is being used and who controls
  it — this project does not deploy or administer that upstream feed itself.

## Post-Deployment Admin Handoff (Mainnet)

After origination, every contract (`Governance`, `TezFinOracle`) is initially administered by the
deployer account (`OriginatorAddress`). Before any market is unpaused or opened to real users, the
protocol admin rights **must** be handed off to the production multisig. This is currently a manual
process:

1. Keep all markets paused until the handoff below is fully verified.
2. On `Governance`, call `setPendingGovernance(<multisig address>)` from the deployer account.
3. From the multisig, call `acceptGovernance()` on `Governance` to finalize the transfer.
4. On `TezFinOracle`, call `set_pending_admin(<multisig address>)` from the deployer account, then
   have the multisig call `accept_admin()` to finalize the transfer.
5. Verify the exact final on-chain storage (e.g. via a block explorer or a Taquito script):
   - `Governance.administrator` is the production multisig.
   - `TezFinOracle.admin` is the production multisig.
   - `Comptroller.administrator` is the `Governance` contract address.
   - Every ꜰToken's `administrator` is the `Governance` contract address.
   - `pendingAdministrator` is `None` on `Governance`, `Comptroller`, and every ꜰToken, and
     `TezFinOracle.pendingAdmin` is `None`.
   - The deployment wallet is absent from all administrator and pending-administrator fields and
     retains no administrative authority.
6. Only unpause markets after every check in step 5 passes.

Note: `Comptroller` and every ꜰToken market are administered *through* `Governance`
(`Governance.setContractGovernance` / `acceptContractGovernance` act as a proxy for their
`setPendingGovernance` / `acceptGovernance` entry points). Once `Governance` itself is controlled by
the production multisig (steps 2-3), the multisig automatically controls Comptroller and every
ꜰToken through it — there is no separate handoff needed for those contracts, only the on-chain
verification in step 5.


## Build and Run UI

1. Build Util

```sh
cd src/util
npm install
```

2. Build UI
```sh
cd src/ui
npm install
npm run build
```

3. Run

```sh
cd src/ui
npm start
```

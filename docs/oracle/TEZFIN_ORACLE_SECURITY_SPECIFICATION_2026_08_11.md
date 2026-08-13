# TezFin Resilient Oracle

## Security Architecture and Engineering Acceptance Specification

**Version:** 1.0
**Date:** 11 August 2026
**Status:** Implementation baseline. Not production approval.
**Audience:** TezFin engineering, operations, governance, and independent security reviewers
**Repository baseline:** `StableTechnologies/TezFin` at `origin/main` commit `83b4e486d6725a836609d9c52c927be3c66a6f05`

## Executive directive

TezFin requires a Michelson-native Layer 1 price oracle that TezFin can operate and audit without depending on Acurast, Acelon, Ubinetic, or Youves. The production design shall use a permissionless relayer and a threshold-signed oracle with four separately administered signers and a three-signature threshold.

The production quorum must not consist of four copies of one validator. The four signers shall be divided evenly between two independently implemented validation classes. A valid production update requires three signatures and at least one signature from each validator class. With a two-plus-two class split, every valid three-of-four quorum necessarily includes both classes and still tolerates the loss of any one signer.

The single-publisher version may be used only on testnet and for non-authoritative mainnet shadow operation. It shall never authorize active TezFin borrowing, collateral withdrawal, liquidation, or another price-dependent risk action.

No external requester, coordinator, relayer, API caller, or transaction sender may select or weaken the price-source policy. In particular, none may provide the authoritative price, maximum deviation, minimum source count, source allowlist, aggregation method, decimals, freshness limit, or other acceptance rule. Those values are versioned operator policy approved through governance.

Production activation requires all of the following:

1. The final three-of-four configuration is live and verified.
2. Both independent validator classes are operational.
3. The final code and configuration complete mainnet shadow operation.
4. All mandatory acceptance tests pass against the exact release commit.
5. An independent human security review has no unresolved critical or high-severity findings.
6. TezFin governance separately approves the oracle address, asset policies, market caps, collateral factors, and market activation.

## 1. Purpose and authority

This document defines what the engineering team is expected to build, how the system must fail, and the evidence required before TezFin may rely on it. It is intentionally stricter than a feature description or development estimate.

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative:

- **MUST** and **MUST NOT** are release requirements.
- **SHOULD** is expected unless a written security justification is accepted by TezFin's risk owner and independent reviewer.
- **MAY** is optional.

Where this specification conflicts with the earlier `OraclePlan.md` or `OracleCexOnlyPlan.md`, this specification controls. The CEX-only plan remains useful as an implementation inventory and cost baseline, but the following earlier assumptions are expressly superseded:

- A single publisher is not a production authority.
- Four deployments of identical signing software are not independent validation.
- The chain inclusion time is not a substitute for the underlying market observation time.
- One illiquid or unavailable asset must not unnecessarily stop healthy assets from updating.
- A 24-hour shadow period is insufficient for production approval.
- Acurast is not a baseline dependency or priority source. It may be assessed later as an optional input under the same restrictions as any other source.

## 2. Scope

### 2.1 Included

- A Tezos Layer 1 oracle contract compiled to Michelson.
- Threshold signature verification and permissionless submission.
- Off-chain price observation, aggregation, independent validation, signing, and relaying.
- XTZ/USD, BTC/USD, USDt/USD, USDtz/USD, and tzBTC/USD policies.
- Compatibility with TezFin's existing oracle wrapper and Comptroller.
- Deployment, key management, monitoring, incident response, shadow operation, and release evidence.
- A generic signer-set design that can later support configurations such as four-of-five or five-of-seven without replacing the oracle contract, subject to measured operation-size and fee limits.

### 2.2 Excluded

- Tezos X cross-runtime access to EVM oracles. That is a separate Layer 2 integration path.
- Automatic reopening of TezFin markets.
- Replacement or migration of existing fToken balances.
- A guarantee that every listed asset is suitable for collateral or borrowing. Oracle availability does not itself constitute market-risk approval.
- Treating a security review, testnet deployment, or shadow deployment as production approval.

## 3. Existing TezFin integration context

At the repository baseline, `TezFinOracle` remains a guarded proxy to an upstream contract that exposes a price and timestamp view. It adds consumer-side protection through:

- rejection of zero, future, stale, and time-regressing observations;
- per-consumer maximum price age;
- per-market absolute price bounds;
- per-market maximum price-change limits; and
- fail-closed behavior when a price cannot be validated.

The current mainnet deployment manifest intentionally has no production oracle address. This is a release blocker, not a placeholder that may be filled without review.

The new upstream oracle must preserve the exact view type expected by the current wrapper or provide a separately reviewed compatibility adapter. Legacy identifiers such as `XTZUSDT`, `USDTUSDT`, or `USDUSDT` must be treated only as compatibility aliases. Their economic meaning must be defined in one immutable mapping and must not be inferred from their names.

The oracle shall use canonical internal asset identifiers:

- `XTZ_USD`
- `BTC_USD`
- `USDT_USD`
- `USDTZ_USD`
- `TZBTC_USD`

Compatibility aliases shall map to exactly one canonical identifier. Unknown identifiers and ambiguous aliases shall fail.

## 4. Security objectives

The system must preserve five properties.

### 4.1 Integrity

An attacker who controls a requester, coordinator, relayer, RPC endpoint, one signing key, or one validator deployment cannot cause TezFin to accept an arbitrary price.

### 4.2 Availability

The loss of any one signer, one relayer, one RPC endpoint, or one supported CEX source must not prevent healthy core assets from updating. Availability must not be obtained by weakening validation.

### 4.3 Freshness

The timestamp exposed to TezFin must represent the market observations used to derive the price. Republishing an old value in a new Tezos operation must not make it fresh.

### 4.4 Isolation

A failure of the USDtz or tzBTC path must not automatically prevent XTZ, BTC, and USDt from updating. Each market must become stale or paused independently unless a shared base input is genuinely required.

### 4.5 Auditability

Every accepted batch must be reproducible from a versioned policy and attributable to a defined signer set. The system must retain sufficient non-secret evidence to explain which sources, observations, policy version, and signatures supported an accepted price.

## 5. Required architecture

### 5.1 Production data path

```text
Approved market sources
        |
        v
Independent validator class A, two isolated signers
Independent validator class B, two isolated signers
        |
        v
Three signatures, including both validator classes
        |
        v
Permissionless coordinator or backup relayer
        |
        v
Threshold Michelson oracle
        |
        v
TezFin oracle wrapper
        |
        v
Comptroller consumer safeguards
```

The coordinator proposes a canonical batch and collects signatures. It is not an oracle authority. Anyone may submit a valid signed batch, and a replacement relayer must be able to relay the same batch without access to signing keys.

### 5.2 Signer independence model

| Signer | Validation class | Administrative domain | Minimum independence |
| --- | --- | --- | --- |
| A1 | Class A | Account/domain 1 | Separate root credentials, signing key, runtime, logs, and deployment role |
| A2 | Class A | Account/domain 2 | Separate root credentials, signing key, runtime, logs, and deployment role |
| B1 | Class B | Account/domain 3 | Independent critical validation implementation plus separate administration |
| B2 | Class B | Account/domain 4 | Same class-B implementation, separately administered and deployed |

Class B must independently implement the security-critical path that parses observations, applies source policy, normalizes values, derives canonical prices, validates timestamps, and decides whether to sign. Reusing a type definition or test vector is acceptable. Reusing the same acceptance function, policy parser, or compiled validation artifact is not.

The two classes should also use meaningfully different observation routes where possible. They must not both depend on one hosted aggregator, one cached API, or one coordinator-provided observation set.

### 5.3 Why three-of-four alone is insufficient

Threshold signatures prevent one stolen key from publishing. They do not prevent correlated software failure. The Youves/Acelon incident demonstrated that several legitimate processors can sign the same false value when all execute the same unsafe logic. The two-class requirement is therefore part of the quorum definition, not an optional quality improvement.

### 5.4 Staged deployment

The engineering work may proceed in stages, but security claims must remain accurate:

1. **Testnet prototype:** One signer may exercise the complete payload and contract path.
2. **Mainnet shadow:** A one-signer instance may publish for comparison, but no TezFin market may consume it authoritatively.
3. **Threshold shadow:** The final three-of-four system and both validation classes publish under the final policy.
4. **Production candidate:** A fresh or cleanly configured authoritative instance begins with the approved three-of-four signer set. It must not pass through an authoritative one-of-one state.
5. **Activation:** TezFin points to the candidate only after the release gates in this document pass.

## 6. Threat model and mandatory responses

### 6.1 Untrusted requester or coordinator

**Threat:** A caller supplies the candidate price and also supplies a validation tolerance or source policy that makes the price acceptable.

**Required response:** The caller may provide only the signed market-update material needed to trigger a cycle and the proposed canonical batch. Every signer applies its own locally pinned policy. Request data can never raise a tolerance, lower a source count, replace the aggregate, change decimals, select weaker sources, or make an old observation fresh.

### 6.2 Single-key or single-account compromise

**Threat:** An attacker obtains one signing key or an entire cloud account.

**Required response:** One key cannot satisfy the total threshold or the validator-class requirement. The compromised signer can only refuse to sign or submit a dissenting value. Operations must alert immediately and support key removal through a delayed, versioned configuration change.

### 6.3 Common-mode validator defect

**Threat:** Three or more signers execute the same defective logic and produce valid signatures over a false price.

**Required response:** The four signers are split two-plus-two across independent validation classes. Any three-of-four quorum includes both classes. The classes independently parse, derive, and validate prices.

### 6.4 Coordinator or relayer compromise

**Threat:** The coordinator changes the batch, withholds signatures, replays a batch, or prevents publication.

**Required response:** Any change invalidates the signatures. Rounds and validity windows prevent replay. A backup or public relayer can submit the same signed payload. The coordinator cannot create signatures.

### 6.5 Source compromise or outage

**Threat:** One exchange returns a false, malformed, stale, or unavailable value.

**Required response:** Each asset policy requires the approved minimum number of independent healthy sources and uses median-based aggregation. Malformed, stale, or divergent sources are excluded and recorded. If the minimum cannot be met, that asset fails closed.

### 6.6 DEX manipulation

**Threat:** An attacker temporarily changes a low-liquidity USDtz or tzBTC pool to influence a spot price.

**Required response:** No raw reserve ratio or one-block spot value is accepted. The path requires executable quotes, minimum liquidity, bounded quote impact, independently maintained rolling observations, a minimum TWAP window, cross-pool comparison where available, and cold-start failure.

### 6.7 Stablecoin and wrapped-asset depeg

**Threat:** USDt, USDtz, or tzBTC diverges from its reference asset while the oracle continues to report the reference value.

**Required response:** No stablecoin or wrapped asset is hard-coded to par. USDtz and tzBTC require explicit peg policies and market evidence. Their collateral and borrowing roles remain disabled until the exact policy and liquidity thresholds are approved.

### 6.8 Replay, delayed inclusion, and cross-domain reuse

**Threat:** A valid signature is reused in a later round, on another network, against another oracle contract, or after its data is stale.

**Required response:** The signed payload binds the domain, chain ID, oracle address, configuration version, round, asset set, observation times, and expiration. The contract rejects non-increasing rounds, expired batches, future observations, stale observations, and mismatched configuration.

### 6.9 Same-operation price exploitation

**Threat:** A price is accepted and immediately used for borrowing or liquidation in the same Tezos operation group or level.

**Required response:** Newly accepted prices have a non-zero activation delay. The public view returns the previously active value until the new value is mature. A newly accepted value cannot authorize a price-dependent TezFin action in the same level.

### 6.10 Administrative compromise

**Threat:** An administrator immediately lowers the threshold, replaces signers, widens bounds, unpauses an asset, or redirects the oracle.

**Required response:** Risk-increasing changes use a pending configuration with a non-zero delay and a new configuration version. An emergency guardian may pause immediately but cannot unpause, lower thresholds, add signers, or change price policy. Final authority belongs to the approved multisig.

### 6.11 RPC inconsistency and reorganization

**Threat:** A publisher or monitor sees false chain state or treats a reverted publication as confirmed.

**Required response:** Submission, inclusion, and final storage are checked through independent RPC endpoints. A round is marked confirmed only after the configured confirmation policy. Reorganization reconciliation occurs before the next publication.

### 6.12 Dependency and build compromise

**Threat:** A package, build tool, image, or deployment artifact differs from the reviewed version.

**Required response:** Dependencies and actions are pinned, lockfiles are committed, builds are reproducible, artifacts are hashed, production images are immutable, and the exact deployed contract and signer artifact hashes appear in the release evidence.

## 7. Normative security invariants

### 7.1 Authority and policy

- **INV-001:** No caller-supplied price becomes authoritative without the complete production signature policy.
- **INV-002:** A request cannot weaken any policy value. It may only select an already approved policy version or request stricter behavior.
- **INV-003:** The source allowlist, aggregation method, minimum source count, freshness, decimals, deviation limits, DEX parameters, and asset set are versioned configuration, not request parameters.
- **INV-004:** Unknown configuration fields cause rejection rather than being ignored.
- **INV-005:** Production can operate without Acurast, Acelon, Ubinetic, or Youves.
- **INV-006:** If Acurast or another external oracle is later added, it may contribute only as one independently bounded input or validator and must not become a production prerequisite or control a validator-class majority.

### 7.2 Signer quorum

- **INV-010:** Production requires at least three unique authorized signatures from a four-signer set.
- **INV-011:** The production set contains exactly two class-A and two class-B signers at initial activation.
- **INV-012:** A valid quorum contains at least one signer from each configured validation class.
- **INV-013:** Duplicate keys, duplicate signatures, unknown keys, and signatures from an inactive configuration do not count.
- **INV-014:** The relayer and coordinator hold no signing authority merely by serving those roles.
- **INV-015:** The contract supports governed threshold and signer-set changes without redeployment, but changes are delayed, versioned, bounded, and operation-size tested.

### 7.3 Signed payload

- **INV-020:** The signed payload includes a fixed domain identifier, Tezos chain ID, oracle contract address, configuration version, policy hash, round, validity window, and canonical asset entries.
- **INV-021:** Each asset entry binds canonical asset ID, price, decimals, observation time, and evidence digest.
- **INV-022:** Canonical asset ordering is defined once. Alternative encodings, duplicate assets, unknown assets, and ambiguous aliases fail.
- **INV-023:** Changing any signed field invalidates every signature over the original payload.
- **INV-024:** Decimals are fixed per asset and checked on-chain. They are not trusted from a source response or request.

### 7.4 Time and replay

- **INV-030:** Market observation time is distinct from Tezos inclusion time.
- **INV-031:** A derived price uses the oldest contributing observation time so derivation cannot launder stale data into a fresh timestamp.
- **INV-032:** Observation times must be positive, not in the future, within the asset's maximum age, and non-regressing relative to the last accepted observation.
- **INV-033:** A round must be strictly greater than the last accepted round for the affected asset group.
- **INV-034:** A skipped round is allowed after an outage. Replaying or reordering an accepted round is not.
- **INV-035:** Republishing the same economic value does not refresh its observation time unless new source observations were actually obtained.

### 7.5 Price acceptance

- **INV-040:** All arithmetic is integer or exact fixed-point arithmetic. JavaScript floating-point values never enter canonical price calculations.
- **INV-041:** Zero, negative, non-finite, unsafe-integer, overflowed, underflowed, and out-of-range values fail.
- **INV-042:** Each asset has approved absolute bounds and movement controls in the upstream oracle and independent consumer bounds in TezFin.
- **INV-043:** An update outside an automatic movement limit is rejected or placed in a non-active exceptional state. It does not become active merely because enough keys signed it.
- **INV-044:** Accepted entries become usable only after the configured non-zero activation delay.
- **INV-045:** A failed asset update leaves the last active price and its original timestamp unchanged.

### 7.6 Asset isolation

- **INV-050:** Core liquid assets and illiquid derived assets do not share one mandatory all-or-nothing publication group.
- **INV-051:** Failure of USDtz or tzBTC does not refresh, alter, or block an otherwise valid XTZ, BTC, or USDt update.
- **INV-052:** A stale or paused asset fails closed for price-dependent actions involving that asset.
- **INV-053:** Repayment remains available during oracle failure.

### 7.7 Governance and operations

- **INV-060:** The production administrator is the approved multisig, not a deployment wallet.
- **INV-061:** Administrator transfer is two-step and verified on-chain.
- **INV-062:** Emergency pause is immediate and narrowly authorized. Unpause and risk-increasing changes are delayed.
- **INV-063:** Every signer-set, threshold, class, policy, alias, decimals, bound, delay, and asset change emits an observable state transition and increments configuration version where applicable.
- **INV-064:** No production manifest contains unresolved placeholders or unapproved defaults.
- **INV-065:** A mainnet oracle address is not added to the TezFin manifest until the exact deployed code, initial storage, signer set, and admin handoff have been verified.

## 8. Price-source and asset policy

### 8.1 General CEX policy

The baseline direct-source set is Binance, OKX, Kraken, and Coinbase, subject to endpoint feasibility and terms. Every adapter must bind the expected venue, market identifier, quote asset, response schema, timestamp semantics, and precision.

For each market route:

- at least three independent healthy venue observations are required unless an asset-specific policy is more restrictive;
- the median is used, not a mean;
- an outlier may be excluded only under a fixed rule that still leaves the required quorum;
- receipt time is not a substitute for exchange observation time;
- a derived route counts as one venue observation, even when it contains several legs;
- two endpoints backed by the same venue or upstream data provider do not count as two independent sources;
- source deviation is computed against a robust center and must remain within the approved policy;
- timeouts and retries must not silently replace a failed source with an unapproved source; and
- exact source identifiers and paths are included in the evidence record.

### 8.2 Asset policy matrix

| Canonical asset | Baseline derivation | Additional controls | Initial market posture |
| --- | --- | --- | --- |
| XTZ/USD | Median of approved direct USD routes and approved USDT routes adjusted by independently derived USDT/USD | Minimum three venues, source-age and deviation limits | Eligible only after final bounds and caps are approved |
| BTC/USD | Median of approved direct USD routes and approved USDT routes adjusted by USDT/USD | Minimum three venues; `XBT` and `BTC` mapping is explicit | Reference input for tzBTC; not a substitute for tzBTC peg evidence |
| USDt/USD | Independent USDT/USD market observations | Stablecoin-specific deviation and depeg alerts | Borrow/collateral role requires conservative stablecoin policy |
| USDtz/USD | USDtz/USDt executable-quote TWAP multiplied by USDt/USD | Two approved pools where viable, minimum liquidity, bounded price impact, cross-pool deviation, cold-start failure | Disabled for collateral and borrowing until liquidity policy is approved |
| tzBTC/USD | BTC/USD adjusted by independently observed tzBTC/BTC peg factor | Approved Tezos liquidity route, TWAP, minimum liquidity, issuer/bridge risk acknowledgement | Disabled for collateral and borrowing until peg policy is approved |

### 8.3 USDtz requirements

USDtz must never be assigned a constant one-dollar price. Its path must:

1. Verify exact pool addresses, token addresses, token IDs, decimals, and contract code expectations.
2. Obtain executable quotes for an approved test amount.
3. Reject quotes whose price impact exceeds the approved limit.
4. Maintain time-weighted observations independently for each pool.
5. Reject cold-start, incomplete-window, stale, low-liquidity, or reorganization-affected windows.
6. Compare independently derived pool TWAPs and fail if they diverge beyond policy.
7. Multiply the accepted USDtz/USDt value by the independently accepted USDt/USD value using fixed-point arithmetic.
8. Use the oldest timestamp among all contributing observations.

If only one viable pool remains, USDtz publication must fail unless governance has separately approved a degraded-mode policy. Degraded mode cannot be activated by the coordinator or a signer alone.

### 8.4 tzBTC requirements

BTC/USD alone does not price tzBTC peg risk. The tzBTC path must either:

- incorporate an approved, manipulation-resistant tzBTC/BTC market factor; or
- keep tzBTC disabled as collateral and as a borrowable asset.

Any decision to apply a haircut rather than a live peg factor must be explicit, versioned, documented, and reflected in market risk parameters. A generic alias from tzBTC to BTC is not sufficient for production lending.

### 8.5 Publication groups

The recommended initial groups are:

- **Core group:** XTZ/USD, BTC/USD, and USDt/USD.
- **USDtz group:** USDtz/USD only.
- **tzBTC group:** tzBTC/USD only.

A batch may update one approved group. The asset set for that group is exact and signed. This preserves atomic consistency where inputs are shared while preventing an illiquid derived asset from stopping unrelated markets.

## 9. Independent validation and signing

### 9.1 Coordinator proposal

The coordinator may propose a canonical batch assembled under the approved policy. Each signer must independently decide whether to sign. A signer must not treat the coordinator's price, timestamp, evidence, source status, or validation result as authoritative.

### 9.2 Signer decision procedure

Each signer must:

1. Load a locally pinned, approved configuration version.
2. Reject an unknown or inactive version.
3. Independently retrieve or validate the required market observations.
4. Validate schemas, asset mappings, timestamps, source identity, liquidity, and source deviation.
5. Independently calculate the canonical asset prices using exact arithmetic.
6. Compare the proposal with its independently calculated result under a locally fixed maximum signer deviation.
7. Verify the proposal's observation time does not exceed the oldest contributing observation.
8. Verify the validity window and round.
9. Record a non-secret validation evidence record keyed by the payload hash.
10. Sign only the complete canonical payload.

A request cannot override step 6's tolerance. A tolerance of zero or an exact-match policy may be used where deterministic data permits. Where timing differences require tolerance, the value must be narrow, asset-specific, versioned, and approved.

### 9.3 Evidence record

For each signing decision, retain:

- payload hash;
- signer ID and validator class;
- configuration and policy hash;
- software artifact hash;
- source IDs and market paths;
- source observation timestamps;
- normalized source values;
- excluded-source reasons;
- local aggregate and proposal deviation;
- DEX liquidity, quote amount, price impact, and TWAP window where applicable;
- decision and stable error code; and
- signature or refusal timestamp.

Secrets, credentials, raw private keys, and sensitive authorization headers must never be logged.

### 9.4 Signing-key isolation

Each signer must have a distinct Tezos-compatible signing key and separate administrative control. A cloud HSM or KMS may be used only after the exact Tezos curve, signature encoding, and verification behavior are proven in an integration test. Otherwise, the key must be encrypted at rest, accessible only to its signer role, non-exported from the runtime where practical, and rotatable under the incident runbook.

No signer role may modify its own approved policy, deploy new signer code, change monitoring, read another signer's key, or alter the oracle contract.

## 10. Canonical signed payload

The final Michelson type may differ, but the signed meaning must include all fields below.

| Field | Requirement |
| --- | --- |
| Domain | Fixed protocol identifier, including major payload version |
| Chain ID | Exact Tezos network identifier |
| Oracle address | Exact destination contract |
| Configuration version | Active signer, class, threshold, and policy configuration |
| Policy hash | Commitment to approved source and validation policy |
| Publication group | Fixed approved asset group |
| Round | Strictly increasing group round |
| Valid from and valid until | Bounded submission window |
| Asset entries | Canonically ordered asset ID, price, decimals, observation time, evidence digest |

All signers and the contract must construct the same packed bytes from the same logical payload. Golden vectors shall be committed for every supported signing curve and payload version.

The evidence digest binds the coordinator's disclosed observation manifest to the signed batch. Each signer must also retain its own independent validation record keyed by the final payload hash. The on-chain contract is not expected to recalculate CEX or DEX prices, but it must reject an unapproved policy hash.

## 11. On-chain oracle requirements

### 11.1 Submission

- Submission is permissionless.
- The contract verifies every counted signature against the active signer set and exact packed payload.
- It enforces the total threshold and validator-class minima.
- It validates the configuration version, policy hash, publication group, exact asset set, decimals, round, time window, observation age, and price bounds.
- It rejects duplicates and unknown signers.
- It performs no external contract calls during update processing.
- A failed update changes no price, timestamp, round, or activation state.

### 11.2 Active and pending prices

Each asset stores sufficient state to distinguish:

- the last active value;
- the newly accepted pending value;
- source observation time;
- acceptance time and level;
- activation time and level;
- round and configuration version; and
- paused or exceptional state.

The public view returns only a mature, non-paused value. A pending value cannot be consumed during the level in which it was accepted. The activation delay is a production risk parameter and cannot be zero.

If a pending value exceeds a configured automatic movement limit, it must not become active automatically. The asset either remains on its previous value with the original timestamp or enters a paused exceptional state. Governance must not refresh an old price's timestamp merely to keep a market open.

### 11.3 Views and compatibility

The contract must provide the price and original observation timestamp in the exact format TezFin expects. The compatibility layer must:

- map every legacy symbol to one canonical asset;
- reject unknown or malformed symbols;
- return fixed expected decimals;
- preserve the market observation timestamp;
- return no value for paused, unsupported, or never-initialized assets; and
- have tests against the compiled TezFin wrapper, not only a mock consumer.

### 11.4 Per-asset controls

The contract must support independent pause and policy state for every asset. A global emergency pause may exist, but it cannot be the only control.

### 11.5 Configurable quorum without redeployment

The signer set, signer class, class minima, total threshold, and active policy version may be configurable so the system can later move from three-of-four to a larger quorum. The implementation must:

- enforce a reviewed maximum signer count;
- reject impossible or unsafe configurations;
- preserve at least two validation classes;
- prevent a class from gaining a quorum by itself;
- apply a delay to changes;
- invalidate signatures from prior configuration versions after activation; and
- compile, simulate, and measure the maximum supported signature count.

Supporting a larger quorum in storage is not sufficient. The maximum supported configuration must pass Tezos operation-size, gas, fee, and execution tests.

## 12. Off-chain service requirements

### 12.1 Runtime and scheduling

The proposed AWS Lambda and EventBridge architecture is acceptable for initial operation, provided each production signer is isolated in a separate administrative domain. Consolidating four signer processes into one account, one deployment role, one secret store, or one mutable artifact is not signer independence.

Each scheduled cycle must be idempotent. Retries, overlapping executions, and execution after broadcast but before confirmation must not create a second accepted round.

### 12.2 Configuration

- Production configuration is immutable during one execution.
- Configuration is schema-validated and hashed.
- Secrets and policy are stored separately.
- Unknown environment variables do not silently alter policy.
- Defaults are allowed only for development. Production requires explicit values.
- No production value may remain `TODO`, example, wildcard, or permissive fallback.

### 12.3 Network and source handling

- TLS verification remains enabled.
- Requests have bounded connect, response, and total timeouts.
- Response size is bounded.
- Redirects, content types, and JSON schemas are validated.
- Rate-limit and outage responses produce stable error codes.
- Retries use bounded exponential backoff and do not cross the publication validity window.
- Primary and backup Tezos RPC endpoints are independently operated where practical.

### 12.4 Arithmetic and parsing

- Source decimal strings are parsed directly into integer fixed-point values.
- JavaScript `number`, `parseFloat`, implicit numeric coercion, scientific notation, `NaN`, and infinity are rejected from the canonical path.
- Rounding direction is explicit and tested for every conversion.
- Multiplication and division order is selected to avoid precision loss and overflow.

### 12.5 Relaying and confirmation

The relayer must simulate before submission, verify inclusion, inspect resulting oracle storage, and reconcile short reorganizations. A successful RPC broadcast alone is not confirmation.

A backup relayer must be deployable without changing the signer set or oracle contract. The signed payload and signatures may be submitted by any funded Tezos account.

## 13. TezFin consumer safeguards

The upstream threshold oracle does not replace consumer-side controls. TezFin's wrapper and Comptroller must continue to enforce:

- non-zero, non-future, sufficiently fresh, and non-regressing timestamps;
- independent per-market absolute price bounds;
- independent maximum movement controls;
- current-level price and liquidity update requirements;
- market supply and borrow caps;
- separate action pause controls; and
- repayment availability during oracle failure.

Before activation, integration tests must prove the exact fail behavior for mint, borrow, redeem, collateral enable/disable, transfer, liquidation, and repayment. Price-dependent risk-increasing actions must fail when the relevant oracle value is missing, pending, paused, stale, out of bounds, or otherwise invalid.

The same-operation activation defense must be tested using a Tezos manager-operation batch that submits an oracle update and immediately attempts a price-dependent TezFin action. The action must not consume the newly accepted price.

## 14. Governance and administrative controls

### 14.1 Roles

| Role | Permitted actions | Prohibited actions |
| --- | --- | --- |
| Signer | Validate and sign approved payloads | Change policy, signer set, threshold, or contract state directly |
| Coordinator/relayer | Propose and submit signed payloads | Create signatures or weaken signer validation |
| Emergency guardian | Pause global or per-asset publication/consumption | Unpause, lower threshold, add signers, widen policy |
| Governance multisig | Schedule and execute reviewed configuration changes | Bypass configured delays or fabricate market observations |
| Deployment account | Originate and perform documented handoff | Retain production authority after handoff |

### 14.2 Delayed changes

The following are risk-increasing and require pending state, a visible delay, cancellation capability, and a configuration-version increment:

- reducing the total threshold or class minimum;
- adding, removing, or reclassifying a signer;
- widening source or price-deviation limits;
- reducing minimum source count, liquidity, TWAP, or activation delay;
- widening absolute price bounds;
- adding an alias or asset;
- unpausing an asset;
- replacing the policy hash; and
- changing canonical decimals or payload interpretation.

Emergency pausing and threshold increases may use an expedited path if the contract clearly restricts them to risk-reducing changes.

## 15. Monitoring and incident response

### 15.1 Independent observer

At least one monitor must recompute or independently source reference prices without relying on the coordinator's final result. It compares:

- local reference to proposed and accepted price;
- signer-class results and refusals;
- on-chain active and pending prices;
- observation age and publication cadence;
- DEX liquidity and cross-pool divergence;
- market utilization and caps; and
- oracle, signer, policy, pause, and admin changes.

### 15.2 Required alerts

Critical alerts include:

- missed publication or stale price;
- insufficient signer quorum;
- disagreement between validation classes;
- abnormal asset movement or absolute-bound approach;
- USDt, USDtz, or tzBTC depeg condition;
- low DEX liquidity or excessive quote impact;
- rejected on-chain update;
- RPC disagreement or reorganization;
- low relayer balance;
- signer-key, threshold, class, policy, alias, pause, or administrator change;
- failure of the independent observer; and
- active TezFin exposure approaching a configured cap while oracle health is degraded.

The dead-man switch must be outside the primary cloud account. Detailed alerts must use a second channel before production market caps are materially increased.

### 15.3 Runbooks

The operations package must include tested procedures for:

- global and per-asset pause;
- one signer compromise;
- validator-class disagreement;
- coordinator and relayer replacement;
- signing-key rotation;
- source outage and degraded mode;
- DynamoDB or TWAP-state loss;
- RPC outage or reorganization;
- restoring an asset after staleness;
- governance cancellation; and
- rollback to the prior TezFin oracle address without opening unsafe actions.

Restoration must never use an arbitrary manual price or refreshed timestamp as a shortcut.

## 16. Implementation stages and gates

### Stage 0: specification and feasibility

**Deliverables**

- Final asset-policy register.
- Exact source endpoints and timestamp semantics.
- Canonical payload type and golden vectors.
- Validator-class independence design.
- Threat-model review and engineering estimate.

**Gate**

No implementation proceeds with unresolved ambiguity about asset identity, decimals, observation time, signer independence, or USDtz/tzBTC policy.

### Stage 1: contract and deterministic test harness

**Deliverables**

- Threshold-capable Michelson oracle.
- Test-only one-signer configuration.
- Canonical packing library and golden vectors.
- Contract unit and property tests.
- TezFin wrapper compatibility tests.

**Gate**

The one-signer configuration is marked non-authoritative and cannot be selected by the mainnet activation workflow.

### Stage 2: validator class A and shadow publisher

**Deliverables**

- CEX and Tezos DEX adapters.
- Versioned policy engine.
- Exact arithmetic and TWAP state.
- Coordinator, relayer, evidence records, and monitoring.
- Testnet and mainnet shadow deployments.

**Gate**

No active TezFin market consumes this output. Source-loss, malformed-data, cold-start, replay, and monitoring tests pass.

### Stage 3: validator class B and production quorum

**Deliverables**

- Independent class-B validation implementation.
- Four isolated signer deployments.
- Three-of-four plus class-minimum enforcement.
- Compromise, outage, disagreement, and key-rotation tests.

**Gate**

The reviewer confirms class B does not reuse class A's critical acceptance implementation. One failed signer is tolerated. Two colluding signers cannot publish.

### Stage 4: final integration and shadow operation

**Deliverables**

- Final mainnet candidate contract and multisig handoff.
- TezFin integration against closed markets.
- Independent shadow comparison and public health evidence.
- Final operation-size, gas, fee, and latency measurements.

**Gate**

The exact frozen release configuration completes at least 30 consecutive days of shadow operation. Any code, signer, policy, source, asset mapping, or material configuration change restarts the relevant shadow-evidence period.

### Stage 5: independent audit and activation decision

**Deliverables**

- Frozen release commit and artifact hashes.
- Independent human audit.
- Remediation commits and auditor re-review.
- Final production-readiness report.
- Separate governance activation proposal.

**Gate**

No unresolved critical or high finding. No production activation is implied by completion of development or grant milestones.

## 17. Acceptance test specification

### 17.1 On-chain contract tests

| ID | Test | Required result |
| --- | --- | --- |
| C-01 | Submit with zero, one, or two valid signatures | Rejected without storage change |
| C-02 | Submit with three unique authorized signatures spanning both classes | Accepted when every other check passes |
| C-03 | Repeat one signer or signature to reach three entries | Duplicate does not count; submission rejected |
| C-04 | Submit three class-A signatures in a deliberately invalid test configuration | Class requirement prevents acceptance |
| C-05 | Tamper with price, asset, decimals, time, round, policy hash, chain ID, or contract address | Signature verification fails |
| C-06 | Replay an accepted round | Rejected without refreshing timestamps |
| C-07 | Submit a lower round after a higher round | Rejected |
| C-08 | Skip rounds after an outage | Newer valid round accepted |
| C-09 | Submit expired, not-yet-valid, future-observed, stale, zero-time, or regressing-time payload | Rejected |
| C-10 | Submit zero, out-of-range, wrong-decimal, duplicate-asset, unknown-asset, or incomplete-group entry | Rejected atomically |
| C-11 | Submit a valid core group while USDtz is unavailable | Core group updates successfully; USDtz remains unchanged and ages normally |
| C-12 | Submit a valid price while the asset or oracle is paused | Rejected or retained as non-active according to approved pause semantics |
| C-13 | Submit a movement above the automatic limit | Does not become active automatically |
| C-14 | Read a newly accepted price in the same level | Previous mature price is returned, or no active value if none existed |
| C-15 | Read after the activation delay | New value and original observation timestamp are returned |
| C-16 | Schedule a signer or threshold change and attempt early execution | Early execution rejected |
| C-17 | Activate a new configuration and replay signatures from the prior version | Rejected |
| C-18 | Attempt an impossible threshold, one-class quorum, zero delay, or signer count above the reviewed maximum | Configuration rejected |
| C-19 | Call compatibility view for every legacy identifier | Exactly one correct canonical asset and expected decimal format returned |
| C-20 | Call compatibility view with malformed or unknown identifier | Fails closed |

### 17.2 Source and arithmetic tests

| ID | Test | Required result |
| --- | --- | --- |
| P-01 | Coordinator supplies an arbitrary price and very large tolerance | Signers ignore request policy and refuse unless local fixed policy passes |
| P-02 | Request attempts to change sources, decimals, aggregation, age, liquidity, or TWAP window | Ignored and rejected as an unknown or forbidden override |
| P-03 | Source returns malformed JSON, wrong content type, oversized response, missing fields, or wrong market | Source rejected with stable error code |
| P-04 | Source returns `NaN`, infinity, exponent notation, unsafe integer, negative, or zero | Rejected before canonical arithmetic |
| P-05 | One of four CEX sources is unavailable | Valid median produced only if the approved independent minimum remains |
| P-06 | Two sources are unavailable | Asset fails closed when minimum quorum cannot be met |
| P-07 | One source is an extreme outlier | Median and deviation rules prevent it from controlling the result |
| P-08 | Healthy sources diverge beyond the policy limit | Asset fails closed and alert is emitted |
| P-09 | A derived route uses several endpoints from one venue | Counted as one independent venue observation |
| P-10 | A contributing observation is stale while later legs are fresh | Derived asset uses oldest time and fails if too old |
| P-11 | Fixed-point conversion hits rounding boundaries | Result matches committed golden vectors and documented rounding direction |
| P-12 | Loss and restart of TWAP state | USDtz and tzBTC fail closed until the full approved window is rebuilt |
| P-13 | Manipulate one DEX pool for one block | TWAP, liquidity, impact, and cross-pool controls prevent a valid manipulated result |
| P-14 | Pools diverge or one falls below minimum liquidity | Derived asset fails without blocking core group |
| P-15 | Reorganization removes TWAP observations or publication | State is reconciled before another round is treated as confirmed |

### 17.3 Threshold and infrastructure tests

| ID | Test | Required result |
| --- | --- | --- |
| S-01 | Compromise coordinator only | Cannot alter a signed batch or create a quorum |
| S-02 | Compromise one signer | False batch cannot reach threshold; honest updates remain possible |
| S-03 | Compromise two signers | False batch cannot reach three signatures |
| S-04 | Stop any one signer | Remaining three can publish and necessarily span both classes |
| S-05 | Class A accepts a crafted bad proposal while class B rejects | No production quorum is formed |
| S-06 | Class B accepts a crafted bad proposal while class A rejects | No production quorum is formed |
| S-07 | Stop coordinator after signatures are produced | Backup relayer submits identical payload successfully |
| S-08 | Relay identical payload twice | Only one acceptance; retry reconciles on-chain state |
| S-09 | Rotate one compromised signer through governance | Old key invalid after version activation; liveness restored |
| S-10 | Deploy a signer with wrong artifact or policy hash | Monitor and signer refuse production participation |
| S-11 | Primary Tezos RPC lies, stalls, or disagrees | Secondary RPC prevents false confirmation and raises alert |
| S-12 | Exhaust relayer XTZ balance | Alert occurs before inability to publish; backup funding procedure works |

### 17.4 TezFin integration tests

| ID | Test | Required result |
| --- | --- | --- |
| I-01 | Compile the exact oracle with the current TezFin wrapper | View types and asset mappings match without mock-only assumptions |
| I-02 | Publish every approved asset under expected decimals | Comptroller receives the intended USD price and observation timestamp |
| I-03 | Batch oracle acceptance followed immediately by borrow or collateral withdrawal | Newly accepted price is not usable in the same level |
| I-04 | Price is missing, pending, paused, stale, future, regressing, or outside consumer bounds | Relevant price-dependent action fails closed |
| I-05 | Oracle is stale during repayment | Repayment remains available |
| I-06 | USDtz path fails while XTZ is healthy | XTZ-dependent actions are not blocked solely by USDtz failure |
| I-07 | Market cap is reached during a healthy oracle period | Supply or borrow cannot exceed configured post-state cap |
| I-08 | Remove legacy override or switch upstream address | Exact governance operation is simulated and storage verified before execution |
| I-09 | Emergency pause is activated | New risk actions stop according to policy; recovery actions remain as approved |
| I-10 | Restore after incident | No action reopens until fresh mature prices and all required checks are present |

### 17.5 Monitoring and operations tests

| ID | Test | Required result |
| --- | --- | --- |
| O-01 | Disable scheduler | External dead-man alert fires within approved period |
| O-02 | Force signer-class disagreement | Critical alert includes asset, round, classes, and stable error code |
| O-03 | Publish a valid but unusual movement within signer policy | Independent monitor compares it and applies its separate alert policy |
| O-04 | Change signer, threshold, policy, pause, alias, or administrator | Immediate governance-security alert |
| O-05 | Fail primary alert channel | Secondary critical channel still delivers incident notice |
| O-06 | Restore DynamoDB or observation state from backup | No old observation becomes fresh; TWAP cold-start rule remains enforced |
| O-07 | Inspect logs after success and failure tests | Required evidence exists; no secrets or credentials are present |
| O-08 | Execute emergency pause and key-rotation runbooks | Operators complete steps from documented commands and verify final chain state |

## 18. Required engineering deliverables

### 18.1 Source code

- Michelson oracle source and compile target.
- Independent class-A and class-B validator implementations.
- Source adapters, exact arithmetic, TWAP, policy, signing, coordinator, relayer, monitor, and evidence modules.
- Infrastructure-as-code for every signing domain and shared non-authoritative components.
- TezFin integration and deployment changes.

### 18.2 Tests

- SmartPy contract tests.
- Canonical payload golden vectors.
- Unit, property, fuzz, integration, and failure-injection tests.
- Maximum signer-count operation-size and fee tests.
- Tests against the real TezFin wrapper and Comptroller path.

### 18.3 Documentation

- Asset-policy register with approved production values.
- Trust-boundary and data-flow documentation.
- Signer-class independence explanation.
- Key creation, custody, rotation, and revocation procedure.
- Deployment, multisig handoff, pause, recovery, and rollback runbooks.
- Public integration guide and compatibility mapping.
- Monitoring dashboard and alert routing guide.

### 18.4 Release evidence

- Frozen commit and dependency lockfiles.
- Reproducible compiled hashes.
- Exact deployed code and initial storage comparison.
- Signer public keys, classes, threshold, and configuration version.
- Policy and software artifact hashes.
- Mainnet shadow metrics and exception log.
- Test reports, operation cost measurements, and audit report.
- Written resolution of every audit finding.

## 19. Review and remediation workflow

1. TezFin approves this specification and the asset-policy assumptions.
2. The implementation team provides an estimate and records every requested deviation before coding.
3. The implementation team builds in small reviewable milestones.
4. An adversarial reviewer reviews each milestone and adds independent tests.
5. The implementation team implements or explicitly approves remediation so it retains operational ownership.
6. The adversarial reviewer rechecks each remediation.
7. A separate human security auditor reviews the frozen production candidate.
8. Any post-audit code or configuration change is submitted for targeted re-review.
9. TezFin governance makes a separate production-activation decision.

The implementation team must not describe its own implementation review as the final independent audit. Likewise, passing tests does not replace review of the source policy, cloud isolation, key custody, or operational procedures.

## 20. Production release checklist

- [ ] Final three-of-four signer set is active.
- [ ] Two class-A and two class-B signers are verified in separate administrative domains.
- [ ] Every valid quorum must contain both classes.
- [ ] Mainnet candidate never operated authoritatively as one-of-one.
- [ ] Canonical payload and golden vectors match every signer and the contract.
- [ ] No requester-controlled price or weakening parameter exists.
- [ ] Observation timestamps, not inclusion timestamps, are exposed to TezFin.
- [ ] Non-zero activation delay prevents same-level consumption.
- [ ] Core, USDtz, and tzBTC publication groups are isolated.
- [ ] USDtz and tzBTC market roles have explicit risk approval.
- [ ] All production parameters are explicit and contain no placeholders.
- [ ] Multisig and emergency guardian permissions are verified.
- [ ] Deployment wallet retains no authority.
- [ ] Independent monitoring and two critical alert paths are operational.
- [ ] Thirty consecutive days of final-configuration shadow evidence are complete.
- [ ] All mandatory acceptance tests pass on the frozen commit.
- [ ] No unresolved critical or high audit findings remain.
- [ ] Exact contract, storage, policy, signer, and artifact hashes are archived.
- [ ] TezFin market caps and pause states remain conservative at activation.
- [ ] Production activation has separate governance approval.

## 21. Parameter approval register

The implementation shall provide a machine-readable and human-readable register for every production parameter. No value is approved merely because it appears in example code.

| Parameter family | Required per asset or system |
| --- | --- |
| Source policy | Venue allowlist, market path, minimum sources, source age, source deviation |
| Arithmetic | Canonical decimals, rounding direction, overflow bounds |
| Signer policy | Proposal deviation, class, software hash, policy hash |
| DEX policy | Pool addresses, token identities, quote size, minimum liquidity, maximum impact, TWAP window, cross-pool deviation |
| Time policy | Round duration, validity window, observation age, clock skew, activation delay, confirmation depth |
| On-chain price policy | Absolute min/max, automatic movement limit, exceptional-state behavior |
| Quorum | Signer keys, classes, total threshold, class minima, maximum signer count |
| Governance | Administrator, guardian, delays, cancellation authority |
| Monitoring | Cadence, alert thresholds, dead-man grace period, escalation recipients |
| TezFin risk | Market caps, collateral factors, action pause states, activation order |

Every approved register revision receives a configuration version and policy hash. Production signers and the contract must reject any mismatch.

## 22. References

1. TezFin repository, `origin/main` commit `83b4e486d6725a836609d9c52c927be3c66a6f05`, reviewed 11 August 2026.
2. `OracleCexOnlyPlan.md`, developer CEX-only implementation proposal.
3. `OraclePlan.md`, earlier Acurast-dependent implementation proposal.
4. `TEZFIN_RESILIENT_ORACLE_GRANT_DRAFT_2026_07_24.md`, staged funding and roadmap draft.
5. `Youves_Acelon_Oracle_Manipulation_Root_Cause_Report_2026-07-22.docx`, technical root-cause assessment.
6. TezFin V3.1 security and deployment review records in `docs/reports`.

## Engineering response requested

Before implementation begins, the engineering team should return:

| Item | Required response |
| --- | --- |
| 1 | Confirmation that the specification is understood |
| 2 | Requirement-by-requirement list of accepted items and proposed deviations |
| 3 | Technical design for the two independent validator classes |
| 4 | Proposed canonical payload type and packing test vectors |
| 5 | Implementation estimate by stage |
| 6 | Operating-cost estimate for four isolated signing domains, relayers, monitoring, and chain fees |
| 7 | Any requirement believed infeasible under current Tezos, SmartPy, or operation-size limits, supported by a reproducible test |

No silent deviation is permitted. A deviation is accepted only after written risk review.

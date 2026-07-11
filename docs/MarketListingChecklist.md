# Market listing checklist

## Exact-transfer requirement

TezFin's FA1.2 and FA2 markets update `currentCash` by the requested transfer
amount. A listed underlying must therefore have **exact-transfer semantics**:
a successful transfer of `N` units to a market must increase that market's
balance by exactly `N` units.

Do not list a token that charges transfer fees, rebases during a transfer,
credits a different amount through a callback, or otherwise mutates the
market's balance as a side effect of transfer. Those tokens require a future
market implementation that uses measured balance deltas instead of requested
amounts.

## Required approval record

Before `supportMarket` is run, governance must record the following in the
deployment review:

- exact token contract address and token ID (for FA2);
- source-code or audited-contract revision reviewed;
- a successful-transfer test showing sender debit and market credit are both
  exactly the requested amount;
- confirmation that no transfer fee, transfer-time rebase, callback balance
  mutation, or upgrade path can change that behaviour; and
- inclusion of the asset in `postdeploy/config/config.json`'s
  `exactTransferUnderlyings` allowlist.

The post-deployment script refuses to list an asset missing from that
allowlist. The allowlist is a deployment safeguard, not a substitute for the
contract review above.

## Current post-deployment underlyings

The checked-in post-deployment configuration lists only these underlyings:

| Asset | Underlying type | Exact-transfer status |
| --- | --- | --- |
| XTZ | Native tez | Exact by protocol: the attached mutez amount is the market credit. |
| USD | Project FA1.2 test underlying | Confirmed by the project reference FA1.2 transfer implementation: it debits and credits the requested amount with no fee or rebase. |
| USDT | Project FA2 test underlying, token ID 0 | Confirmed by the project reference FA2 transfer implementation: it debits and credits the requested amount with no fee or rebase. |
| TZBTC | Project FA1.2 test underlying | Confirmed by the project reference FA1.2 transfer implementation: it debits and credits the requested amount with no fee or rebase. |

This confirmation applies to the project-managed contracts selected by the
checked-in post-deployment configuration. A production deployment must repeat
the approval record for its exact addresses; in particular, assets such as
stXTZ are not approved by this checklist and must not be listed through this
cash-accounting path without a fresh review.

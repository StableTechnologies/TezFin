# Pyth Per-Feed Confidence/Price Ratio Measurement

## Status: NOT YET MEASURED (explicit blocker, not PASS)

No empirical `conf / abs(price)` samples have been collected for BTC/USD,
XTZ/USD, or USDT/USD yet. The proposed limits in README ("Pyth confidence and
proxy risk policy": BTC=25bps, XTZ=50bps, USDT=10bps) remain **starting
policy values pending this measurement**, not values justified by data. This
report must not be treated as satisfying that requirement until real samples are
collected and analyzed below.

This mirrors the non-fabrication policy for real Pyth update evidence:
absence of a healthy/available measurement window is recorded as a blocker,
not papered over with assumed numbers.

## Tooling

`deploy/deploy_script/measure_pyth_confidence.js` provides a read-only
measurement tool and does not need `TEZOS_PRIVATE_KEY`. The authoritative mode
for this requirement reads the actual on-chain Pyth Core cache, so it covers
BTC/USD, XTZ/USD, and USDT/USD without depending on Hermes feed access:

```sh
PYTH_EVM_RPC=https://node.mainnet.etherlink.com \
  node deploy/deploy_script/measure_pyth_confidence.js collect-onchain

node deploy/deploy_script/measure_pyth_confidence.js report \
  --source onchain --bps 25,50,100 \
  --period "2026-XX-XX .. 2026-XX-XX (on-chain normal)"
```

The same tool also supports Hermes collection as an optional supplementary
source when an API key and access to the required feeds are available:

```sh
# Run repeatedly (e.g. a cron/systemd timer) over the required 24-72h normal
# period, and again during any observed high-volatility/stressed period.
PYTH_API_KEY=... node deploy/deploy_script/measure_pyth_confidence.js collect

# Summarize whatever has been collected so far into the required table:
node deploy/deploy_script/measure_pyth_confidence.js report --bps 25,50,100 \
  --period "2026-XX-XX .. 2026-XX-XX (normal)"
```

On-chain samples are appended to per-feed CSV logs under
`TezFinBuild/pyth_onchain_samples/`; Hermes samples use
`TezFinBuild/pyth_confidence_samples/`. Both use
`iso_timestamp, unix_timestamp,
price, conf, expo, publish_time, ratio`). `report` computes p50/p95/p99/max
ratio and rejection counts for one or more candidate bps policies directly
from those logs.

### Optional Hermes source

The Pyth Core upgrade completed 2026-08-26 made a Pyth API key
(`Authorization: Bearer $PYTH_API_KEY`) mandatory for every Hermes request,
including the legacy `hermes.pyth.network` host used by this tool by default
(override with `HERMES_BASE_URL=https://pyth.dourolabs.app/hermes` for the
upgraded endpoint). This is an **off-chain measurement tooling** dependency
only:

- the on-chain Pyth Core contract ABI and `getPriceNoOlderThan` interface are
  unchanged by this upgrade, so `contracts/TezFinOracle.py` needs no code
  change;
- but any operational Pyth updater/Price Pusher this project runs or relies
  on the selected production monitoring plan will also need a Pyth API key
  going forward if it calls Hermes
  directly -- flagged here for awareness, not addressed by this change.

## Required Output (to fill in once samples exist)

```text
feed, period, samples, p50_ratio, p95_ratio, p99_ratio, max_ratio,
rejections_at_proposed_limit, additional_unavailability
```

| feed | period | samples | p50_ratio | p95_ratio | p99_ratio | max_ratio | rejections @ proposed limit | additional unavailability |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| BTC/USD | _not yet measured_ | 0 | — | — | — | — | — | — |
| XTZ/USD | _not yet measured_ | 0 | — | — | — | — | — | — |
| USDT/USD | _not yet measured_ | 0 | — | — | — | — | — | — |

"additional unavailability" is the extra stale/unavailable time a confidence
rejection would add on top of freshness-only downtime, i.e. samples where the
publish time was fresh enough but the confidence ratio still exceeded the
candidate limit.

## Acceptance

This report satisfies ТЗ section 2's empirical-measurement requirement only
once:

- [ ] normal-period samples exist for all three feeds (preferably 24-72h);
- [ ] stressed/high-volatility-period samples exist for all three feeds;
- [ ] the table above is filled in with real p50/p95/p99/max ratios per feed;
- [ ] rejection counts at 25/50/100 bps (or other candidate policies) are
      reported per feed;
- [ ] any change to the proposed limits based on this data is proposed
      separately and reviewed, not silently folded into this report.

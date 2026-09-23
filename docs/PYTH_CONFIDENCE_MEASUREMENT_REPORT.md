# Pyth Per-Feed Confidence/Price Ratio Measurement

## Status: NORMAL-PERIOD MEASUREMENT COMPLETE; STRESSED-PERIOD PENDING

A 24-hour on-chain normal-period measurement has been collected and analyzed
for BTC/USD, XTZ/USD, and USDT/USD (see "Results" below). No separate
stressed/high-volatility-period run has been performed yet. The proposed
limits in README ("Pyth confidence and proxy risk policy": BTC=25bps,
XTZ=50bps, USDT=10bps) remain **starting policy values pending governance
review of this data**, not automatically approved production limits.

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

## Required Output (normal period, 24h, on-chain)

Source: `collect-onchain` against Etherlink Mainnet Pyth Core
(`0x2880aB155794e7179c9eE2e38200202908C17B43`), one sample per feed per
minute for 24 hours (1,440 samples per feed).

```text
feed, period, samples, p50_ratio, p95_ratio, p99_ratio, max_ratio,
rejections_at_proposed_limit, additional_unavailability
```

| feed | period | samples | p50_ratio | p95_ratio | p99_ratio | max_ratio | rejections @ proposed limit | additional unavailability |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| BTC/USD | 24h normal | 1,440 | 1.45 bps | 2.36 bps | 2.81 bps | 4.83 bps | 0 (max is 19.3% of the 25 bps limit) | 0s |
| XTZ/USD | 24h normal | 1,440 | 2.92 bps | 4.94 bps | 5.72 bps | 9.07 bps | 0 (max is 18.1% of the 50 bps limit) | 0s |
| USDT/USD | 24h normal | 1,440 | 0.77 bps | 1.44 bps | 1.79 bps | 3.40 bps | 0 (max is 34.0% of the 10 bps limit) | 0s |

"additional unavailability" is the extra stale/unavailable time a confidence
rejection would add on top of freshness-only downtime, i.e. samples where the
publish time was fresh enough but the confidence ratio still exceeded the
candidate limit. Across this run, no sample's confidence ratio exceeded its
feed's proposed limit, so the proposed limits added zero additional
unavailability beyond the freshness-only figures below.

Each feed had 1,440 raw on-chain samples but fewer unique Pyth quotes (i.e. a
same `publish_time` was observed by more than one consecutive poll), which
must not be conflated with 1,440 independent updater updates:

| feed | observations | unique `publish_time` | repeated-neighbor observations |
|---|---:|---:|---:|
| BTC/USD | 1,440 | 1,018 | 422 |
| XTZ/USD | 1,440 | 1,020 | 420 |
| USDT/USD | 1,440 | 1,020 | 420 |

About 29% of observations repeated the previous `publish_time`: polling
occurred roughly once per minute, but the underlying Pyth quote updated less
often.

## Freshness / System Availability (same 24h run)

| freshness threshold | fresh samples | stale samples | time-weighted system uptime |
|---:|---:|---:|---:|
| 60s | 1,009 | 431 | 38.908% |
| 180s | 1,377 | 63 | 92.813% |
| 300s | 1,426 | 14 | 98.457% |
| 600s | 1,438 | 1 | 99.869% |

Additional observations for this run: 16 stale episodes; the longest stale
episode lasted 413 seconds; total system stale downtime was 22 minutes 12
seconds. "System" here means all three required feeds simultaneously fresh;
see the updater-availability report for the underlying methodology.

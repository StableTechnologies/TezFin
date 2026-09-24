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

## Dataset Provenance

The raw observations are committed at `TezFinBuild/pyth_onchain_samples/`.
The initial collector logs were added in tooling commit
[`01a5e7ad28255b353dcb36dc0218f6c3d379b0e5`](https://github.com/AK-APRIORIT/TezFin/commit/01a5e7ad28255b353dcb36dc0218f6c3d379b0e5); the current 1,440-row CSV files are identified by these checksums:

| File | SHA-256 |
|---|---|
| `BTC_USD.csv` | `08b9c74b095e3ef125a672ad345aefd7f1011f0051e28af76d4abc72c6b3b726` |
| `XTZ_USD.csv` | `06e0eb03873b8527c1fb9d6f760129d80f6f5c36925289f4a052148acfac3efc` |
| `USDT_USD.csv` | `b5a3e01f755be5df2c0e00ee2def4384097d74bd7b00441a1a18dcac6d562eca` |

- Source: on-chain `getPriceUnsafe(bytes32)` observations, collected by `collect-onchain`.
- RPC: `https://node.mainnet.etherlink.com`.
- Pyth Core: `0x2880aB155794e7179c9eE2e38200202908C17B43`.
- BTC/USD feed ID: `e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`.
- XTZ/USD feed ID: `0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03`.
- USDT/USD feed ID: `2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b`.
- Common observation window: `2026-09-21T10:16:59Z` through `2026-09-22T10:16:01Z` (23h 59m 02s).
- Each CSV contains exactly 1,440 successful observations; the raw files are the authoritative sample set for the report below.

Reproduce the report from the repository root:

```sh
node deploy/deploy_script/measure_pyth_confidence.js report \
  --source onchain \
  --out-dir TezFinBuild/pyth_onchain_samples \
  --bps 25,50,10 \
  --thresholds 60,180,300,600 \
  --period "2026-09-21T10:16:59Z .. 2026-09-22T10:16:01Z"
```

## Confidence Results

Ratios are reported in basis points (`conf / abs(price) * 10,000`). Percentiles
use the deterministic order statistic at `floor(q * n)` in the sorted sample
array. Rejection counts use the strict condition `ratio_bps > limit_bps`.

| Feed | Observations | Successful | Failed | Unique `publish_time` | Repeated successful neighbors | p50 | p95 | p99 | Max | Rejections at proposed limit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| BTC/USD | 1,440 | 1,440 | 0 | 1,018 | 422 | 1.45 bps | 2.36 bps | 2.81 bps | 4.83 bps | 0 @ 25 bps |
| XTZ/USD | 1,440 | 1,440 | 0 | 1,020 | 420 | 2.92 bps | 4.94 bps | 5.72 bps | 9.07 bps | 0 @ 50 bps |
| USDT/USD | 1,440 | 1,440 | 0 | 1,020 | 420 | 0.77 bps | 1.44 bps | 1.80 bps | 3.40 bps | 0 @ 10 bps |

No successful observation exceeded its feed's proposed limit. The proposed
limits therefore add zero confidence-based rejections in this dataset.

## Freshness and Availability

Per-feed observation freshness is evaluated at each successful poll timestamp
using `0 <= observed_at - publish_time <= threshold`. Failed polls are counted
separately and do not refresh the last successful quote; quote freshness
continues to be determined by that quote's `publish_time`. System availability
is time-integrated over the common first/last observation window: all three
latest successful quotes must remain within the threshold at the same instant.
Stale episodes are contiguous system unavailable intervals.

| Feed | Threshold | Fresh successful observations | Stale successful observations |
|---|---:|---:|---:|
| BTC/USD | 60s | 1,011 | 429 |
| BTC/USD | 180s | 1,377 | 63 |
| BTC/USD | 300s | 1,426 | 14 |
| BTC/USD | 600s | 1,439 | 1 |
| XTZ/USD | 60s | 1,011 | 429 |
| XTZ/USD | 180s | 1,377 | 63 |
| XTZ/USD | 300s | 1,426 | 14 |
| XTZ/USD | 600s | 1,439 | 1 |
| USDT/USD | 60s | 1,013 | 427 |
| USDT/USD | 180s | 1,377 | 63 |
| USDT/USD | 300s | 1,426 | 14 |
| USDT/USD | 600s | 1,439 | 1 |

| Threshold | System uptime | Fresh seconds | Stale seconds | Stale episodes | Longest stale episode |
|---:|---:|---:|---:|---:|---:|
| 60s | 38.908% | 33,594 | 52,748 | 998 | 653s |
| 180s | 92.813% | 80,137 | 6,205 | 87 | 533s |
| 300s | 98.457% | 85,010 | 1,332 | 16 | 413s |
| 600s | 99.869% | 86,229 | 113 | 1 | 113s |

At the 300s freshness threshold, the system recorded 16 stale episodes and
1,332 seconds of total stale downtime (22 minutes 12 seconds). At 60s, the
corresponding result is 998 episodes and 52,748 seconds of downtime; the 22:12
figure does not apply to that threshold.

These results replace the previously reported availability figures, which were
not reproducible from the committed raw sample set. The stressed/high-volatility
measurement period remains pending; these normal-period observations do not
approve the proposed limits for production.

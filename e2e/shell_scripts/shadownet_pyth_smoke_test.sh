#!/usr/bin/env bash
set -euo pipefail
# Shadownet Pyth/NAC end-to-end smoke test for TezFinOracle (feat/l2_tezoracle).
#
# Runs the full staged sequence documented in README.md ("Pyth / NAC Staged Activation
#
#   1. SmartPy oracle test suite (sandbox regression)
#   2. Production compile (with the shadownet manifest)
#   3. Origination operation-size guard
#   4. Deterministic Pyth ABI decode/normalize fixtures
#   5. Redeploy TezFinOracle to Shadownet (only if REDEPLOY=1; otherwise assumes the
#      manifest's existing TezFinOracle address already has the latest code)
#   6. Admin config: setPythCore -> setPythMaxAge -> setFeedIds -> configurePriceBounds
#      -> configureMaxPriceAge (configure_pyth_oracle.js)
#   7. Read-only live verification: getPrice / get_price_with_timestamp /
#      getValidatedPrice for native + proxy + alias assets (verify_shadownet_pyth_oracle.js)
#
# Requirements (NOT provided by this script, must be set up by whoever runs it):
#   - `smartpy` arg: path to SmartPy.sh
#   - TEZOS_PRIVATE_KEY (or TEZOS_MNEMONIC / fundraiser vars, see deploy/deploy_script/util.js)
#     exported in the shell environment for the Shadownet admin account -- steps 5 and 6
#     sign and inject real transactions and will fail without a funded account.
#   - Network access to the Shadownet Michelson RPC (network/chainId are read from the
#     manifest / deploy/deploy_script/config.json, not hardcoded here).
#
# Usage:
#   REDEPLOY=1 DEPLOY_MANIFEST=TezFinBuild/deploy_result/deploy.shadownet.json \
#     ./e2e/shell_scripts/shadownet_pyth_smoke_test.sh ~/smartpy-cli/SmartPy.sh
#
# Steps 1-4 need no secrets/network write access and can always run safely. Steps 5-7 are
# skipped with a clear message if TEZOS_PRIVATE_KEY (or another initAccount() credential)
# is not set, so this script is also safe to run as a local pre-flight check.

smartpy="${1:?Usage: $0 /path/to/SmartPy.sh}"
manifest="${DEPLOY_MANIFEST:?Set DEPLOY_MANIFEST to e.g. TezFinBuild/deploy_result/deploy.shadownet.json}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

echo "== 1/7: SmartPy oracle test suite =="
"$smartpy" test contracts/tests/TezFinOracleTest.py /tmp/tezfin_oracle_tests --purge

echo "== 2/7: Production compile (shadownet manifest) =="
DEPLOY_MANIFEST="$manifest" "$smartpy" compile deploy/compile_targets/CompileTezFinOracle.py \
  /tmp/tezfin_oracle_compiled --purge --protocol kathmandu

echo "== 3/7: Origination operation-size guard =="
python3 deploy/compile_targets/tests/test_operation_size.py "$smartpy"

echo "== 4/7: Deterministic Pyth ABI fixtures =="
python3 contracts/tests/fixtures/pyth_abi_fixtures_test.py

if [[ -z "${TEZOS_PRIVATE_KEY:-}${TEZOS_MNEMONIC:-}" ]]; then
  echo "== 5-7/7: SKIPPED (no TEZOS_PRIVATE_KEY/TEZOS_MNEMONIC in the environment) =="
  echo "Set a Shadownet admin credential and re-run to redeploy/configure/verify live."
  exit 0
fi

if [[ "${REDEPLOY:-0}" == "1" ]]; then
  echo "== 5/7: Redeploying TezFinOracle to Shadownet =="
  (cd deploy/deploy_script && npm ci && DEPLOY_MANIFEST="$repo_root/$manifest" node deploy.js)
else
  echo "== 5/7: SKIPPED (set REDEPLOY=1 to originate a fresh TezFinOracle first) =="
fi

echo "== 6/7: Admin Pyth/NAC configuration (setPythCore -> setPythMaxAge -> setFeedIds -> configurePriceBounds -> configureMaxPriceAge) =="
(cd deploy/deploy_script && DEPLOY_MANIFEST="$repo_root/$manifest" node configure_pyth_oracle.js)

echo "== 7/7: Live read-only verification (native feeds, proxies, aliases, getValidatedPrice) =="
(cd deploy/deploy_script && DEPLOY_MANIFEST="$repo_root/$manifest" node verify_shadownet_pyth_oracle.js)

echo "Shadownet Pyth/NAC smoke test complete."

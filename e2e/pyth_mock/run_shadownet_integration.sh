#!/usr/bin/env bash
set -euo pipefail

# Opt-in only: deploys the test-only EVM mock and points a temporary copy of the
# Shadownet manifest at it. The checked-in manifest is never modified.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

if [[ "${ALLOW_SHADOWNET_MOCK:-0}" != "1" ]]; then
  echo "Set ALLOW_SHADOWNET_MOCK=1 to enable test-only Shadownet deployment." >&2
  exit 2
fi
if [[ "${EVM_PRIVATE_KEY:-}" == "" || "${TEZOS_PRIVATE_KEY:-}${TEZOS_MNEMONIC:-}" == "" ]]; then
  echo "EVM_PRIVATE_KEY and a Tezos credential are required in the environment." >&2
  exit 2
fi

evm_rpc="${EVM_RPC:-https://node.shadownet.etherlink.com}"
tezos_rpc="${TEZOS_RPC:-https://michelson.etherlink.shadownet.octez.io}"
if [[ "$evm_rpc" != "https://node.shadownet.etherlink.com" || "$tezos_rpc" != "https://michelson.etherlink.shadownet.octez.io" ]]; then
  echo "This runner only permits the documented Shadownet RPCs." >&2
  exit 2
fi
configured_tezos_rpc="$(node -e "process.stdout.write(require('./deploy/deploy_script/config.json').tezosNode)")"
if [[ "$configured_tezos_rpc" != "$tezos_rpc" ]]; then
  echo "deploy_script/config.json must target the documented Shadownet Michelson RPC." >&2
  exit 2
fi

manifest="${DEPLOY_MANIFEST:-TezFinBuild/deploy_result/deploy.shadownet.json}"
manifest="$(cd "$(dirname "$manifest")" && pwd)/$(basename "$manifest")"
if [[ ! -f "$manifest" ]]; then
  echo "Shadownet manifest not found: $manifest" >&2
  exit 2
fi

tmp_manifest="$(mktemp "${TMPDIR:-/tmp}/tezfin-pyth-mock-manifest.XXXXXX.json")"
trap 'rm -f "$tmp_manifest"' EXIT

echo "Deploying test-only PythMock to Shadownet EVM..."
mock_address="$(cd e2e/pyth_mock && forge create src/PythMock.sol:PythMock \
  --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" --broadcast --json | jq -r '.deployedTo')"
if [[ ! "$mock_address" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
  echo "Could not parse the deployed mock address." >&2
  exit 1
fi
echo "[INFO] Deployed PythMock: $mock_address"
mock_address="$(printf '%s' "$mock_address" | tr '[:upper:]' '[:lower:]')"
echo "[INFO] Using lowercase EVM address for Michelson NAC: $mock_address"

btc_id=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
xtz_id=0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03
usdt_id=0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b

jq --arg pyth "$mock_address" --arg oracle "${TEZFIN_ORACLE_ADDRESS:-}" \
  '.PythCore = $pyth | if $oracle != "" then .TezFinOracle = $oracle else . end' \
  "$manifest" >"$tmp_manifest"
echo "Configuring TezFinOracle ${TEZFIN_ORACLE_ADDRESS:-$(jq -r .TezFinOracle "$manifest")} against temporary mock manifest..."
DEPLOY_MANIFEST="$tmp_manifest" node deploy/deploy_script/configure_pyth_oracle.js

# Configure transactions can take longer than the 60-second oracle window. Write
# valid fixture timestamps only after configuration, immediately before verification.
now="$(cast block latest --rpc-url "$evm_rpc" --field timestamp)"
btc_conf="${MOCK_BTC_CONF:-1000000}"
cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 6000000000 "$btc_conf" -2 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$xtz_id" 850000 200 -6 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$usdt_id" 100010000 5000 -8 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null

echo "[INFO] Verifying mock state directly through EVM eth_call..."
btc_response="$(cast call "$mock_address" \
  'getPriceNoOlderThan(bytes32,uint256)(int64,uint64,int32,uint256)' \
  "$btc_id" 60 --rpc-url "$evm_rpc")"
printf '%s\n' "$btc_response"
if ! grep -Eq '(^|[^0-9])6000000000([^0-9]|$)' <<<"$btc_response" || \
  ! grep -Eq '(^|[^0-9])-2([^0-9]|$)' <<<"$btc_response"; then
  echo "EVM mock returned unexpected BTC price/exponent; stopping before Michelson verification." >&2
  exit 1
fi

DEPLOY_MANIFEST="$tmp_manifest" node deploy/deploy_script/verify_shadownet_pyth_oracle.js

case_view() {
  local case_name="$1"
  local asset="$2"
  local expected_error="${3:-}"
  PYTH_CASE="$case_name" PYTH_ASSET="$asset" PYTH_EXPECTED_ERROR="$expected_error" \
    DEPLOY_MANIFEST="$tmp_manifest" node e2e/pyth_mock/verify_shadownet_case.js
}

cast send "$mock_address" 'setIgnoreAgeCheck(bool)' true --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null

echo "== Additional live validation cases =="
cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 0 0 -2 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "valid -> invalid" BTC-USD NON_POSITIVE_PYTH_PRICE

cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 6000000000 "$btc_conf" -2 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "invalid -> valid" BTC-USD

cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 0 0 -6 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "zero price" BTC-USD NON_POSITIVE_PYTH_PRICE

cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" -42 1 -2 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "negative price" BTC-USD NON_POSITIVE_PYTH_PRICE

cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 42 1 1 "$((now - 5))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "invalid exponent" BTC-USD INVALID_PYTH_EXPONENT

cast send "$mock_address" 'setRevert(bool)' true --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
case_view "simulated revert" BTC-USD PYTH_STATICCALL_FAILED
cast send "$mock_address" 'setRevert(bool)' false --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null

case_view "unknown feed" ETH-USD UNSUPPORTED_PYTH_ASSET

cast send "$mock_address" 'setIgnoreAgeCheck(bool)' true --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 6000000000 1000000 -2 "$((now - 600))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
if DEPLOY_MANIFEST="$tmp_manifest" node deploy/deploy_script/verify_shadownet_pyth_oracle.js; then
  echo "Expected stale-price verification to fail closed, but it passed." >&2
  exit 1
fi

cast send "$mock_address" 'setPrice(bytes32,int64,uint64,int32,uint256)' "$btc_id" 6000000000 1000000 -2 "$((now + 600))" --rpc-url "$evm_rpc" --private-key "$EVM_PRIVATE_KEY" >/dev/null
if DEPLOY_MANIFEST="$tmp_manifest" node deploy/deploy_script/verify_shadownet_pyth_oracle.js; then
  echo "Expected future-price verification to fail closed, but it passed." >&2
  exit 1
fi

echo "Shadownet mock NAC integration passed: valid, stale, and future paths fail as expected."
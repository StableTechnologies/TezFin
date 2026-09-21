#!/usr/bin/env python3
"""
Deterministic ABI-decode/normalization fixtures for TezFinOracle's Pyth NAC lookup.

This mirrors (in plain Python, not SmartPy) the exact field-specific decode/
validate/normalize logic implemented in `TezFinOracle.py`.
inside contracts/TezFinOracle.py. It exists because:

  - The SmartPy sandbox has no Etherlink NAC gateway / Pyth Core contract to call, so
    `sp.view("staticcall_evm", ...)` can only be exercised up to "the call is attempted
    and fails" (see contracts/tests/TezFinOracleTest.py) -- it can't feed a mocked
    128-byte Pyth ABI response through the real decode path in-sandbox.
  - Real end-to-end decode/normalize verification therefore requires either a live
    Shadownet smoke test or this
    standalone fixture harness that replicates the exact bit-level rules by hand.

Run: python3 contracts/tests/fixtures/pyth_abi_fixtures_test.py
Exit code is non-zero if any fixture's expected outcome doesn't match.

This file deliberately lives under contracts/tests/fixtures/ rather than directly in
contracts/tests/ so contracts/tests/run_tests.sh's `./contracts/tests/*.py` glob (which
assumes every top-level file is a SmartPy script and runs `SmartPy.sh test` on it) does
not pick it up.

If the real Michelson decode logic in TezFinOracle.py changes, this file's
`decode_unsigned_word` / `decode_signed_word` / `resolve_price` helpers MUST be
updated in lockstep, since they are a hand-maintained mirror, not a shared import.
"""

import sys

WORD_LEN = 32
TWO_POW_256 = 2 ** 256
TWO_POW_32 = 2 ** 32
MAX_TARGET_DECIMALS = 30
BPS_DENOMINATOR = 10_000
# Proposed TezFin per-feed confidence limits (basis points); see README "Pyth confidence
# and proxy risk policy" -- starting policy values, not Pyth-prescribed, pending approval.
BTC_MAX_CONFIDENCE_BPS = 25
XTZ_MAX_CONFIDENCE_BPS = 50
USDT_MAX_CONFIDENCE_BPS = 10


class PythFixtureError(Exception):
    """Represents a `sp.verify(...)` failure message from the mirrored contract logic."""


def encode_uint_word(value: int) -> bytes:
    if value < 0 or value >= TWO_POW_256:
        raise ValueError("uint256 word out of range")
    return value.to_bytes(WORD_LEN, "big", signed=False)


def encode_int_word(value: int) -> bytes:
    if value < -(2 ** 255) or value >= 2 ** 255:
        raise ValueError("int256 word out of range")
    return value.to_bytes(WORD_LEN, "big", signed=True)


def decode_unsigned_word(word: bytes) -> int:
    if len(word) != WORD_LEN:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    return int.from_bytes(word, "big", signed=False)


def decode_signed_word(word: bytes) -> int:
    if len(word) != WORD_LEN:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    unsigned_value = decode_unsigned_word(word)
    if word[0] >= 128:
        return unsigned_value - TWO_POW_256
    return unsigned_value


def decode_positive_price_word(word: bytes) -> int:
    if len(word) != WORD_LEN:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    sign_byte = word[24]
    expected_padding = 0xFF if sign_byte >= 128 else 0x00
    for i in range(24):
        if word[i] != expected_padding:
            raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    value = int.from_bytes(word[24:], "big", signed=False)
    if sign_byte >= 128 or value <= 0:
        raise PythFixtureError("NON_POSITIVE_PYTH_PRICE")
    return value


def decode_confidence_word(word: bytes) -> int:
    if len(word) != WORD_LEN:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    for i in range(24):
        if word[i] != 0x00:
            raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    return int.from_bytes(word[24:], "big", signed=False)


def decode_exponent_word(word: bytes) -> int:
    if len(word) != WORD_LEN:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    sign_byte = word[28]
    expected_padding = 0xFF if sign_byte >= 128 else 0x00
    for i in range(28):
        if word[i] != expected_padding:
            raise PythFixtureError("MALFORMED_PYTH_RESPONSE")
    unsigned_value = int.from_bytes(word[28:], "big", signed=False)
    if sign_byte >= 128:
        return unsigned_value - TWO_POW_32
    return unsigned_value


def build_response(price: int, conf: int, expo: int, publish_time: int) -> bytes:
    """Builds a 128-byte ABI-encoded Pyth Price response, matching pyth-sdk-solidity's
    (int64 price, uint64 conf, int32 expo, uint256 publishTime), right-aligned/sign-extended
    into four 32-byte words -- exactly what `staticcall_evm` would return."""
    return (
        encode_int_word(price)
        + encode_uint_word(conf)
        + encode_int_word(expo)
        + encode_uint_word(publish_time)
    )


def resolve_price(response: bytes, target_decimals: int, max_confidence_bps: int, now: int) -> int:
    """Mirrors `_resolvePythPrice`'s decode/validate/normalize steps (post-staticcall_evm)."""
    if len(response) != 128:
        raise PythFixtureError("MALFORMED_PYTH_RESPONSE")

    price_word = response[0:32]
    conf_word = response[32:64]
    expo_word = response[64:96]
    publish_time_word = response[96:128]

    raw_price = decode_positive_price_word(price_word)
    raw_conf = decode_confidence_word(conf_word)
    raw_expo = decode_exponent_word(expo_word)
    raw_publish_time = decode_unsigned_word(publish_time_word)

    if raw_price <= 0:
        raise PythFixtureError("NON_POSITIVE_PYTH_PRICE")
    if not (-30 <= raw_expo <= 0):
        raise PythFixtureError("INVALID_PYTH_EXPONENT")
    if raw_publish_time <= 0:
        raise PythFixtureError("INVALID_PYTH_PUBLISH_TIME")
    if raw_publish_time > now:
        raise PythFixtureError("FUTURE_PYTH_PUBLISH_TIME")

    price_nat = raw_price  # already verified > 0
    # No shared/implicit limit: max_confidence_bps must be the specific feed's own mandatory,
    # admin-configured limit (bounded to <= BPS_DENOMINATOR by setFeedIds).
    if raw_conf * BPS_DENOMINATOR > price_nat * max_confidence_bps:
        raise PythFixtureError("EXCESSIVE_PYTH_CONFIDENCE")

    decimal_shift = raw_expo + target_decimals
    if not (-30 <= decimal_shift <= 30):
        raise PythFixtureError("PYTH_NORMALIZATION_OUT_OF_RANGE")

    if decimal_shift >= 0:
        normalized_price = price_nat * (10 ** decimal_shift)
    else:
        normalized_price = price_nat // (10 ** (-decimal_shift))

    if normalized_price <= 0:
        raise PythFixtureError("ZERO_NORMALIZED_PYTH_PRICE")

    return normalized_price


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

NOW = 1_700_000_000

FIXTURES = [
    dict(
        name="positive BTC price (targetDecimals=8)",
        response=build_response(price=6_000_000_000, conf=1_000_000, expo=-2, publish_time=NOW - 5),
        target_decimals=8,
        max_confidence_bps=BTC_MAX_CONFIDENCE_BPS,
        expect_ok=True,
        expected_price=6_000_000_000 * 10 ** 6,  # decimalShift = -2+8=6
    ),
    dict(
        name="positive USDT price (targetDecimals=6)",
        response=build_response(price=100_010_000, conf=5_000, expo=-8, publish_time=NOW - 2),
        target_decimals=6,
        max_confidence_bps=USDT_MAX_CONFIDENCE_BPS,
        expect_ok=True,
        expected_price=100_010_000 // 100,  # decimalShift = -8+6=-2
    ),
    dict(
        name="positive XTZ price (targetDecimals=6)",
        response=build_response(price=850_000, conf=200, expo=-6, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=XTZ_MAX_CONFIDENCE_BPS,
        expect_ok=True,
        expected_price=850_000,  # decimalShift = -6+6=0
    ),
    dict(
        name="negative signed price",
        response=build_response(price=-42, conf=1, expo=-2, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="NON_POSITIVE_PYTH_PRICE",
    ),
    dict(
        name="zero price",
        response=build_response(price=0, conf=0, expo=-2, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="NON_POSITIVE_PYTH_PRICE",
    ),
    dict(
        name="negative exponent (valid, in-range)",
        response=build_response(price=123_456, conf=10, expo=-5, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=True,
        expected_price=123_456 * 10,  # decimalShift = -5+6=1
    ),
    dict(
        name="invalid exponent (out of [-30, 0] range)",
        response=build_response(price=123_456, conf=10, expo=1, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="INVALID_PYTH_EXPONENT",
    ),
    dict(
        name="invalid exponent (below -30)",
        response=build_response(price=123_456, conf=10, expo=-31, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="INVALID_PYTH_EXPONENT",
    ),
    dict(
        name="future timestamp",
        response=build_response(price=123_456, conf=10, expo=-6, publish_time=NOW + 3600),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="FUTURE_PYTH_PUBLISH_TIME",
    ),
    dict(
        name="excessive confidence (>25% of price, explicit 25% feed limit)",
        response=build_response(price=100_000, conf=30_000, expo=-6, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=2_500,  # 25% expressed as an explicit, non-implicit feed limit
        expect_ok=False,
        expected_error="EXCESSIVE_PYTH_CONFIDENCE",
    ),
    dict(
        name="normalized price rounds to zero (excessive negative decimalShift)",
        response=build_response(price=1, conf=0, expo=-30, publish_time=NOW - 1),
        target_decimals=0,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="ZERO_NORMALIZED_PYTH_PRICE",
    ),
    dict(
        name="malformed/truncated response (< 128 bytes)",
        response=build_response(price=1, conf=0, expo=-6, publish_time=NOW - 1)[:100],
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="MALFORMED_PYTH_RESPONSE",
    ),
    dict(
        name="malformed/truncated response (empty)",
        response=b"",
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="MALFORMED_PYTH_RESPONSE",
    ),
    dict(
        name="malformed positive price padding",
        response=(b"\x01" + b"\x00" * 23 + (42).to_bytes(8, "big")
                  + encode_uint_word(0) + encode_int_word(-2)
                  + encode_uint_word(NOW - 1)),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="MALFORMED_PYTH_RESPONSE",
    ),
    dict(
        name="malformed confidence padding",
        response=(encode_uint_word(42) + b"\x01" + b"\x00" * 23 + b"\x00" * 8
                  + encode_int_word(-2) + encode_uint_word(NOW - 1)),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="MALFORMED_PYTH_RESPONSE",
    ),
    dict(
        name="canonical negative exponent word is accepted before range validation",
        response=build_response(price=42, conf=1, expo=-2, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=True,
        expected_price=42 * 10 ** 4,
    ),
    dict(
        name="canonical positive exponent word is accepted before range validation",
        response=build_response(price=42, conf=1, expo=1, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="INVALID_PYTH_EXPONENT",
    ),
    dict(
        name="malformed exponent sign extension",
        response=(encode_uint_word(42) + encode_uint_word(1)
              + b"\x00" * 27 + b"\x00\x00\x00\x01"
                  + encode_uint_word(NOW - 1)),
        target_decimals=6,
        max_confidence_bps=BPS_DENOMINATOR,
        expect_ok=False,
        expected_error="MALFORMED_PYTH_RESPONSE",
    ),
]

# ---------------------------------------------------------------------------
# Feed-specific confidence boundary fixtures (ТЗ section 2). price=10_000 and expo=-4
# with targetDecimals=6 (decimalShift=2) reproduce the doc's literal worked boundary
# values (BTC 24/25/26, XTZ 49/50/51, USDT 9/10/11) exactly, since at price=10_000 the
# per-feed bps threshold collapses to `rawConf <= maxConfidenceBps` itself.
# ---------------------------------------------------------------------------

BOUNDARY_PRICE = 10_000
BOUNDARY_EXPO = -4
BOUNDARY_TARGET_DECIMALS = 6
BOUNDARY_EXPECTED_PRICE = BOUNDARY_PRICE * 10 ** (BOUNDARY_EXPO + BOUNDARY_TARGET_DECIMALS)


def _boundary_response(conf: int) -> bytes:
    return build_response(price=BOUNDARY_PRICE, conf=conf, expo=BOUNDARY_EXPO, publish_time=NOW - 1)


for _feed_name, _bps in (
    ("BTC", BTC_MAX_CONFIDENCE_BPS),
    ("XTZ", XTZ_MAX_CONFIDENCE_BPS),
    ("USDT", USDT_MAX_CONFIDENCE_BPS),
):
    FIXTURES.append(dict(
        name=f"{_feed_name} confidence boundary: one unit below limit ({_bps - 1}) accepted",
        response=_boundary_response(_bps - 1),
        target_decimals=BOUNDARY_TARGET_DECIMALS,
        max_confidence_bps=_bps,
        expect_ok=True,
        expected_price=BOUNDARY_EXPECTED_PRICE,
    ))
    FIXTURES.append(dict(
        name=f"{_feed_name} confidence boundary: exactly at limit ({_bps}) accepted",
        response=_boundary_response(_bps),
        target_decimals=BOUNDARY_TARGET_DECIMALS,
        max_confidence_bps=_bps,
        expect_ok=True,
        expected_price=BOUNDARY_EXPECTED_PRICE,
    ))
    FIXTURES.append(dict(
        name=f"{_feed_name} confidence boundary: one unit above limit ({_bps + 1}) rejected",
        response=_boundary_response(_bps + 1),
        target_decimals=BOUNDARY_TARGET_DECIMALS,
        max_confidence_bps=_bps,
        expect_ok=False,
        expected_error="EXCESSIVE_PYTH_CONFIDENCE",
    ))
    FIXTURES.append(dict(
        name=f"{_feed_name}: a 25% confidence quote is rejected under its own feed limit",
        response=build_response(price=1_000_000, conf=250_000, expo=-6, publish_time=NOW - 1),
        target_decimals=6,
        max_confidence_bps=_bps,
        expect_ok=False,
        expected_error="EXCESSIVE_PYTH_CONFIDENCE",
    ))


def run_fixture(fixture: dict) -> str:
    name = fixture["name"]
    try:
        result = resolve_price(fixture["response"], fixture["target_decimals"],
                               fixture["max_confidence_bps"], NOW)
    except PythFixtureError as exc:
        if fixture["expect_ok"]:
            return f"FAIL [{name}]: expected success but got error {exc}"
        if str(exc) != fixture["expected_error"]:
            return f"FAIL [{name}]: expected error {fixture['expected_error']!r} but got {exc!r}"
        return f"ok   [{name}] -> fail-closed with {exc}"
    if not fixture["expect_ok"]:
        return f"FAIL [{name}]: expected error {fixture['expected_error']!r} but got success {result}"
    if result != fixture["expected_price"]:
        return f"FAIL [{name}]: expected normalized price {fixture['expected_price']} but got {result}"
    return f"ok   [{name}] -> normalized price {result}"


def run_signed_decoding_checks() -> list:
    """Separately exercises signed (price/expo) vs unsigned (conf/publishTime) word decoding."""
    results = []
    checks = [
        ("signed word: max positive int64-range value", encode_int_word(2 ** 62), 2 ** 62),
        ("signed word: -1", encode_int_word(-1), -1),
        ("signed word: min int64-range value", encode_int_word(-(2 ** 62)), -(2 ** 62)),
        ("signed word: zero", encode_int_word(0), 0),
    ]
    for name, word, expected in checks:
        actual = decode_signed_word(word)
        results.append(
            f"{'ok  ' if actual == expected else 'FAIL'} [{name}] -> {actual} (expected {expected})"
        )

    unsigned_checks = [
        ("unsigned word: uint64 max-ish conf", encode_uint_word(2 ** 63), 2 ** 63),
        ("unsigned word: uint256-ish large publishTime", encode_uint_word(2 ** 200), 2 ** 200),
        ("unsigned word: zero", encode_uint_word(0), 0),
    ]
    for name, word, expected in unsigned_checks:
        actual = decode_unsigned_word(word)
        results.append(
            f"{'ok  ' if actual == expected else 'FAIL'} [{name}] -> {actual} (expected {expected})"
        )
    return results


def main() -> int:
    lines = []
    failures = 0

    lines.append("== Signed/unsigned word decoding checks ==")
    for line in run_signed_decoding_checks():
        lines.append(line)
        if line.startswith("FAIL"):
            failures += 1

    lines.append("")
    lines.append("== Pyth response fixtures ==")
    for fixture in FIXTURES:
        line = run_fixture(fixture)
        lines.append(line)
        if line.startswith("FAIL"):
            failures += 1

    print("\n".join(lines))
    print()
    if failures:
        print(f"{failures} fixture(s) FAILED")
        return 1
    print(f"All {len(FIXTURES)} fixtures + decoding checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

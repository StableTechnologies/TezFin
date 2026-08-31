"""Compile TezFinOracle and verify it against the pinned TezOracle Michelson ABI."""

import hashlib
import os
import re
import subprocess
import sys
import tempfile


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TEZORACLE_COMMIT = "bc5ccb8162960a98b0676a7b5588465f219f2fdb"
TEZORACLE_MICHELSON_SHA256 = (
    "1460d4f95a5607c89b9fb9820efae296212d8731d74364a967506aac990f2e93"
)
PLACEHOLDER_MANIFEST = os.path.join(REPO_ROOT, "e2e", "deploy_result", "deploy.json")


def require(pattern, source, description):
    if re.search(pattern, source, re.MULTILINE) is None:
        raise RuntimeError(f"Missing {description}: /{pattern}/")


def read_exact_oracle(repo):
    result = subprocess.run(
        ["git", "-C", repo, "show", f"{TEZORACLE_COMMIT}:michelson/tezoracle.tz"],
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"Cannot read TezOracle {TEZORACLE_COMMIT}: "
            f"{result.stderr.decode(errors='replace').strip()}"
        )
    digest = hashlib.sha256(result.stdout).hexdigest()
    if digest != TEZORACLE_MICHELSON_SHA256:
        raise RuntimeError(
            f"Pinned TezOracle Michelson hash changed: expected "
            f"{TEZORACLE_MICHELSON_SHA256}, got {digest}"
        )
    return result.stdout.decode()


def find_contract(directory):
    matches = []
    for root, _, files in os.walk(directory):
        matches.extend(
            os.path.join(root, name)
            for name in files
            if name.endswith("_contract.tz")
        )
    if len(matches) != 1:
        raise RuntimeError(f"Expected one compiled TezFinOracle contract, found {matches}")
    with open(matches[0], encoding="utf-8") as source:
        return source.read()


def compile_tezfin_oracle(smartpy):
    target = os.path.join(REPO_ROOT, "deploy", "compile_targets", "CompileTezFinOracle.py")
    with tempfile.TemporaryDirectory(prefix="tezoracle_abi_") as output:
        result = subprocess.run(
            [
                smartpy,
                "compile",
                target,
                output,
                "--purge",
                "--protocol",
                "kathmandu",
            ],
            cwd=REPO_ROOT,
            env={**os.environ, "DEPLOY_MANIFEST": PLACEHOLDER_MANIFEST},
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"TezFinOracle compile failed ({result.returncode}):\n"
                f"{result.stderr.strip()[-4000:]}"
            )
        return find_contract(output)


def main():
    smartpy = os.path.abspath(
        os.path.expanduser(
            sys.argv[1]
            if len(sys.argv) > 1
            else os.environ.get("SMARTPY_CLI", "~/smartpy-cli/SmartPy.sh")
        )
    )
    tezoracle_repo = os.path.abspath(
        os.path.expanduser(
            os.environ.get(
                "TEZORACLE_REPO",
                os.path.join(REPO_ROOT, "..", "tezoracle"),
            )
        )
    )
    if not os.path.isfile(smartpy):
        raise RuntimeError(f"SmartPy CLI not found: {smartpy}")
    if not os.path.isdir(os.path.join(tezoracle_repo, ".git")):
        raise RuntimeError(
            f"TezOracle checkout not found at {tezoracle_repo}; set TEZORACLE_REPO"
        )

    upstream = read_exact_oracle(tezoracle_repo)
    require(
        r'view\s+"get_price_with_timestamp"\s+string\s+'
        r'\(pair\s+\(nat\s+%price\)\s+\(timestamp\s+%observation_time\)\)',
        upstream,
        "exact TezOracle price/observation-time view",
    )

    wrapper = compile_tezfin_oracle(smartpy)
    require(
        r'VIEW\s+"get_price_with_timestamp"\s+\(pair\s+nat\s+timestamp\)',
        wrapper,
        "TezFinOracle upstream VIEW instruction",
    )
    require(
        r'view\s+"get_price_with_timestamp"\s+string\s+\(pair\s+nat\s+timestamp\)',
        wrapper,
        "TezFinOracle passthrough view",
    )
    require(
        r'view\s+"getPrice"\s+string\s+\(pair\s+timestamp\s+nat\)',
        wrapper,
        "TezFin-facing reordered price view",
    )
    require(
        r'view\s+"getValidatedPrice".*\(pair\s+timestamp\s+nat\)',
        wrapper,
        "TezFin validated price view",
    )
    print(
        "[INFO] TezFinOracle ABI matches pinned TezOracle "
        f"{TEZORACLE_COMMIT} ({TEZORACLE_MICHELSON_SHA256})."
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"[ERROR] {error}", file=sys.stderr)
        sys.exit(1)

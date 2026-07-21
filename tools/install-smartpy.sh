#!/usr/bin/env bash

set -euo pipefail

readonly SMARTPY_VERSION="0.16.0"
readonly SMARTPY_ARCHIVE_URL="https://legacy.smartpy.io/cli/smartpy-cli.tar.gz"
readonly SMARTPY_ARCHIVE_SHA256="615e60659f3550d9d50623ab8e6390ba75a0e4bbd4ebb00bed1aab41743bc392"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly RUNTIME_DIR="${SCRIPT_DIR}/smartpy"

prefix="${1:-${HOME}/smartpy-cli}"
archive="$(mktemp)"
trap 'rm -f "${archive}"' EXIT

curl --fail --silent --show-error --location "${SMARTPY_ARCHIVE_URL}" --output "${archive}"
if command -v shasum >/dev/null; then
    printf '%s  %s\n' "${SMARTPY_ARCHIVE_SHA256}" "${archive}" | shasum -a 256 --check --status
else
    printf '%s  %s\n' "${SMARTPY_ARCHIVE_SHA256}" "${archive}" | sha256sum --check --status
fi

rm -rf "${prefix}"
mkdir -p "${prefix}"
tar xzf "${archive}" -C "${prefix}"
rm -f "${prefix}/smartpyc"

cp "${RUNTIME_DIR}/package.json" "${RUNTIME_DIR}/package-lock.json" "${prefix}/"
npm --prefix "${prefix}" ci --ignore-scripts --no-audit --no-fund

actual_version="$("${prefix}/SmartPy.sh" --version)"
if [[ "${actual_version}" != "SmartPy Version: ${SMARTPY_VERSION}" ]]; then
    printf 'Expected SmartPy %s, got: %s\n' "${SMARTPY_VERSION}" "${actual_version}" >&2
    exit 1
fi

printf 'Installed verified SmartPy %s at %s\n' "${SMARTPY_VERSION}" "${prefix}"

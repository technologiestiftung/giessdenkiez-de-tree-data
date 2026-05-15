#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_PATH="${1:-${SCRIPT_DIR}/backup/gdk-production.dump}"
DB_NAME="${PGDATABASE:-postgres}"
TABLES=(
	"trees"
	"trees_watered"
	"trees_adopted"
)

if ! command -v pg_dump >/dev/null 2>&1; then
	echo "pg_dump is not installed or not in PATH" >&2
	exit 1
fi

mkdir -p "$(dirname "${DUMP_PATH}")"
TMP_DUMP_PATH="$(mktemp "${DUMP_PATH}.tmp.XXXXXX")"
cleanup() {
	rm -f "${TMP_DUMP_PATH}"
}
trap cleanup EXIT

PG_DUMP_ARGS=(
	--data-only
	--format=custom
	--no-owner
	--no-privileges
	--schema=public
	--file="${TMP_DUMP_PATH}"
)

for table in "${TABLES[@]}"; do
	PG_DUMP_ARGS+=(--table="${table}")
done

pg_dump "${PG_DUMP_ARGS[@]}" "${DB_NAME}"
mv "${TMP_DUMP_PATH}" "${DUMP_PATH}"
trap - EXIT

echo "Wrote production data dump to ${DUMP_PATH}"

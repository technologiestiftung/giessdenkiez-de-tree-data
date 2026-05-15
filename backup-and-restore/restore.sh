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

if ! command -v pg_restore >/dev/null 2>&1; then
	echo "pg_restore is not installed or not in PATH" >&2
	exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
	echo "psql is not installed or not in PATH" >&2
	exit 1
fi

if [[ ! -f "${DUMP_PATH}" ]]; then
	echo "Dump file does not exist: ${DUMP_PATH}" >&2
	exit 1
fi

ARCHIVE_LIST="$(pg_restore --list "${DUMP_PATH}")"
for table in "${TABLES[@]}"; do
	if ! grep -qE "TABLE DATA public ${table} " <<<"${ARCHIVE_LIST}"; then
		echo "Dump does not contain table data for public.${table}: ${DUMP_PATH}" >&2
		exit 1
	fi
done

PG_RESTORE_ARGS=(
	--file=-
	--data-only
	--no-owner
	--no-privileges
	--schema=public
)

for table in "${TABLES[@]}"; do
	PG_RESTORE_ARGS+=(--table="${table}")
done

pg_restore "${PG_RESTORE_ARGS[@]}" "${DUMP_PATH}" \
	| sed '/^SET transaction_timeout = 0;$/d' \
	| psql \
		--set=ON_ERROR_STOP=1 \
		--single-transaction \
		--dbname="${DB_NAME}"

echo "Restored production data from ${DUMP_PATH} into ${DB_NAME}"

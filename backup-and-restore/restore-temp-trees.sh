#!/usr/bin/env bash
# ABOUTME: Restores only public.temp_trees from a PostgreSQL custom dump.
# ABOUTME: Recreates temp_trees when schema is present, or truncates before data-only restore.

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_PATH="${1:-${SCRIPT_DIR}/backup/gdk-temp_trees.dump}"
DB_NAME="${PGDATABASE:-postgres}"

if [[ ! -f "${DUMP_PATH}" ]]; then
	echo "Dump file does not exist: ${DUMP_PATH}" >&2
	exit 1
fi

ARCHIVE_LIST="$(pg_restore --list "${DUMP_PATH}")"

if grep -qE ' TABLE public temp_trees ' <<<"${ARCHIVE_LIST}"; then
	pg_restore \
		--exit-on-error \
		--single-transaction \
		--clean \
		--if-exists \
		--no-owner \
		--no-privileges \
		--dbname="${DB_NAME}" \
		--schema=public \
		--table=temp_trees \
		"${DUMP_PATH}"
else
	psql \
		--set=ON_ERROR_STOP=1 \
		--dbname="${DB_NAME}" \
		--command="TRUNCATE TABLE public.temp_trees;"

	pg_restore \
		--exit-on-error \
		--single-transaction \
		--data-only \
		--no-owner \
		--no-privileges \
		--dbname="${DB_NAME}" \
		--schema=public \
		--table=temp_trees \
		"${DUMP_PATH}"
fi

echo "Restored temp_trees from ${DUMP_PATH} into ${DB_NAME}"

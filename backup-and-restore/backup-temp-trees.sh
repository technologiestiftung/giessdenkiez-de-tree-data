#!/usr/bin/env bash
# ABOUTME: Creates a custom PostgreSQL dump containing only public.temp_trees.
# ABOUTME: Includes table schema and data so the dump can recreate temp_trees elsewhere.

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_PATH="${1:-${SCRIPT_DIR}/backup/gdk-temp_trees.dump}"
DB_NAME="${PGDATABASE:-postgres}"

mkdir -p "$(dirname "${DUMP_PATH}")"

pg_dump \
	--format=custom \
	--no-owner \
	--no-privileges \
	--schema=public \
	--table=temp_trees \
	--file="${DUMP_PATH}" \
	"${DB_NAME}"

echo "Wrote temp_trees dump to ${DUMP_PATH}"

#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

docker run --env-file ./.env \
	postgres pg_dump \
	--data-only \
	--format=custom \
	--no-owner \
	--schema=public \
	--table=trees \
	--table=trees_watered \
	--table=trees_adopted >./backup/gdk-prod-2023-05-23-post-migration.dump

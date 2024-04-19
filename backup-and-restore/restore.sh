i#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

docker run --env-file ./.env \
	postgres pg_restore \
	--no-owner \
	--data-only \
	--dbname=postgres \
	--schema=public \
	--table=trees_watered \
	--table=trees_adopted /backup/gdk-prod-2023-05-23-post-migration.dump
# --format=custom \
# --table=trees \

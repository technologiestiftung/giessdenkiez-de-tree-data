#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

pg_dump \
	--data-only \
	--format=custom \
	--no-owner \
	--schema=public \
	--table=trees \
	--table=trees_watered \
	--table=trees_adopted >./backup/gdk-staging.dump

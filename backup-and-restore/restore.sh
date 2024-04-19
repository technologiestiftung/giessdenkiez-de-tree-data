i#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

pg_restore \
	--no-owner \
	--data-only \
	--dbname=postgres \
	--schema=public \
	--table=trees \
	--table=trees_watered \
	--table=trees_adopted /backup/gdk-local.dump

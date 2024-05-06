#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

pg_dump \
	--data-only \
	--format=custom \
	--no-owner \
	--schema=public \
	--table=temp_trees >./backup/gdk-temp_trees.dump

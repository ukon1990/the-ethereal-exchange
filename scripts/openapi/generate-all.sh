#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(dirname "$0")"
"$SCRIPT_DIR/generate-backend.sh"
"$SCRIPT_DIR/generate-frontend.sh"

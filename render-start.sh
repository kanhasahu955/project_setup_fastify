#!/usr/bin/env bash
# Run from repo root or from fastify_backend – always start from this folder so dist/main.js is found.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
exec node dist/main.js

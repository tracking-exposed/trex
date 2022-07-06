#!/usr/bin/env bash
set -e

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )"
cd "$SCRIPT_DIR/../../"
docker build -f "docker/guardoni/Dockerfile" -t guardoni .

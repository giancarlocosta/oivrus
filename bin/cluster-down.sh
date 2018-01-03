#!/bin/bash -e

cd "$(dirname "$0")/.."

echo "Stopping Service... "
bin/stop.sh || true

echo "Stopping Mock Services Server... "
bin/mock-server-stop.sh || true

echo "Stopping DB... "
bin/db-stop.sh || true

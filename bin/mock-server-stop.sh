#!/bin/bash -e

cd "$(dirname "$0")/.."

docker rm -f mockserver

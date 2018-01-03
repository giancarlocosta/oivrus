#!/bin/bash -e
set -x
cd "$(dirname "$0")/.."

docker run -d --name mockserver -p 1080:1080 -p 1090:1090 jamesdbloom/mockserver

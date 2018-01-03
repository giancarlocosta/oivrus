#!/bin/bash -e

cd "$(dirname "$0")/.."

docker exec -it cassandra-1 /bin/bash

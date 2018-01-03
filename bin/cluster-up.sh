#!/bin/bash -e
set -x

cd "$(dirname "$0")/.."

export IMAGE_BRANCH=${IMAGE_BRANCH-"gitlab.e1c.net:4567/$(whoami)/submission-service:latest"}

bin/cluster-down.sh || true

# Start DB
echo "Starting DB... "
bin/db-start.sh

# Start Mock Services Server
echo "Starting Mock Services Server... "
bin/mock-server-start.sh


# Build and run newest container
echo "Running $IMAGE_BRANCH container"
DB_CONTAINER=cassandra-1 DB_HOSTNAME=cassandra bin/run.sh
set +x; for i in $(seq 1 30); do echo -ne "Waiting for service to initialize + setup DB...$((30 - $i))"'\r'; sleep 1; docker logs --since=1s submission-service; done; echo
echo "Cluster Ready!"

#!/bin/bash -e

set -x

cd "$(dirname "$0")/.."

IMAGE_BRANCH=${IMAGE_BRANCH:-"gitlab.e1c.net:4567/$(whoami)/submission-service:latest"}
DB_CONTAINER=${DB_CONTAINER:-"cassandra-1"}
DB_HOSTNAME=${DB_HOSTNAME:-"cassandra"}

bin/stop.sh

runCommand="docker run -d -t --name submission-service -p 3000:3000 --link mockserver:election-service --link mockserver:author-service"
if [[ $DB_CONTAINER ]]; then
  runCommand="$runCommand --link $DB_CONTAINER:$DB_HOSTNAME"
fi
if [[ $LOCAL_PATH ]]; then
    runCommand="$runCommand -v $LOCAL_PATH:/opt/service"
fi

runCommand="$runCommand --env-file env/container-test.env $IMAGE_BRANCH"

$runCommand

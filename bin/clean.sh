#!/bin/bash -e

cd "$(dirname "$0")/.."

export IMAGE_BRANCH=${IMAGE_BRANCH:-"gitlab.e1c.net:4567/$(whoami)/submission-service:latest"}

bin/stop.sh

docker rmi $IMAGE_BRANCH || true

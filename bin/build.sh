#!/bin/bash -e


cd "$(dirname "$0")/.."


# Default values if none provided
export VERSION_NUMBER=${VERSION_NUMBER:-"0.0.0"}
export IMAGE_BRANCH=${IMAGE_BRANCH:-"gitlab.e1c.net:4567/$(whoami)/submission-service:latest"}


# Build the image, injecting the NPM auth token from the host system
NPM_AUTH_TOKEN=$(sed -n 's|//npm.e1c.net/:_authToken=\"\(.*\)\"|\1|p' ~/.npmrc)
docker build --tag "$IMAGE_BRANCH" --build-arg VERSION_NUMBER="$VERSION_NUMBER" --build-arg NPM_AUTH_TOKEN="$NPM_AUTH_TOKEN" .

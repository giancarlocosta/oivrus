#!/bin/bash -e
cd "$(dirname "$0")/.."

# Parameter corresponds to the names in the CI config file
JOB_NAME=${1-publish-branch-build}

# The registry path (i.e. "group/project") is parsed from the first entry in the
# list of git remotes, which may not always be accurate if multiple remotes are defined
REGISTRY_PATH="$(git remote -v | head -1 | sed "s~.*://[^/]*/\(.*\)\.git.*~\1~")"
REGISTRY_IMAGE="gitlab.e1c.net:4567/$REGISTRY_PATH"

# Run the CI job, mounting the credential items just like a real runner would do
gitlab-runner exec docker \
  --timeout=3600 \
  --docker-privileged \
  --docker-services="docker:dind" \
  --docker-volume-driver="overlay" \
  --docker-volumes="$HOME/.npmrc:/root/.npmrc" \
  --docker-volumes="$HOME/.ssh/:/root/.ssh/" \
  --docker-volumes="$HOME/.docker/config.json:/root/.docker/config.json" \
  --docker-volumes="$HOME/.kube/config:/etc/.kube/config" \
  --env CI_REGISTRY_IMAGE="$REGISTRY_IMAGE" "$JOB_NAME"

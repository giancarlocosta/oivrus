#!/bin/bash -e

cd "$(dirname "$0")/.."

docker exec -it submission-service bash

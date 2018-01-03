#!/bin/bash
while IFS='' read -r line || [[ -n "$line" ]]; do
    echo "Killing service with pid: $line"
    kill -9 $line || continue
done < "/tmp/submission-service-process-pids"

rm -rf /tmp/submission-service-process-pids

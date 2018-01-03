#!/bin/bash

if docker ps -a | grep cassandra >/dev/null; then
	cids=$(docker ps -a | grep cassandra | awk '{ print $1 }')
	echo $cids | xargs echo "Killing and removing DB containers:"
	docker rm -f $cids   > /dev/null
fi

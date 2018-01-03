#!/bin/bash -e

cd "$(dirname "$0")/.."

NUM_NODES=${NUM_NODES:-1}
BASENAME=${BASENAME:-"cassandra"}
NO_AUTH=${NO_AUTH}

authOptions="-e CASSANDRA_AUTHORIZER=CassandraAuthorizer -e CASSANDRA_AUTHENTICATOR=PasswordAuthenticator"
if [[ $NO_AUTH ]]; then
  authOptions=""
fi

for id in $(seq 1 $NUM_NODES); do

  hostname=$BASENAME-$id

	echo "Starting cassandra node $hostname"

	# start container
	if [[ $id == 1 ]]; then
    ports="-p 9160:9160 -p 9042:9042 -p 7000-7001:7000-7001 -p 7199:7199"
    docker run -d --name $hostname -h $hostname $ports $authOptions gitlab.e1c.net:4567/ops/base-images:cassandra3
    SEED=`docker inspect --format='{{ .NetworkSettings.IPAddress }}' $hostname`
  else
    docker run -d --name $hostname -h $hostname -e CASSANDRA_SEEDS=$SEED $authOptions gitlab.e1c.net:4567/ops/base-images:cassandra3
	fi

done
for i in {0..60}; do echo -ne "Initializing DB...$((60 - $i))"'\r'; sleep 1; done; echo

if ! [[ $NO_AUTH ]]; then
  bin/db-auth-setup.sh
fi
echo "DB Ready!"

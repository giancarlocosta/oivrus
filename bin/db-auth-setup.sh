#!/bin/bash -e

cd "$(dirname "$0")/.."

DB_KEYSPACE=${DB_KEYSPACE:-"submission_service"}
DB_USERNAME=${DB_USERNAME:-"submission_service_role"}
DB_PASSWORD=${DB_PASSWORD:-"submission_service"}
DB_REPLICATION_CLASS=${DB_REPLICATION_CLASS:-"SimpleStrategy"}
DB_REPLICATION_FACTOR=${DB_REPLICATION_FACTOR:-1}

echo "DB creating role '$DB_USERNAME' with password '$DB_PASSWORD'"
echo "DB creating keyspace '$DB_KEYSPACE' with Replication Class '$DB_REPLICATION_CLASS' and Replication Factor $DB_REPLICATION_FACTOR"

create_keyspace="CREATE KEYSPACE IF NOT EXISTS $DB_KEYSPACE WITH REPLICATION = { 'class' : '$DB_REPLICATION_CLASS', 'replication_factor' : $DB_REPLICATION_FACTOR  }"
create_role="CREATE ROLE IF NOT EXISTS $DB_USERNAME WITH PASSWORD = '$DB_PASSWORD' AND LOGIN = true;"
grant_permissions="GRANT ALL PERMISSIONS ON KEYSPACE $DB_KEYSPACE TO $DB_USERNAME"

docker exec cassandra-1 cqlsh -u cassandra -p cassandra -e "$create_keyspace";
docker exec cassandra-1 cqlsh -u cassandra -p cassandra -e "$create_role";
docker exec cassandra-1 cqlsh -u cassandra -p cassandra -e "$grant_permissions";

#!/bin/bash

cd "$(dirname "$0")/.."

# The name of the host to test is given as a parameter
export SERVICE_HOST=${1-"0.0.0.0"}

# Install dependencies
echo "Installing test dependencies"
node -v | grep v6 || { echo "Node Version must be >= 6"; exit 1; }
which unzip || apt-get install -y unzip || exit 1
npm install || exit 1

# Audit dependencies
bin/audit.sh || exit 1

# Source env vars for other bin and test scripts
. env/test.env

# Start cluster
echo -e "\nStarting DB + Mockserver ..."
[[ $(docker ps -f "name=cassandra-1" --format '{{.Names}}') == cassandra-1 ]] || bin/db-start.sh || exit 1
[[ $(docker ps -f "name=mockserver" --format '{{.Names}}') == mockserver ]] || bin/mock-server-start.sh || exit 1

# Overwrite some sourced env vars so test scripts work
echo "Starting server"
export API_URL="http://0.0.0.0:3000"
export DB_HOSTS=$SERVICE_HOST
export ELECTION_SERVICE_URL="http://$SERVICE_HOST:1080"
export AUTHOR_URL="http://$SERVICE_HOST:1080"
SERVER_LOG=/tmp/submission-service-test.log
bin/killservice.sh
node server/server.js > $SERVER_LOG 2>&1 &
for i in $(seq 1 30); do echo -ne "Waiting for service to initialize + setup DB...$((30 - $i))"'\r'; sleep 1; done; echo

# Run tests
./node_modules/.bin/_mocha -b test/**/*.js
result=$?

# Optionally get coverage report
if [[ $result == 0 && $COVERAGE == "true" ]]; then
  echo "Getting coverage report..."
  ./bin/get-coverage-report.sh $API_URL || exit 1
fi

if [[ $result != 0 ]]; then
  echo -e '\nFAILURE!\n\nServer logs below:\n\n' && cat $SERVER_LOG
fi

# Clean up
bin/killservice.sh

exit $result

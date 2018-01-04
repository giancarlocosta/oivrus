const Promise = require('bluebird');
const promiseRetry = require('promise-retry');
const cassandra = require('express-cassandra');
const logger = new (require('service-logger'))(__filename);
const co = Promise.coroutine;


/* *****************************************************************************
STATIC MEMBERS
*******************************************************************************/


const DB_HOSTS = process.env.DB_HOSTS.split(',');
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_KEYSPACE = process.env.DB_KEYSPACE;
const DB_CONSISTENCY = process.env.DB_CONSISTENCY;
const DB_REPLICATION_FACTOR = parseInt(process.env.DB_REPLICATION_FACTOR, 10);
const DB_REPLICATION_CLASS = process.env.DB_REPLICATION_CLASS;
const DB_AUTH_PROVIDER = process.env.DB_AUTH_PROVIDER;

const DB_CONNECTION_TRIES = 1000;
const USER_DEFINED_TYPES = require(__dirname + '/models/udts.js');

function exists(v) {
  return v && typeof v !== 'undefined' && v !== null && v !== 'undefined';
}


/* *****************************************************************************
DB FUNCTIONS
*******************************************************************************/


class DB {
  constructor() {}

  // Function to check if all required DB environment vars are set/valid
  static validateDbVars() {
    if (!exists(DB_HOSTS)) { throw new Error(`DB_HOSTS env var not set for DB`); }
    if (!exists(DB_USERNAME)) { throw new Error(`DB_USERNAME env var not set for DB`); }
    if (!exists(DB_PASSWORD)) { throw new Error(`DB_PASSWORD env var not set for DB`); }
    if (!exists(DB_KEYSPACE)) { throw new Error(`DB_KEYSPACE env var not set for DB`); }
    if (!exists(DB_CONSISTENCY)) { throw new Error(`DB_CONSISTENCY env var not set for DB`); }
    if (!exists(DB_REPLICATION_FACTOR)) { throw new Error(`DB_REPLICATION_FACTOR env var not set for DB`); }
    if (!exists(DB_REPLICATION_CLASS)) { throw new Error(`DB_REPLICATION_CLASS env var not set for DB`); }
  }

  static get models() {
    return cassandra;
  }

  // Return normal driver client to use for manual queries
  static get client() {
    return cassandra.orm._client;
  }

  // Convert passed string to a field name of one of the ORM consistencies
  static _convertToConsistency(consistency) {
    const tokens = consistency.toLowerCase().split('_');
    let ormConsistencyFieldName = tokens[0];
    for (let i = 1; i < tokens.length; i++) {
      ormConsistencyFieldName += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
    }
    return ormConsistencyFieldName;
  }

  // Connect to DB (should only be called once in an application)
  static connect() {
    const self = this;
    return co(function* () {

      self.validateDbVars();

      // Validate and set database CONSISTENCY
      let consistency = self._convertToConsistency(DB_CONSISTENCY);
      if (!cassandra.consistencies[consistency]) {
        throw new Error(`DB Consistency '${DB_CONSISTENCY}' (${consistency}) invalid!`);
      }
      consistency = cassandra.consistencies[consistency];

      // Only use Cassandra auth provider if DB_AUTH_PROVIDER env var is set to a valid AuthProvider type
      let AuthProvider;
      if (exists(DB_AUTH_PROVIDER)) {
        if (DB_AUTH_PROVIDER === 'PlainTextAuthProvider') {
          AuthProvider = new cassandra.driver.auth.PlainTextAuthProvider(DB_USERNAME, DB_PASSWORD);
        }
      }

      // Set reconnection policy for cassandra driver to use
      const ConstantReconnectionPolicy = new cassandra.driver.policies.reconnection.ConstantReconnectionPolicy(500);

      // Cassandra 'nodejs-driver' package specific options
      const cassandraClientOptions = {
        contactPoints: DB_HOSTS,
        keyspace: DB_KEYSPACE,
        protocolOptions: {
          port: 9042,
          maxVersion: cassandra.datatypes.protocolVersion.v4
        },
        authProvider: AuthProvider,
        policies: {
          reconnection: ConstantReconnectionPolicy
        },
        queryOptions: {
          consistency: consistency
        }
      };

      // 'express-cassandra' package specific options
      const ormOptions = {
        udts: USER_DEFINED_TYPES,
        defaultReplicationStrategy: {
          class: DB_REPLICATION_CLASS,
          replication_factor: DB_REPLICATION_FACTOR
        },
        migration: 'drop', // TODO set to 'safe' !!!
        createKeyspace: true
      };

      // Connect to the DB (retry connecting if non-schema errors)
      yield promiseRetry(function(retry, number) {
        if (number > 1) { logger.notice(`DB connection attempt ${number}`); }
        return cassandra.setDirectory( __dirname + '/models').bindAsync({
          clientOptions: cassandraClientOptions,
          ormOptions: ormOptions
        }).catch(function(err) {
          // If any errors due to schema updates/changes, fail immediately and don't retry to connect
          // These are more serious errors that need to be dealt with from a admin level
          if (err.name.includes(`apollo.model.tablecreation`) || err.name.includes(`apollo.model.validator`)) {
            throw err;
          }
          logger.warn(err);
          retry(err);
        });
      }, { retries: DB_CONNECTION_TRIES, maxTimeout: 1000, factor: 1 });

      return Promise.resolve();
    })();
  }

  // Check DB connection
  static healthCheck(command) {
    const self = this;
    return co(function* () {

      const cmd = command || `SELECT now() FROM system.local;`;
      logger.debug(`Performing health check on DB using command: '${cmd}'`);
      yield self.client.execute(cmd);

      return Promise.resolve();
    })();
  }

}

module.exports = DB;

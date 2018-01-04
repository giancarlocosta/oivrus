const logger = new (require('service-logger'))(__filename);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.ENCODING = process.env.ENCODING || 'base64';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
process.env.LOG_PATH = process.env.LOG_PATH || '/var/log/submission-service.log';
process.env.STORAGE_DIR = process.env.STORAGE_DIR || '/tmp/submission-service';

process.env.DB_HOSTS = process.env.DB_HOSTS || 'cassandra';
process.env.DB_USERNAME = process.env.DB_USERNAME || 'survio_service_role';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'survio_service';
process.env.DB_KEYSPACE = process.env.DB_KEYSPACE || 'survio_service';
process.env.DB_CONSISTENCY = process.env.DB_CONSISTENCY || 'ONE';
process.env.DB_REPLICATION_FACTOR = process.env.DB_REPLICATION_FACTOR || '3';
process.env.DB_REPLICATION_CLASS = process.env.DB_REPLICATION_CLASS || 'SimpleStrategy';

process.env.MIN_PAGE_SIZE = 100;
process.env.MAX_PAGE_SIZE = 1000;
process.env.DEFAULT_PAGE_SIZE = 500;

process.env.ELECTION_SERVICE_HOST = process.env.ELECTION_SERVICE_HOST || `election-service`;
process.env.ELECTION_SERVICE_URL = process.env.ELECTION_SERVICE_URL || `http://${process.env.ELECTION_SERVICE_HOST}`;
process.env.CACHE_SERVICE_RESPONSES = process.env.CACHE_SERVICE_RESPONSES || 'true';


function logDBVars() {
  logger.notice(`DB_HOSTS=${process.env.DB_HOSTS}`);
  logger.notice(`DB_USERNAME=${process.env.DB_USERNAME}`);
  logger.notice(`DB_KEYSPACE=${process.env.DB_KEYSPACE}`);
  logger.notice(`DB_CONSISTENCY=${process.env.DB_CONSISTENCY}`);
  logger.notice(`DB_REPLICATION_FACTOR=${process.env.DB_REPLICATION_FACTOR}`);
  logger.notice(`DB_REPLICATION_CLASS=${process.env.DB_REPLICATION_CLASS}`);
  logger.notice(`DB_AUTH_PROVIDER=${process.env.DB_AUTH_PROVIDER}`);
}

module.exports = {
  logDBVars
};

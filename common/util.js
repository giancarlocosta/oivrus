const _ = require('lodash');
const fs = require('fs');
const requestRetry = require('requestretry');
const requestContext = require('request-context');
const Promise = require('bluebird');
const co = Promise.coroutine;
const logger = new (require('service-logger'))(__filename);


function throwErr(errorName, clientMessage) {
  const err = new Error(errorName);
  err.clientMessage = clientMessage;
  throw err;
}

function rejectError(errorName, clientMessage) {
  return new Promise(function(resolve, reject) {
    const err = new Error(errorName);
    err.clientMessage = clientMessage;
    reject(err);
  });
}

// Cassandra ORM needs fields to be lowercase
function objToLower(origObj) {
  return _.transform(origObj, function(result, val, key) {
    result[key.toLowerCase()] = val;
  });
}

function exists(variable) {
  return typeof variable !== 'undefined' && variable !== null && variable !== 'undefined';
}

function reqRetry(req, returnFailureResponse) {
  return co(function* () {

    let reqOpts;

    if (typeof req === 'object') { reqOpts = req; }
    if (typeof req === 'string') {
      reqOpts = { method: 'GET', url: req, json: true };
    }
    reqOpts.fullResponse = true;
    reqOpts.maxAttempts = 5;
    reqOpts.retryDelay = req.retryDelay || 1000;
    reqOpts.timeout = req.timeout || 1000;
    reqOpts.url = reqOpts.url || reqOpts.uri;
    reqOpts.json = true;

    // Assign request id from context to outgoing request
    reqOpts.headers = reqOpts.headers || {};
    reqOpts.headers['X-Request-Id'] = requestContext.get('request:requestId');

    // IMPORTANT: Don't cache responses unless explicitly told to do so
    reqOpts.headers['Cache-Control'] = reqOpts.headers['Cache-Control'] || 'no-cache';

    logger.debug(`Fetching '${reqOpts.url}'`);

    // For now, catch any posix/network error (not HTTP error) and turn into 504
    // NOTE: can check error.code here for possible posix errors ('ETIMEDOUT', etc)
    const response = yield requestRetry(reqOpts).catch(function(error) {
      logger.warn(`Network (non HTTP) error caught.`);
      logger.warn(error);
      return Promise.reject(new Error('GatewayTimeoutError'));
    });

    // If no posix/network error, check HTTP errors

    if (!response) {
      const e = new Error('ExternalRequestError'); e.clientMessage = `No response from url '${reqOpts.url}'`;
      return Promise.reject(e);
    }

    logger.debug(`Fetched '${reqOpts.url}'. Status Code: ${response.statusCode}`);

    // Pass through HTTP 504s and 503s
    if (response.statusCode === 504) {
      return Promise.reject(new Error('GatewayTimeoutError'));
    } else if (response.statusCode === 503) {
      return Promise.reject(new Error('ServiceUnavailableError'));
    }

    // If caller doesn't want to manually check responses, throw 502 if statusCode is not 2XX
    if (!returnFailureResponse) {
      if (response.statusCode !== 204 && (response.statusCode < 200 || response.statusCode > 299 || !response.body) ) {
        logger.warn(`HTTP error caught. ${reqOpts.method} '${reqOpts.url}' returned ${response.statusCode}`);
        return Promise.reject(new Error('ExternalRequestError'));
      }
    }
    return Promise.resolve(response);
  })();
}


// Instrument specified files and add a /coverage endpoint to tha app
// NOTE: this method should only be used when NODE_ENV !== production
function instrument(app) {
  logger.notice('Hooking istanbul loader for coverage. Enabling /coverage endpoint');
  const im = require('istanbul-middleware');
  im.hookLoader((file) => {
    const excludes = ['node_modules', 'ModelController.js', 'cassandra.js', 'test.js'];
    for (let i = 0; i < excludes.length; i++) {
      if (file.includes(excludes[i])) { return false; }
    }
    return true;
  });
  // im.hookLoader(__dirname);
  app.use('/coverage', im.createHandler());
}

function enableDevHooks(app) {
  logger.notice(`Enabling /api-docs and /test endpoints`);
  const DEFAULT_TEST_ROOT = '/test';
  const SWAGGER_SPEC = '../doc/swagger-api-specification.json';

  // Enable swagger UI
  const swaggerUi = require('express-swaggerize-ui');
  app.use('/api-docs.json', (req, res) => { res.json(require(SWAGGER_SPEC)); });
  app.use('/api-docs', swaggerUi());

  // Enable test hook endpoints
  const testHooks = require('../server/routes/test');
  app.use(DEFAULT_TEST_ROOT, testHooks);
}

module.exports = {
  throwErr,
  rejectError,
  objToLower,
  exists,
  reqRetry,
  instrument,
  enableDevHooks
};

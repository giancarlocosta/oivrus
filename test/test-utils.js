const root = '..';
const Promise = require('bluebird');
const rp = require('request-promise');
const fs = require('fs');
const fsp = require('fs-promise');
const mockServer = require('mockserver-client');
const mockServerClient = mockServer.mockServerClient;
const proxyClient = mockServer.proxyClient;
const evsSchemas = require('evs-data-schemas');

const db = require('../server/datasources/cassandra.js');

const co = Promise.coroutine;
const chai = require('chai');
const expect = chai.expect;

const KEY_BYTES = 256;
const VOTE_SIZE_BYTES = 4;
const AES_BITS = 256;
const ENCRYPT_ALGORITHM = 'AES-256-CBC';

const SERVER_PORT = process.env.SERVER_PORT || '3000';
const API_URL = process.env.API_URL || `http://0.0.0.0:${process.env.SERVER_PORT}`;

const MOCK_SERVER_HOST = process.env.SERVICE_HOST || '0.0.0.0';
const MOCK_SERVER_PORT = 1080;


/*
* Wipe entire DB bucket
*/
function wipeDB(callback) {
  return co(function* () {

    // Wait for DB connection first
    yield db.connect();

    const tables = ['event'];
    for (let i = 0; i < tables.length; i++) {
      yield db.client.execute(`TRUNCATE ${tables[i]}`);
    }
    if (callback) callback();
    return Promise.resolve();
  })();
}


function resetMockService() {
  return co(function* () {
    yield mockServerClient(MOCK_SERVER_HOST, MOCK_SERVER_PORT).reset();
    return Promise.resolve();
  })();
}


function mockServiceResponse(httpVerb, host, endpoint, responseBody, options = {}) {
  return co(function* () {
    const obj = typeof responseBody === 'object' ? responseBody : require(`./service-responses/${responseBody}.js`);

    const unlimitedReqs = options.unlimitedReqs || false;
    const statusCode = options.statusCode || 200;

    const result = yield mockServerClient(MOCK_SERVER_HOST, MOCK_SERVER_PORT).mockAnyResponse(
      {
        httpRequest: {
          method: httpVerb,
          path: endpoint
        },
        httpResponse: {
          statusCode: statusCode,
          body: JSON.stringify(obj),
          delay: {
            timeUnit: 'MILLISECONDS',
            value: 0
          }
        },
        times: {
          remainingTimes: 1,
          unlimited: unlimitedReqs
        }
      }
    );

    return Promise.resolve(result);
  })();
}


function validateSchema(data, schema) {

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      if (!evsSchemas.validator.validate(schema, data[i])) {
        throw new Error(evsSchemas.validator.errorsText());
      }
    }
  } else {
    if (!evsSchemas.validator.validate(schema, data)) {
      throw new Error(evsSchemas.validator.errorsText());
    }
  }

  return true;
}


/*
* Promise to stall before executing subsequent code (used in tests to wait
* a moment to ensure you can 'read your writes')
*/
function wait(ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => { resolve(); }, ms);
  });
}


module.exports = {
  mockServiceResponse,
  wait,
  resetMockService,
  wipeDB,
  validateSchema
};

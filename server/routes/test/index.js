const root = '../../..';

const nock = require('nock');
const coroutine = require('co-express');
const express = require('express');
const router = new express.Router();

const logger = new (require('service-logger'))(__filename);
const expressUtils = require(root + '/server/middleware').util;
const evsSchemas = require('evs-data-schemas');


expressUtils.mapRoutes(router, __dirname);


// Test hook to allow outsider to mock a single repsonse from a defined url.
// Used to mock dependency Service responses
/* istanbul ignore next */
router.post('/mock', coroutine(function* (req, res, next) {

  const host = req.body.host;
  const endpoint = req.body.endpoint;
  const responseBody = req.body.responseBody;

  nock(`http://${host}/${endpoint}`).get(/.*/).reply(200, responseBody);

  return res.status(200).send();
}));

/* istanbul ignore next */
router.post('/bg/log_event', coroutine(function* (req, res, next) {
  logger.debug(`\nAUTHOR RECEIVED:\n ${JSON.stringify(req.body, null, 3)}`);
  return res.status(200).send({ status: 'success' });
}));


module.exports = router;

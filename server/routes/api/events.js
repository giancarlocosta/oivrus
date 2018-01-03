const coroutine = require('co-express');

const express = require('express');
const router = new express.Router();

const root = '../../..';
const middleware = require(root + '/server/middleware').util;
const logger = new (require('service-logger'))(__filename);

const SubmissionController = new (require(`${root}/server/controllers/SubmissionController.js`))();
const ExternalServiceController = require(`${root}/server/controllers/ExternalServiceController.js`);


router.post('/', coroutine(function* (req, res, next) {
  const data = yield SubmissionController.create(req.body, {
    validate: true
  });
  res.status(201).data = data;
  next();
}));


router.get('/', coroutine(function* (req, res, next) {
  const data = yield SubmissionController.find(undefined, { queryFilters: req.query });
  res.status(200).data = data;
  next();
}));


router.get('/:id', coroutine(function* (req, res, next) {
  const data = yield SubmissionController.find(req.params.id, { queryFilters: req.query });
  res.status(200).data = data;
  next();
}));


module.exports = router;

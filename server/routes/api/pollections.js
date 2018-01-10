const root = '../../..';
const coroutine = require('co-express');
const express = require('express');
const router = new express.Router();
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const moment = require('moment');

const logger = new (require('service-logger'))(__filename);
const utils = require(`${root}/common/util.js`);
const db = require(`${root}/server/datasources/cassandra.js`);
const io = require(`${root}/server/datasources/socket.js`).io;
const PollController = new (require(`${root}/server/controllers/PollController.js`))();
const PollectionController = new (require(`${root}/server/controllers/PollectionController.js`))();


router.post('/', coroutine(function* (req, res, next) {
  logger.info(req.body)
  const data = yield PollectionController.create(req.body, { validate: true })
  res.status(201).data = data;
  next();
}));


router.get('/:id', coroutine(function* (req, res, next) {
  const result = yield PollectionController.find(req.params.id);
  res.status(200).data = result;
  next();
}));


module.exports = router;

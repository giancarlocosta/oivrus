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

const SubmissionController = new (require(`${root}/server/controllers/SubmissionController.js`))();
const PollController = new (require(`${root}/server/controllers/PollController.js`))();
const PollectionController = new (require(`${root}/server/controllers/PollectionController.js`))();
const TagsByPollController = new (require(`${root}/server/controllers/TagsByPollController.js`))();

let SOCKET;
io.on('connection', function(socket) { SOCKET = socket; });
function emit(msgName, msg) { if (SOCKET) { SOCKET.emit(msgName, msg); } }


function getPollCounts(poll) {
  const rand = function () { return Math.floor(Math.random() * 20); }
  for (let i = 0; i < poll.choices.length; i++) {
    poll.choices[i].votes = rand();
  }
  return poll;
}

router.get('/', coroutine(function* (req, res, next) {
  const result = yield PollController.find(undefined, {
    queryFilters: req.query
  });
  res.status(200).data = result;
  next();
}));

router.get('/:id', coroutine(function* (req, res, next) {
  const result = yield PollController.find(req.params.id);
  res.status(200).data = result;
  next();
}));

router.get('/:id/results', coroutine(function* (req, res, next) {
  const poll = yield PollController.find(req.params.id);
  const result = getPollCounts(poll);
  const data = { data: result };
  res.status(200).json(data);
}));

router.get('/:id/tags', coroutine(function* (req, res, next) {
  const result = yield TagsByPollController.find(req.params.id, {
    queryFilters: req.query
  });
  res.status(200).data = result;
  next();
}));

router.post('/', coroutine(function* (req, res, next) {
  logger.info(req.body)
  const data = yield PollController.create(req.body, { validate: true })
  res.status(201).data = data;
  next();
}));


router.post('/:id/vote', coroutine(function* (req, res, next) {
  logger.info(req.body);
  const result = yield SubmissionController.submitPollVote(req.params.id, req.body, {})
  emit('msg', { pollId: req.params.id });
  res.status(201).json(result);
}));


router.post('/:id/seed-vote', coroutine(function* (req, res, next) {
  logger.info(req.body);
  // TODO
  const result = yield SubmissionController.submitPollVote(req.params.id, req.body, {})
  emit('msg', { pollId: req.params.id });
  res.status(201).json(result);
}));


module.exports = router;

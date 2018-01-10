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


let SOCKET;
io.on('connection', function(socket){
  SOCKET = socket;
})

function emit(msgName, msg) {
  console.log('MAYBE')
  if (SOCKET) {
    console.log('SENDING')
    SOCKET.emit(msgName, msg);
  }
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
  const total = yield db.client.execute(`SELECT count(*) FROM submission_by_choice where choice=? ALLOW FILTERING`, [db.models.uuidFromString(req.params.id)], { prepare: true });
  const result = { count: total.rows[0].count };
  const data = { data: result };
  res.status(200).json(data);
}));


module.exports = router;

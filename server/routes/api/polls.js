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
const TagsByPollController = new (require(`${root}/server/controllers/TagsByPollController.js`))();


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


/*
Proccess to submit a vote:
1. Check user_poll_status to see if use has already voted
(use caching since once a use has voted their status likely won't/shouldn't change)

2. Validate submission against Poll table (check valid choice etc) (use caching)

3. Submit to multiple tables, most importantly 'submission_by_poll'

4. Update user_poll_status using a little bit stricter consistency than normal,
but not so much as to degrade performance

The 'user_poll_status' and 'submission_by_poll' tables will be used together to
prevent double voting. Idea:

Use halfday to partition key in 'submission_by_poll' table.
This will make it's partitions smaller.
However it will also allow a use to possibly vote twice.
Voting twice is bad but not the end of the world so to prevent double voting:

Use 'user_poll_status' table with stricter (but not too strict) consistency.

Check 'user_poll_status' table everytime a voter submits.
IF they already submitted and this table is up to date due to the sweet-spot
consistency then fail.

IF they already submitted IN THE LAST 12 HOURS and this table is NOT up to date
due to the consistency then they will just overwrite their vote in this 12 hour (halfday) period

Eventually the source of truth table 'user_poll_status' will update and
prevent re-voting as it should.

To double vote a user would have to get lucky and be determined:
- They would have to wait 12 hours to submit a second vote that doesn't just overwrite itself
AND
- 'user_poll_status' table would have to have not updated for 12 hours (lol)
*/

router.post('/:id/vote', coroutine(function* (req, res, next) {
  logger.info(req.body);

  const poll = yield PollController.find(req.params.id);

  const ts = new Date().toISOString();
  const day = moment.utc(ts).startOf('day').toISOString();
  const hour = moment.utc(ts).startOf('hour').toISOString();

  let valid = false;
  console.log(poll.choices)
  for (let p = 0; p < poll.choices.length; p++) {
    const c = poll.choices[p];
    if (c.id.toString() === req.body.choice) {
      valid = true;
    }
  }
  if (!valid) {
    yield utils.rejectError('InvalidError', `Submitted choice '${req.body.choice}' not in available choices for poll '${poll.id}'`);
  }

  const submissionId = db.models.uuidFromString(uuid());
  const userId = db.models.uuidFromString(req.body.user || uuid());
  const pollId = db.models.uuidFromString(req.params.id);
  const choiceId = db.models.uuidFromString(req.body.choice);

  // Check if already voted
  const s = yield db.client.execute('SELECT * FROM user_poll_status WHERE user=? AND poll=?', [userId, pollId], { prepare: true });
  if (s.rows[0] && s.rows[0].status === 'voted') {
    //yield utils.rejectError('AlreadyExistsError', `User '${userId}' already voted on poll '${poll.id}'`);
  }

  let query, params;
  //
  query = `INSERT INTO submission (id, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, ts];
  yield db.client.execute(query, params, { prepare: true });

  //
  query = `INSERT INTO submission_by_choice_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, hour, ts];
  yield db.client.execute(query, params, { prepare: true });

  query = `INSERT INTO submission_by_poll_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, hour, ts];
  yield db.client.execute(query, params, { prepare: true });

  //
  query = `INSERT INTO submission_by_poll (submissionid, poll, choice, user, ts, halfday) VALUES (?, ?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, ts, day];
  yield db.client.execute(query, params, { prepare: true });

  //
  query = `INSERT INTO submission_by_choice (submissionid, poll, choice, user, ts, halfday) VALUES (?, ?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, ts, day];
  yield db.client.execute(query, params, { prepare: true });

  //
  query = `INSERT INTO submission_by_user (submissionid, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`;
  params = [ submissionId, pollId, choiceId, userId, ts];
  yield db.client.execute(query, params, { prepare: true });

  query = `INSERT INTO user_poll_status (user, poll, status) VALUES (?, ?, ?)`;
  params = [ userId, pollId, 'voted'];
  yield db.client.execute(query, params, { prepare: true });


  const data = { status: 'success' };
  emit('msg', { pollId: poll.id });
  res.status(201).json(data);
}));


router.post('/:id/seed-vote', coroutine(function* (req, res, next) {
  logger.info(req.body);

  const poll = db.models.uuidFromString(uuid());
  const choices = [uuid(), uuid(), uuid(), uuid()]

  for (let i = 0; i < 1; i++) {

    const submissionid = db.models.uuidFromString(uuid());
    // const poll = db.models.uuidFromString(req.params.id);
    // const choice = db.models.uuidFromString(req.body.choice);
    // const user = db.models.uuidFromString(req.body.user);
    const choice = db.models.uuidFromString(choices[Math.floor(Math.random() * choices.length)]);
    const user = db.models.uuidFromString(uuid());

    const ts = new Date().toISOString();
    const day = moment.utc(ts).startOf('day').toISOString();
    const hour = moment.utc(ts).startOf('hour').toISOString();

    let query, params;
    //
    query = `INSERT INTO submission (id, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`;
    params = [ submissionid, poll, choice, user, ts];
    yield db.client.execute(query, params, { prepare: true });

    //
    query = `INSERT INTO submission_by_choice_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`;
    params = [ submissionid, poll, choice, user, hour, ts];
    yield db.client.execute(query, params, { prepare: true });

    query = `INSERT INTO submission_by_poll_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`;
    params = [ submissionid, poll, choice, user, hour, ts];
    yield db.client.execute(query, params, { prepare: true });

    //
    query = `INSERT INTO submission_by_poll (submissionid, poll, choice, user, ts, halfday) VALUES (?, ?, ?, ?, ?, ?)`;
    params = [ submissionid, poll, choice, user, ts, day];
    yield db.client.execute(query, params, { prepare: true });

    //
    query = `INSERT INTO submission_by_user (submissionid, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`;
    params = [ submissionid, poll, choice, user, ts];
    yield db.client.execute(query, params, { prepare: true });

    query = `INSERT INTO user_poll_status (user, poll, status) VALUES (?, ?, ?)`;
    params = [ user, poll, 'voted'];
    yield db.client.execute(query, params, { prepare: true });

  }

  const data = { status: 'success' };
  emit('msg', { pollId: req.params.id });
  res.status(201).json(data);
}));


module.exports = router;
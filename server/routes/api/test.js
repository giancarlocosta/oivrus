const root = '../../..';
const coroutine = require('co-express');
const express = require('express');
const router = new express.Router();
const Promise = require('bluebird');
const co = Promise.coroutine;

const logger = new (require('service-logger'))(__filename);
const utils = require(`${root}/common/util.js`);
const db = require(`${root}/server/datasources/cassandra.js`);
const uuid = require('uuid/v4');
const moment = require('moment');

function getPoll(id) {
  const rand = function () { return Math.floor(Math.random() * 20); }
  const mockData = {
    1: {
      id: 'p1',
      name: 'Do you think Cardano will beat Eth?',
      choices: [{ id: 'c1.1', name: 'Yes' }, { id: 'c1.2', name: 'No' }, { id: 'c1.3', name: 'Maybe' }],
      results: [{ id: 'c1.1', name: 'Yes', votes: rand() }, { id: 'c1.2', name: 'No', votes: rand() }, { id: 'c1.3', name: 'Maybe', votes: rand() }]
    },
    2: {
      id: 'p2',
      name: 'Which crypto is your favorite?',
      choices: [{ id: 'c2.1', name: 'XRP' }, { id: 'c2.2', name: 'ETH' }, { id: 'c2.3', name: 'ADA' }],
      results: [{ id: 'c2.1', name: 'XRP', votes: rand() }, { id: 'c2.2', name: 'ETH', votes: rand() }, { id: 'c2.3', name: 'ADA', votes: rand() }],
    },
    3: {
      id: 'p3',
      name: 'What crypto are you most confident in?',
      choices: [{ id: 'c3.1', name: 'XRP' }, { id: 'c3.2', name: 'ETH' }, { id: 'c3.3', name: 'ADA' }],
      results: [{ id: 'c3.1', name: 'XRP', votes: rand() }, { id: 'c3.2', name: 'ETH', votes: rand() }, { id: 'c3.3', name: 'ADA', votes: rand() }]
    },
    4: {
      id: 'p4',
      name: 'How much do you have invested?',
      choices: [{ id: 'c4.1', name: '> 100' }, { id: 'c4.2', name: '> 1000' }, { id: 'c4.3', name: '> 10000' }],
      results: [{ id: 'c4.1', name: '> 100', votes: rand() }, { id: 'c4.2', name: '> 1000', votes: rand() }, { id: 'c4.3', name: '> 10000', votes: rand() }]
    }
  };

  return mockData[id];
}

router.get('/polls/:id', coroutine(function* (req, res, next) {
  const result = getPoll(req.params.id);
  const data = { data: result };
  res.status(200).json(data);
}));

router.post('/polls', coroutine(function* (req, res, next) {
  logger.info(req.body)
  const data = { id: 123 };
  res.status(201).json(data);
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

To double vote a user would have to get lucky and determined:
- They would have to wait 12 hours to submit a second vote that doesn't just overwrite itself
AND
- 'user_poll_status' table would have to have not updated for 12 hours (lol)
*/

router.post('/polls/:id/vote', coroutine(function* (req, res, next) {
  logger.info(req.body);

  const poll = db.models.uuidFromString(uuid());
  const choices = [uuid(), uuid(), uuid(), uuid()]

  for (let i = 0; i < 100000; i++) {

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
  res.status(201).json(data);
}));


module.exports = router;

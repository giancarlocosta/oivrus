const root = '../..';
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const moment = require('moment');
const logger = new (require('service-logger'))(__filename);

const ModelController = require(`./ModelController.js`);
const utils = require(`${root}/common/util.js`);
const db = require(`${root}/server/datasources/cassandra.js`);
const PollController = new (require(`${root}/server/controllers/PollController.js`))();

const CACHE_ENTRY_TIMEOUT = 10000;
const MAX_CACHE_ENTRIES = 100;
const CACHE_CLEAR_INTERVAL = 5000;

// Conisder https://github.com/aholstenson/transitory instead for weighted cache hit monitoring
const pollCache = new (require('memory-cache').Cache)();
setInterval(function() { if(pollCache.size() > MAX_CACHE_ENTRIES) { pollCache.clear(); } }, CACHE_CLEAR_INTERVAL);
const pollstatusCache = new (require('memory-cache').Cache)();
setInterval(function() { if(pollstatusCache.size() > MAX_CACHE_ENTRIES) { pollstatusCache.clear(); } }, CACHE_CLEAR_INTERVAL);


/**
* Class representing a Controller for group model.
* @extends ModelController
*/
class SubmissionController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'Submission');
  }


  /*
  Proccess to submit a vote:
  1. Validate submission against Poll table (check valid choice etc) (use caching)

  2. Check user_poll_status to see if use has already voted
  (use caching since once a use has voted their status likely won't/shouldn't change)

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
  submitPollVote(pollId, vote, options) {
    const self = this;
    return co(function* () {
      let result = {};

      logger.info(vote);
      let poll;
      if (pollCache.get(pollId)) {
        poll = pollCache.get(pollId);
      } else {
        poll = yield PollController.find(pollId);
        pollCache.put(pollId, poll, CACHE_ENTRY_TIMEOUT);
      }

      if (!_.find(poll.choices, function(c) { return c.id.toString() === vote.choice; })) {
        yield utils.rejectError('InvalidError', `Submitted choice '${vote.choice}' not in available choices for poll '${poll.id}'`);
      }

      const submissionIdC = db.models.uuidFromString(uuid());
      const userIdC = db.models.uuidFromString(vote.user || uuid());
      const pollIdC = db.models.uuidFromString(pollId);
      const choiceIdC = db.models.uuidFromString(vote.choice);

      const ts = new Date().toISOString();
      const day = moment.utc(ts).startOf('day').toISOString();
      const hour = moment.utc(ts).startOf('hour').toISOString();

      // Check if already voted
      let pollstatus;
      if (pollstatusCache.get(pollId)) {
        pollstatus = pollstatusCache.get(pollId);
      } else {
        pollstatus = (yield db.client.execute('SELECT * FROM user_poll_status WHERE user=? AND poll=?', [userIdC, pollIdC], { prepare: true })).rows[0];
        pollstatusCache.put(pollId, pollstatus, CACHE_ENTRY_TIMEOUT);
      }
      if (pollstatus && pollstatus.status === 'voted') {
        yield utils.rejectError('AlreadyExistsError', `User '${vote.user}' already voted on poll '${poll.id}'`);
      }

      const queries = [
        {
          query: `INSERT INTO submission (id, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, ts]
        },
        {
          query: `INSERT INTO submission_by_choice_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, hour, ts]
        },
        {
          query: `INSERT INTO submission_by_poll_hour (submissionid, poll, choice, user, hour, ts) VALUES (?, ?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, hour, ts]
        },
        {
          query: `INSERT INTO submission_by_poll (submissionid, poll, choice, user, ts, halfday) VALUES (?, ?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, ts, day]
        },
        {
          query: `INSERT INTO submission_by_choice (submissionid, poll, choice, user, ts, halfday) VALUES (?, ?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, ts, day]
        },
        {
          query: `INSERT INTO submission_by_user (submissionid, poll, choice, user, ts) VALUES (?, ?, ?, ?, ?)`,
          params: [ submissionIdC, pollIdC, choiceIdC, userIdC, ts]
        },
        {
          query: `INSERT INTO user_poll_status (user, poll, status) VALUES (?, ?, ?)`,
          params: [ userIdC, pollIdC, 'voted']
        }
      ];
      yield db.client.batch(queries, { prepare: true });

      return Promise.resolve(result);
    })();
  }


  /**
  * Use ModelController's list() or read() methods based on params
  * @param {string} resourceId - Id of resource to find. Declare this param as undefined if you want to list
  * @param {object} options - Query filters, etc.
  * @return {Promise<object|array|Error>}
  *   on success resolve with found object or array of found objects
  *   else reject with error
  */
  find(resourceId, options) {
    const self = this;
    return co(function* () {
      let result = {};

      if (!resourceId) {

        result = yield self.list({}, {doPage: true, page: options.queryFilters.page, limit: options.queryFilters.limit});
        const total = yield db.client.execute(`SELECT count(*) FROM submission`, [], {});
        result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
      } else {
        result = yield self.read({ name: resourceId });
        // result = yield self.read({ id: db.models.uuidFromString(resourceId) });
      }

      return Promise.resolve(result);
    })();
  }
}


module.exports = SubmissionController;

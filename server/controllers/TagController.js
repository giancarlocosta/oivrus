const root = '../..';
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const logger = new (require('service-logger'))(__filename);
const ModelController = require(`./ModelController.js`);
const utils = require(root + '/common/util.js');

const db = require(root + '/server/datasources/cassandra.js');

const PollController = new (require(`${root}/server/controllers/PollController.js`))();
const UserController = new (require(`${root}/server/controllers/UserController.js`))();

const PollsByTagController = new (require(`${root}/server/controllers/PollsByTagController.js`))();
const UsersByTagController = new (require(`${root}/server/controllers/UsersByTagController.js`))();

const TagsByUserController = new (require(`${root}/server/controllers/TagsByUserController.js`))();
const TagsByPollController = new (require(`${root}/server/controllers/TagsByPollController.js`))();


/**
* Class representing a Controller for group model.
* @extends ModelController
*/
class TagController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'Tag');
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
        const total = yield db.client.execute(`SELECT count(*) FROM tag`, [], {});
        result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
      } else {
        result = yield self.read({ name: resourceId });
        // result = yield self.read({ id: db.models.uuidFromString(resourceId) });
      }

      return Promise.resolve(result);
    })();
  }


  addTagToUser(tagName, userId, options) {
    const self = this;
    return co(function* () {
      let result = {};
      const queries = [
        {
          query: 'INSERT INTO users_by_tag (tag, user) VALUES (?, ?)',
          params: [ tagName, db.models.uuidFromString(userId) ]
        },
        {
          query: 'INSERT INTO tags_by_user (tag, user) VALUES (?, ?)',
          params: [ tagName, db.models.uuidFromString(userId) ]
        }
      ];
      yield db.client.batch(queries, { prepare: true });
      return Promise.resolve(result);
    })();
  }

  removeTagFromUser(tagName, userId, options) {
    const self = this;
    return co(function* () {
      let result = {};
      const queries = [
        {
          query: 'DELETE FROM users_by_tag WHERE tag=? AND user=?',
          params: [ tagName, db.models.uuidFromString(userId) ]
        },
        {
          query: 'DELETE FROM tags_by_user WHERE tag=? AND user=?',
          params: [ tagName, db.models.uuidFromString(userId) ]
        }
      ];
      yield db.client.batch(queries, { prepare: true });
      return Promise.resolve(result);
    })();
  }

  addTagToPoll(tagName, pollId, options) {
    const self = this;
    return co(function* () {
      let result = {};
      const queries = [
        {
          query: 'INSERT INTO polls_by_tag (tag, poll) VALUES (?, ?)',
          params: [ tagName, db.models.uuidFromString(pollId) ]
        },
        {
          query: 'INSERT INTO tags_by_poll (tag, poll) VALUES (?, ?)',
          params: [ tagName, db.models.uuidFromString(pollId) ]
        }
      ];
      yield db.client.batch(queries, { prepare: true });
      return Promise.resolve(result);
    })();
  }

  removeTagFromPoll(tagName, pollId, options) {
    const self = this;
    return co(function* () {
      let result = {};
      const queries = [
        {
          query: 'DELETE FROM polls_by_tag WHERE tag=? AND poll=?',
          params: [ tagName, db.models.uuidFromString(pollId) ]
        },
        {
          query: 'DELETE FROM tags_by_poll WHERE tag=? AND poll=?',
          params: [ tagName, db.models.uuidFromString(pollId) ]
        }
      ];
      yield db.client.batch(queries, { prepare: true });
      return Promise.resolve(result);
    })();
  }
}


module.exports = TagController;

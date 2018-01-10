const root = '../..';
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const logger = new (require('service-logger'))(__filename);
const ModelController = require(`./ModelController.js`);
const utils = require(root + '/common/util.js');

const db = require(root + '/server/datasources/cassandra.js');


/**
* Class representing a Controller for group model.
* @extends ModelController
*/
class UsersByTagController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'UsersByTag');
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
      options.queryFilters = options.queryFilters || {};
      
      let result = {};

      if (options.queryFilters.tag) {

        const filters = { tag: options.queryFilters.tag };
        if (options.queryFilters.user) {
          filters.user = db.models.uuidFromString(options.queryFilters.user);
          result = yield self.read(filters);
        } else {
          result = yield self.list(filters, {doPage: true, page: options.queryFilters.page, limit: options.queryFilters.limit});
        }

      } else {

        result = yield self.list({}, {doPage: true, page: options.queryFilters.page, limit: options.queryFilters.limit});
        const total = yield db.client.execute(`SELECT count(*) FROM users_by_tag`, [], {});
        result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
      }

      return Promise.resolve(result);
    })();
  }
}


module.exports = UsersByTagController;
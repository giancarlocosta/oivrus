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
class PollsByTagController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'PollsByTag');
  }

  /**
  * Use ModelController's list() or read() methods based on params
  * @param {string} resourceId - Id of resource to find. Declare this param as undefined if you want to list
  * @param {object} options - Query filters, etc.
  * @return {Promise<object|array|Error>}
  *   on success resolve with found object or array of found objects
  *   else reject with error
  */
  find(tag, options = {}) {
    const self = this;
    return co(function* () {
      options.queryFilters = options.queryFilters || {};

      let result = {};

      const filters = { tag: tag };
      if (options.queryFilters.poll) {
        filters.poll = db.models.uuidFromString(options.queryFilters.poll);
        result = yield self.read(filters);
      } else {
        result = yield self.list(filters, {doPage: true, page: options.queryFilters.page, limit: options.queryFilters.limit});
      }

      return Promise.resolve(result);
    })();
  }

}


module.exports = PollsByTagController;

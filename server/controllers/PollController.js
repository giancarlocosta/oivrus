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
class PollController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'Poll');
  }

  create(data, options = {}) {
    const self = this;
    return co(function* () {

      // Validate
      if (options.validate) {
        yield self.validateModel(data, options.validateSchemaName || 'poll.json#poll-create');
      }

      data.id = uuid();

      // TODO UPDATE choices so you don't overwrite them
      for (let i = 0; i < data.choices.length; i++) {
        const choice = data.choices[i];
        choice.id = uuid();
      }


      // Save event in DB
      try {
        const poll = self.convertUUIDs(data);
        console.log(poll);
        const OrmInstance = self.ormInstance;
        const instance = new OrmInstance(utils.objToLower(poll));
        const ormOptions = options;
        const result = yield instance.saveAsync(ormOptions);
        yield self.checkTransaction(result, 'POST');

      } catch (saveErr) {
        logger.error(`Error saving event: ${JSON.stringify(poll)}`);
        throw saveErr;
      }

      return Promise.resolve(data);
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
        const total = yield db.client.execute(`SELECT count(*) FROM poll`, [], {});
        result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
      } else {
        result = yield self.read({ id: db.models.uuidFromString(resourceId) });
      }

      return Promise.resolve(result);
    })();
  }
}


module.exports = PollController;

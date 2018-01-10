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
class PollectionController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'Pollection');
  }

  create(data, options = {}) {
    const self = this;
    return co(function* () {

      // Validate
      if (options.validate) {
        yield self.validateModel(data, options.validateSchemaName || 'pollection.json#pollection-create');
      }

      data.id = uuid();

      data = self.convertUUIDs(data);

      // Save event in DB
      try {
        const OrmInstance = self.ormInstance;
        const instance = new OrmInstance(utils.objToLower(data));
        const ormOptions = options;
        const result = yield instance.saveAsync(ormOptions);
        yield self.checkTransaction(result, 'POST');

      } catch (saveErr) {
        logger.error(`Error saving event: ${JSON.stringify(data)}`);
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
        const total = yield db.client.execute(`SELECT count(*) FROM pollection`, [], {});
        result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
      } else {
        result = yield self.read({ id: db.models.uuidFromString(resourceId) });
      }

      return Promise.resolve(result);
    })();
  }
}


module.exports = PollectionController;

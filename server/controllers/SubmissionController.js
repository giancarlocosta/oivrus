const root = '../..';
const uuid = require('uuid/v4');
const Promise = require('bluebird');
const co = Promise.coroutine;
const requestContext = require('request-context');
const logger = new (require('service-logger'))(__filename);
const ModelController = require(`./ModelController.js`);
const utils = require(root + '/common/util.js');

const evtLogger = new (require('event-logger'))('evs-events');
const evsEvents = evtLogger.getEventMap('evs-events');

const db = require(root + '/server/datasources/cassandra.js');
const ExternalServiceController = require(`${root}/server/controllers/ExternalServiceController.js`);

/**
* Class representing a Controller for period model.
* @extends ModelController
*/
class SubmissionController extends ModelController {

  /**
  * @constructor
  * @param {string} model - Model used by ModelController
  * @param {object} options - Optional params
  */
  constructor(model, options) {
    super(model || 'Event');
  }


  /**
  * Use ModelController's list() or read() methods based on params
  * @param {string} resourceId - Id of resource to find. Declare this param as undefined if you want to list
  * @param {object} options - Query filters, etc.
  * @return {Promise<object|array|Error>}
  *   on success resolve with found object or array of found objects
  *   else reject with error
  */
  async create(data, options = {}) {

    // Validate
    if (options.validate) {
      await this.validateModel(data, options.validateSchemaName || `${this._modelType}.json`);
    }

    // Get the corresponding Event-Logger config event or default if none match
    const configEvent = evsEvents[data.key] || evsEvents.DEFAULT_EVENT || {};

    data.id = uuid();
    data.severity = data.severity ? data.severity : 'info';
    data.key = configEvent.key;
    data.code = configEvent.code;
    data.entity = configEvent.entity;
    data.domain = configEvent.domain;
    data.description = configEvent.description;
    data.election = data.election || requestContext.get('request:electionId');
    data.voter = data.voter || requestContext.get('request:voterId');
    data.period = data.period || requestContext.get('request:periodId');
    data.voterextref = data.voterextref || requestContext.get('request:voterextref');
    data.metadata = data.metadata || {};
    data.metadata.received_time = new Date().toISOString();
    data.metadata.ballotstyle = data.metadata.ballotstyle || requestContext.get('request:ballotsyleId') || '';

    // Save event in DB
    try {
      const OrmInstance = this.ormInstance;
      const instance = new OrmInstance(utils.objToLower(data));
      const ormOptions = options;
      const result = await instance.saveAsync(ormOptions);
      await this.checkTransaction(result, 'POST');
    } catch (saveErr) {
      logger.error(`Error saving event: ${JSON.stringify(data)}`);
      throw saveErr;
    }

    return data;
  }


  /**
  * Use ModelController's list() or read() methods based on params
  * @param {string} resourceId - Id of resource to find. Declare this param as undefined if you want to list
  * @param {object} options - Query filters, etc.
  * @return {Promise<object|array|Error>}
  *   on success resolve with found object or array of found objects
  *   else reject with error
  */
  async find(resourceId, options) {

    let result = {};

    if (resourceId) {
      result = await this.read({ id: resourceId });
    } else {

      const filters = {};

      let query = `SELECT * FROM event`;

      let filterAdded = false;

      if (utils.exists(options.queryFilters.electionId)) {
        if (filterAdded) { query += ` AND `; } else { filterAdded = true; query += ` WHERE `; }
        query += ` election = '${options.queryFilters.electionId}'`;
      }

      if (utils.exists(options.queryFilters.voterId)) {
        if (filterAdded) { query += ` AND `; } else { filterAdded = true; query += ` WHERE `; }
        query += ` voter = '${options.queryFilters.voterId}'`;
      }

      query += ' ALLOW FILTERING';

      result = (await db.client.execute(query)).rows;

      // const total = await db.client.execute(`SELECT count(*) FROM event`, [], {});
      // result._meta = { totalItems: parseInt(total.rows[0].count, 10) };
    }

    return result;
  }

}


module.exports = SubmissionController;

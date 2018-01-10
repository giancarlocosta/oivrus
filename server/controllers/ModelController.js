const root = '../..';
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const logger = new (require('service-logger'))(__filename);
const utils = require(`${root}/common/util.js`);
const schemas = require(`${root}/common/data-schemas.js`);

const db = require('../datasources/cassandra.js');


/**
* Base Class representing a Controller for a model.
*/
class ModelController {

  /**
  * @constructor
  * @param {string} modelType - Name of model to use to get a Cassandra ORM
  * instance/model + use as schema identifier when validating against
  * evs-data-schemas (unless you specify a different schema when validating)
  */
  constructor(modelType) {
    this._modelType = modelType;
    // Make sure the modelType refers to one of the defined cassandra models
    setTimeout(function () {
      if (!db.models.instance[modelType]) { throw new Error(`No ORM Model found for Model type: ${modelType}`); }
    }, 1000);
  }

  get ormInstance() {
    const modelType = this._modelType.charAt(0).toUpperCase() + this._modelType.slice(1);
    const ormInstance = db.models.instance[modelType];
    if (!ormInstance) { throw new Error(`No ORM Model found for Model type: ${modelType}`); }
    return ormInstance;
  }

  async checkTransaction(result, reqType) {
    if (result && result.rows) {
      for (let i = 0; i < result.rows.length; i++) {
        if (result.rows[i]['[applied]'] === false) {
          if (reqType === 'PUT') {
            await utils.rejectError('NotFoundError');
          } else if (reqType === 'POST') {
            await utils.rejectError('AlreadyExistsError');
          }
        }
      }
    }
    return;
  }

  /*
  ****************************************************************************
  * CRUD
  *****************************************************************************
  */

  async create(data, options = {}) {

    const ormOptions = options;
    if (options.validate) {
      await this.validateModel(data, options.validateSchemaName || `${this._modelType}.json#${this._modelType}-create`);
    }
    data.id = uuid();
    const OrmInstance = this.ormInstance;
    const instance = new OrmInstance(utils.objToLower(this.convertUUIDs(origObj)));
    const result = await instance.saveAsync(ormOptions);
    await this.checkTransaction(result, 'POST');
    return data;
  }


  async read(queryObject, options = {}) {


    const ormOptions = options.ormOptions || { raw: true };

    const result = await this.ormInstance.findOneAsync(queryObject, ormOptions);
    if (!result) {
      await Promise.reject(new Error('NotFoundError'));
    }

    return result;
  }


  async update(queryObject, updateObject, options = {if_exists: false}) {

    if (options.validate) {
      await this.validateModel(updateObject, options.validateSchemaName || `${this._modelType}.json#${this._modelType}-create`);
    }
    delete updateObject.id;
    const result = await this.ormInstance.updateAsync(queryObject, utils.objToLower(updateObject), options);
    await this.checkTransaction(result, 'PUT');
    updateObject.id = queryObject.id;
    return updateObject;
  }


  async delete(queryObject) {

    const result = await this.ormInstance.deleteAsync(queryObject);
    return result;
  }


  getPage(queryObject = {}, options = {}) {
    const self = this;
    return new Promise(function(resolve, reject) {

      const page = options.page;
      const fetchSize = options.fetchSize;
      const results = [];

      let currentPage = 0;

      // Invoked per each row in all the pages
      const processRow = function(n, row) {
        if (currentPage === page) {
          results.push(row);
        }
      };

      // Called once the page has been retrieved.
      const processPage = function(err, result) {
        if (err) {
          return reject(err);
        }

        // logger.debug(`Got page ${currentPage}. Aiming for page ${page}`);
        if (currentPage === page) {
          return resolve(results);
        }
        currentPage++;
        if (currentPage <= page) {
          // Retrieve the next page: processRow will then be used
          if (result.nextPage) {
            result.nextPage();
          } else {
            const e = new Error('NotFoundError');
            e.clientMesssage = `Not that many pages!`;
            return reject(e);
          }
        }

      };

      self.ormInstance.eachRow(queryObject, { fetchSize: fetchSize }, processRow, processPage);
    });
  }


  async list(queryObject = {}, options = {}) {


    const ormOptions = options.ormOptions || { raw: true };
    ormOptions.fetchSize = options.limit;
    ormOptions.page = options.page || 0;

    let results = [];

    if (options.doPage) {
      results = await this.getPage(queryObject, ormOptions);
    } else {
      results = await this.ormInstance.findAsync(queryObject, ormOptions);
    }

    return results;
  }


  async updateBulk(queryObjects, options = {if_exists: true}) {

    for (let i = 0; i < queryObjects.length; i++) {
      const queryObject = queryObjects[i];
      await this.update({ id: queryObject.id }, queryObject, {if_exists: true});
    }
    return;
  }


  async createBulk(queryObjects, options = {}) {

    for (let i = 0; i < queryObjects.length; i++) {
      await this.create(queryObjects[i], options);
    }
    return;
  }


  /*
  ****************************************************************************
  * Validators
  *****************************************************************************
  */

  /**
  * Meant to validate JSON from clients. Define validations for cassandra
  * models in the cassandra model definitions
  */
  async validateModel(data, schema) {


    if (schema) {
      if (!schemas.validator.validate(schema, data)) {
        await utils.rejectError('InvalidError', JSON.stringify(schemas.validator.errors));
      }
    } else {
      if (!schemas.validator.validate(`${this._modelType}`, data)) {
        await utils.rejectError('InvalidError', JSON.stringify(schemas.validator.errors));
      }
    }
    return;
  }


  convertUUIDs(origObj) {

    const schema = this.ormInstance._properties.schema.fields;
    const origCopy = _.cloneDeep(origObj);
    const newObj = _.transform(origCopy, function(result, val, key) {
      if (schema[key] === 'uuid') {
        if (val && val.length > 0) {
          result[key] = db.models.uuidFromString(val);
        } else {
          result[key] = undefined;
        }
      } else {
        result[key] = val;
      }
    });
    return newObj;
  }


  modelSchema() {
    return this._schema;
  }
}

module.exports = ModelController;

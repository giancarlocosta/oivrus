const fs = require('fs');
const path = require('path');
const requestContext = require('request-context');
const logger = new (require('service-logger'))(__filename);

const MIN_PAGE_SIZE = parseInt(process.env.MIN_PAGE_SIZE, 10);
const MAX_PAGE_SIZE = parseInt(process.env.MAX_PAGE_SIZE, 10);
const DEFAULT_PAGE_SIZE = parseInt(process.env.DEFAULT_PAGE_SIZE, 10);

/**
* Map routes from the passed Router to any routes exposed by a file or
* directory in the passed dirname.
* @param {Object} router - Express router to map routes from
* @param {string} dirname - Any router in this dir will be mapped to the passed
*   router
*/
function mapRoutes(router, dirname) {
  fs.readdirSync(dirname).forEach((file) => {
    const filename = path.parse(file).name;
    const filepath = dirname + '/' + file;
    const fileIsDir = fs.lstatSync(filepath).isDirectory();
    const route = require(filepath);

    // Only map routes if the file/dir exposes/exports an express Router
    // Check if Router by checking if file has use() function
    if (route.use) {
      if (filename !== 'index') {
        router.use('/' + filename, route);
      }
    }
  });
}


/**
* Disable client caching of response
*/
function disableCaching(req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
}


/**
* Add vars to context of this request
*/
function setRequestContext(req, res, next) {

  requestContext.set('request:requestId', req.id);
  requestContext.set('request:electionId', req.query.election || req.query.e);
  requestContext.set('request:voterId', req.query.voter || req.query.v);
  requestContext.set('request:periodId', req.query.period || req.query.p);
  requestContext.set('request:ballotstyleId', req.query.ballotstyle || req.query.b);

  next();
}


/**
* Parse query params of an Express Request object and modify it to contain
* info needed by routes
*/
function parseQueryParams(req, res, next) {

  // election || e, period || p, ballotstyle || b
  req.query.electionId = req.query.election || req.query.e;
  req.query.periodId = req.query.period || req.query.p;
  req.query.ballotstyleId = req.query.ballotstyle || req.query.b;
  req.query.voterId = req.query.voter || req.query.v;

  // Filter options
  req.query.expanded = req.query.expanded === 'true' ? true : false;

  // Pagination
  const page = parseInt(req.query.page, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE;
  req.query.limit = limit >= MIN_PAGE_SIZE && limit <= MAX_PAGE_SIZE ? limit : DEFAULT_PAGE_SIZE;
  req.query.page = page > -1 ? page : 0;

  next();
}


/**
* Send uniform response format
*/
function formatResponse(req, res, next) {

  if (res.statusCode === 404) {
    return res.send(`Invalid URL: ${req.originalUrl}`);
  }

  const rawData = res.data;
  const metaData = res.data ? res.data._meta : undefined;

  const formatted = {
    data: rawData || {}
  };

  if (req.method === 'GET') {

    // Pagination
    if ( Array.isArray(formatted.data) ) {
      formatted.pages = {
        index: req.query.page,
        total: 1,
        items: formatted.data.length >= 0 ? formatted.data.length : 1
      };

      if (metaData) {
        if (metaData.totalItems && formatted.pages.items > 0) {
          formatted.pages.total = Math.ceil(metaData.totalItems / req.query.limit);
          formatted.pages.index = formatted.pages.index > formatted.pages.total ? formatted.pages.total : formatted.pages.index;
        }
        delete rawData._meta;
      }
    }
  }

  res.json(formatted);
}


module.exports = {
  mapRoutes,
  parseQueryParams,
  formatResponse,
  setRequestContext,
  disableCaching
};

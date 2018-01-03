const root = '../..';

const express = require('express');
const router = new express.Router();

const middleware = require(root + '/middleware');
const coroutine = require('co-express');
const hpp = require('hpp');

// Don't allow arrays of query parameters
router.use(hpp());

// Add middleware specific to this route if necessary
router.use(middleware.util.parseQueryParams);
router.use(coroutine(function* (req, res, next) {
  // Default status is 404. Set in individual routes!
  res.status(404);
  next();
}));

// Maps /api/{filename or foldername} to Router exported by that file or the
// index.js file in that {foldername}
middleware.util.mapRoutes(router, __dirname);

// Response formatting
router.use(middleware.util.formatResponse);

module.exports = router;

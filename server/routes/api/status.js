const root = '../../..';

const coroutine = require('co-express');

const express = require('express');
const router = new express.Router();

const crypto = require('crypto');
const fs = require('fs-promise');
const os = require('os');

const utils = require(`${root}/common/util.js`);
const db = require(`${root}/server/datasources/cassandra.js`);


router.get('/', coroutine(function* (req, res, next) {

  // Gather basic service info
  const name = 'submission-service';
  const version = process.env.npm_package_version;

  // Gather system-related statistics
  const system = {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    uptime: os.uptime(),
    cpus: os.cpus(),
    loadavg: os.loadavg(),
    freemem: os.freemem(),
    totalmem: os.totalmem(),
    network: os.networkInterfaces(),
    user: os.userInfo(),
    fips: !!crypto.fips
  };

  // TODO: check database connection health
  //yield db.healthCheck().catch((err) => { return utils.rejectError('ExternalRequestError', `DB Healthcheck error: ${err.message}`); });
  const database = 'connected';

  // Determine overall operational state
  const state = 'operational';

  // Assemble the final status report
  const status = { name, state, version, system, database };
  res.status(200).json(status);

}));


router.get('/webpage', coroutine(function* (req, res, next) {
  var path = require('path');
  res.status(200).sendFile(path.resolve(`${__dirname}/../static/webpage.html`));
}));

router.get('/portal', coroutine(function* (req, res, next) {
  var path = require('path');
  res.status(200).sendFile(path.resolve(`${__dirname}/../static/portal.html`));
}));


module.exports = router;

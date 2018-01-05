/* *****************************************************************************
* ENVIRONMENT VARIABLES
*******************************************************************************/

const env = require('./configs/env.js');

/* *****************************************************************************
* EXPRESS SERVER APP
*******************************************************************************/

const Promise = require('bluebird');
const bodyParser = require('body-parser');
const https = require('https');
const http = require('http');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');
const prom = require('express-prom-bundle');
const requestId = require('express-request-id');
const requestContext = require('request-context');
const express = require('express');
const logger = new (require('service-logger'))(__filename);
const utils = require('../common/util.js');

const app = express();

const httpServer = http.Server(app);
const io = require('socket.io')(httpServer);

app.use(cors())

// Default server parameters
const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';
const SERVER_PORT = parseInt(process.env.SERVER_PORT, 10) || 3000;
const DEFAULT_ROOT = '/api';

// Before your code is require()-ed, hook the loader for coverage
if (process.env.COVERAGE === 'true') { utils.instrument(app); }

const db = require('./datasources/cassandra.js');
const routes = require('./routes/api');
const middleware = require('./middleware');


// Wrap every request in a 'request' namespace/context that can hold context vars
// for other functions to access
app.use(requestContext.middleware('request'));

// Automagically create a metrics endpoint for use by Prometheus
app.use(prom({includeStatusCode: true, includeMethod: true, includePath: true}));

// Add a unique ID to each request if one not provided by the requestor
app.use(requestId());

// Make two log entries for each request, one before process and one after
app.use(morgan(':date[iso] - notice: :remote-addr ":method :url" :req[X-Request-Id]', {immediate: true}));
app.use(morgan(':date[iso] - notice: :remote-addr ":method :url" :status :res[content-length] :res[X-Request-Id]'));

// Enable middleware for automatically parsing JSON
app.use(bodyParser.json());

// These two middlewares provide numerous security enhancements
app.use(helmet());
app.use(hpp());

// Add request id and other vars to the request context for routes to use
app.use(middleware.util.setRequestContext);

// Configure routes
app.use(DEFAULT_ROOT, routes);

// Dev environments only
if (process.env.NODE_ENV !== 'production') { utils.enableDevHooks(app); }

// Error handling middleware for known and unknown errors
app.use(middleware.error.errorHandler);
process.on('uncaughtException', middleware.error.uncaughtExceptionHandler);

// If the service writes any local files, restrict their permissions
process.umask(0o0077);


/* *****************************************************************************
* SUBMISSION SERVICE API SERVER
******************************************************************************/

env.logDBVars();

Promise.coroutine(function* () {
  try {

    // Do pre-server-start initialization

    logger.notice(`Connecting to DB...`);
    yield db.connect();
    logger.notice(`Connected to DB.`);

    // Start the server
    //http.createServer(app).listen(SERVER_PORT, SERVER_HOST, () => {
    httpServer.listen(SERVER_PORT, SERVER_HOST, () => {
      // This pid file is used by killservice.sh during testing. See package.json
      fs.appendFileSync(`/tmp/submission-service-process-pids`, `${process.pid}\n`);
      logger.notice(`submission-service PID: ${process.pid}`);
      logger.notice(`Server at ${SERVER_HOST}:${SERVER_PORT}${DEFAULT_ROOT}`);
    });
    io.on('connection', function(socket){
      console.log('a user connected');
      socket.on('disconnect', function(){
        console.log('user disconnected');
      });
      socket.emit('msg', 'from server');
      socket.on('widget', function(msg){
        console.log('widget'); console.log(msg);
      });
      socket.on('poll', function(msg){
        console.log('poll'); console.log(msg);
      });
    });

  } catch (startupErr) {
    middleware.error.uncaughtExceptionHandler(startupErr);
  }
})();

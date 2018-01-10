const Promise = require('bluebird');
const logger = new (require('service-logger'))(__filename);
const co = Promise.coroutine;

let STATIC_IO;

class IO {
  constructor(httpServer) {
    console.log(1)
    STATIC_IO = require('socket.io')(httpServer);
  }

  static get io() {
    return STATIC_IO;
  }

  io() {
    return STATIC_IO;
  }

}

module.exports = IO;

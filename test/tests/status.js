const testUtils = require('../test-utils.js');

const request = require('request-promise');
const Promise = require('bluebird');
const async = Promise.coroutine;

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const should = chai.should();

chai.use(chaiHttp);

const SCHEMAS_DIR = '../schemas';
const API_URL = process.env.API_URL || `http://0.0.0.0:3000`;


describe('Utility APIs: ', function() {

  this.timeout(5000);

  it('Ping endpoint returns successfully after waiting for server to be ready', done => {
    testUtils.wait(1000).then(() => {
      return chai.request(API_URL).get('/api/ping');
    }).then(response => {
      response.should.have.status(204);
      done();
    }).catch(error => {
      done(error);
    });
  });

  it('Status endpoint returns successfully and contains expected data', done => {
    chai.request(API_URL).get('/api/status').then(response => {
      response.should.have.status(200);
      const body = response.body;
      body.should.be.an('object');
      body.name.should.equal('submission-service');
      body.state.should.equal('operational');
      body.hash.should.match(/[a-f0-9]{64}/);
      body.system.should.be.an('object');
      body.database.should.equal('connected');
      done();
    }).catch(error => {
      done(error);
    });
  });

});

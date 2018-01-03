'use strict';

const _ = require('lodash');
const testUtils = require('../test-utils.js');

const request = require('request-promise');
const Promise = require('bluebird');
const co = Promise.coroutine;

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

const SCHEMAS_DIR = '../schemas';
const API_URL = process.env.API_URL || `http://0.0.0.0:3000`;


describe('Events Test', function() {
  this.timeout(5000);

  before(function(done) {
    co(function* () {
      yield testUtils.resetMockService().catch((err) => { done(err); });
      yield testUtils.wipeDB(done).catch((err) => { done(err); });
    })();
  });


  /*
  ******************************************************************************
  * POST
  ******************************************************************************
  */
  describe('POST /events', () => {

    beforeEach(function(done) {
      co(function* () {
        yield testUtils.resetMockService();
        done();
      })();
    });


    // NORMAL OPERATION


    it('POST valid event with Event key that exists in Event Logger config map', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: 'Event test submission',
            key: 'AUTHENTICATION_SUCCESS', source: 'election-service'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          const res = yield chai.request(API_URL).post(`/api/events`).send(evt);
          res.should.have.status(201);
          const eventId = res.body.data.id;

          // GET new event and check
          const newEvent = (yield request.get(`${API_URL}/api/events/${eventId}`, { json: true })).data;
          expect(newEvent.key).to.equal(evt.key);
          expect(newEvent.severity).to.equal('info');
          expect(newEvent.timestamp).to.equal(evt.timestamp);
          expect(newEvent.source).to.equal(evt.source);
          testUtils.validateSchema(newEvent, 'event');
          done();
        } catch (err) {
          done(err);
        }
      })();
    });


    it('POST valid event with content array with Event key that exists in Event Logger config map', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: ['message1', 'message2'],
            key: 'AUTHENTICATION_SUCCESS', source: 'election-service'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          const res = yield chai.request(API_URL).post(`/api/events`).send(evt);
          res.should.have.status(201);
          const eventId = res.body.data.id;

          // GET new event and check
          const newEvent = (yield request.get(`${API_URL}/api/events/${eventId}`, { json: true })).data;
          expect(newEvent.key).to.equal(evt.key);
          expect(newEvent.severity).to.equal('info');
          expect(newEvent.timestamp).to.equal(evt.timestamp);
          expect(newEvent.source).to.equal(evt.source);
          testUtils.validateSchema(newEvent, 'event');
          done();
        } catch (err) {
          done(err);
        }
      })();
    });


    it('POST valid event with Event key that DOES NOT exist in Event Logger config map', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: 'Test',
            key: 'NON_EXISTENT_KEY', source: 'election-service'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          const res = yield chai.request(API_URL).post(`/api/events`).send(evt);
          res.should.have.status(201);
          const eventId = res.body.data.id;

          // GET new event and check
          const newEvent = (yield request.get(`${API_URL}/api/events/${eventId}`, { json: true })).data;
          expect(newEvent.key).to.equal('DEFAULT_EVENT');
          expect(newEvent.code).to.equal(0);
          expect(newEvent.severity).to.equal('info');
          expect(newEvent.timestamp).to.equal(evt.timestamp);
          expect(newEvent.source).to.equal(evt.source);
          testUtils.validateSchema(newEvent, 'event');
          done();
        } catch (err) {
          done(err);
        }
      })();
    });


    it('POST valid event and check for optional keys', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: 'Test',
            key: 'NON_EXISTENT_KEY', source: 'election-service',
            election: 'e1', period: 'p1', voter: 'v1'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          const res = yield chai.request(API_URL).post(`/api/events`).send(evt);
          res.should.have.status(201);
          const eventId = res.body.data.id;

          // GET new event and check
          const newEvent = (yield request.get(`${API_URL}/api/events/${eventId}`, { json: true })).data;
          expect(newEvent.key).to.equal('DEFAULT_EVENT');
          expect(newEvent.code).to.equal(0);
          expect(newEvent.severity).to.equal('info');
          expect(newEvent.timestamp).to.equal(evt.timestamp);
          expect(newEvent.source).to.equal(evt.source);
          expect(newEvent.election).to.equal(evt.election);
          expect(newEvent.period).to.equal(evt.period);
          expect(newEvent.voter).to.equal(evt.voter);
          testUtils.validateSchema(newEvent, 'event');
          done();
        } catch (err) {
          done(err);
        }
      })();
    });

    // ERROR CHECKS

    it('ERROR Check - 400(4000) - Invalid Event schema', (done) => {
      co(function* () {
        try {

          const evt = {
            content: 'Test' // missing 'timestamp'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          try {
            yield chai.request(API_URL).post(`/api/events`).send(evt);
            done(new Error('No error returned from server! :('));
          } catch (err) {
            expect(err.status).to.equal(400);
            expect(err.response.body.code).to.equal(4000);
            done();
          }
        } catch (err) {
          done(err);
        }
      })();
    });


    it('ERROR Check - 502(5020) - HTTP error communicating with external event API', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: 'Test',
            key: 'NON_EXISTENT_KEY', source: 'election-service',
            election: 'e1', period: 'p1', voter: 'v1'
          };

          // Set mock Services' responses first
          yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' }, { statusCode: 400 });
          yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
            data: {
              idtoextrefmap: {
                'e1': 'e1-extref',
                'p1': 'p1-extref'
              }
            }
          });

          try {
            yield chai.request(API_URL).post(`/api/events`).send(evt);
            done(new Error('No error returned from server! :('));
          } catch (err) {
            expect(err.status).to.equal(502);
            expect(err.response.body.code).to.equal(5020);
            done();
          }
        } catch (err) {
          done(err);
        }
      })();
    });

  });


  describe('GET /events', () => {

    beforeEach(function(done) {
      co(function* () {
        yield testUtils.resetMockService();
        yield testUtils.wipeDB(done).catch((err) => { done(err); });
      })();
    });


    // NORMAL OPERATION


    it('GET all', (done) => {
      co(function* () {
        try {

          const evt = {
            timestamp: '2017-07-20T17:18:59.553Z', content: 'Event',
            key: 'AUTHENTICATION_SUCCESS', source: 'election-service'
          };

          const numEvents = 5;

          for (let i = 0; i < numEvents; i++) {
            // Set mock Services' responses first
            yield testUtils.mockServiceResponse('POST', null, `/bg/log_event`, { status: 'success' });
            yield testUtils.mockServiceResponse('GET', null, `/api/metadata/e1`, {
              data: {
                idtoextrefmap: {
                  'e1': 'e1-extref',
                  'p1': 'p1-extref'
                }
              }
            });

            // POST events
            evt.content = `Event-${i}`;
            yield chai.request(API_URL).post(`/api/events`).send(evt);
          }

          // GET new event and check
          const newEvents = (yield request.get(`${API_URL}/api/events`, { json: true })).data;
          expect(newEvents.length).to.equal(numEvents);

          for (let i = 0; i < numEvents; i++) {
            const newEvent = newEvents[i];
            expect(newEvent.key).to.equal(evt.key);
            expect(newEvent.severity).to.equal('info');
            expect(newEvent.timestamp).to.equal(evt.timestamp);
            expect(newEvent.source).to.equal(evt.source);
            testUtils.validateSchema(newEvent, 'event');
          }

          done();
        } catch (err) {
          done(err);
        }
      })();
    });
  });


});

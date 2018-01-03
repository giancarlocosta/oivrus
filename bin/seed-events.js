/*
Script to POST Events to Event-Service (e.g. for load testing).
NOTE: Number of Events created = numElections * numPeriodsPerElection * numBallotstylesPerPeriod * numVotersPerHour * numHours * numEventsPerVoter

Example Usage:
node bin/seed-events.js --action post --numElections 1 --numPeriodsPerElection 2 --numBallotstylesPerPeriod 1 --numVotersPerHour 10 --numHours 10 --numEventsPerVoter 10
*/
'use strict';

const fs = require('fs');
const _ = require('lodash');
const request = require('request-promise');
const execSync = require('child_process').execSync;
const commandLineArgs = require('command-line-args');
const Promise = require('bluebird');
const co = Promise.coroutine;



function getSongs(opts = {}) {
  return co(function* () {

    const numElections = opts.numElections || 1;


    console.log(`Inserted ${total} events`);

    return Promise.resolve();
  })();
}

module.exports = { getPl };


/* *****************************************************************************
Check to see if this module has been required in by another script. If not, runs
our method with arguments from the command line as the arguments for the method
*******************************************************************************/
(function() {
  if (!module.parent) {

    const opts = commandLineArgs([
      { name: 'action', type: String, defaultValue: `post` },
      { name: 'apiUrl', type: String },
      { name: 'numElections', type: Number },
      { name: 'numPeriodsPerElection', type: Number },
      { name: 'numBallotstylesPerPeriod', type: Number },
      { name: 'numVotersPerHour', type: Number },
      { name: 'numHours', type: Number },
      { name: 'numEventsPerVoter', type: Number }
    ]);

    co(function* () {

      try {

        if (opts.action === `post`) {

          console.log('Posting');

          yield getSongs({
            numElections: opts.numElections,
          });

        } else if (opts.action === `seed`) {

        }

        process.exit(0);
      } catch (e) {
        console.log(e);
        process.exit(1);
      }

    })();

  }
})();

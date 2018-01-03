const root = '../..';
const Promise = require('bluebird');
const co = Promise.coroutine;
const logger = new (require('service-logger'))(__filename);
const utils = require(`${root}/common/util.js`);

const evtLogger = new (require('event-logger'))('evs-events');
const evsEvents = evtLogger.getEventMap('evs-events');

const electionIdToExtrefCache = {};


/**
* Get metadata about an election from election-service
* @param {string} electionId - Id of Election to use in request
* @param {object} options - Other optional params
* @return {Promise<undefined|Error>} resolve with no value if valid data,
*   else reject with an error
*/
async function getElectionMetadata(electionId) {
  const metadata = (await utils.reqRetry(`${process.env.ELECTION_SERVICE_URL}/api/metadata/${electionId}`)).body.data;
  return metadata;
}


async function getElectionIdToExtrefMap(electionId) {
  let idToExtrefMap;
  if (electionIdToExtrefCache[electionId] && process.env.CACHE_SERVICE_RESPONSES === 'true') {
    logger.info(`Using cached election metadata (key: '${electionId}') data from Election Service`);
    idToExtrefMap = electionIdToExtrefCache[electionId];
  } else {
    const electionMetadata = await getElectionMetadata(electionId);
    idToExtrefMap = electionMetadata.idtoextrefmap;
    electionIdToExtrefCache[electionId] = electionMetadata.idtoextrefmap;
  }
  return idToExtrefMap;
}


/**
* Forward event to Author
* @param {object} submission - object containing submission fields
* @param {object} options - Other optional params
* @return {Promise<undefined|Error>} resolve with no value if valid data,
*   else reject with an error
*/
async function forwardEventToAuthor(evt, options = {}) {

  // Get Author code that this event maps to. If none then default to 'INFO'
  let authorEventCode;
  if (evsEvents[evt.key] && evsEvents[evt.key].author_code) {
    authorEventCode = evsEvents[evt.key].author_code;
  } else {
    authorEventCode = 'INFO';
  }

  // Certain Author codes can be skipped via a comma-separated
  // list provided in the AUTHOR_EXCLUDE_CODES environment variable
  const excludedCodes = (process.env.AUTHOR_EXCLUDE_CODES || '').split(',');
  if (excludedCodes.includes(authorEventCode)) {
    return Promise.resolve();
  }

  // First get the election extref so Author recognizes it
  let electionExtref;
  let periodExtref;
  if (utils.exists(evt.election)) {
    const idToExtrefMap = await getElectionIdToExtrefMap(evt.election);
    if (idToExtrefMap) {
      electionExtref = idToExtrefMap[evt.election];
      periodExtref = idToExtrefMap[evt.period];
    }
  }
  if (!electionExtref) {
    logger.warn(`No election extref found for '${evt.key}' Event. Election id provided was '${evt.election}'`);
  }

  // Set message to send to Author
  let authorEventMessage;
  if (typeof evt.content !== 'string') {
    authorEventMessage = JSON.stringify(evt.content);
  } else {
    authorEventMessage = evt.content;
  }

  logger.info(`Event: '${evt.key}' --> Author Code: '${authorEventCode}'`);
  let url = options.url || `${process.env.AUTHOR_URL}/bg/log_event`;
  url += `?event_code=${authorEventCode}`;
  url += electionExtref ? `&election_id=${electionExtref}` : '';
  url += periodExtref ? `&instance_id=${periodExtref}` : '';
  url += authorEventMessage ? `&message=${authorEventMessage}` : '';
  await utils.reqRetry({ method: 'POST', uri: url, body: evt, json: true, retryDelay: 500 });
  return;
}


module.exports = {
  forwardEventToAuthor,
  getElectionMetadata,
  getElectionIdToExtrefMap
};

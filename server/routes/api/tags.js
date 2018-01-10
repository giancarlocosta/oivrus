const root = '../../..';
const coroutine = require('co-express');
const express = require('express');
const router = new express.Router();
const Promise = require('bluebird');
const co = Promise.coroutine;
const uuid = require('uuid/v4');
const moment = require('moment');

const logger = new (require('service-logger'))(__filename);
const utils = require(`${root}/common/util.js`);

const TagController = new (require(`${root}/server/controllers/TagController.js`))();
const PollsByTagController = new (require(`${root}/server/controllers/PollsByTagController.js`))();
const UsersByTagController = new (require(`${root}/server/controllers/UsersByTagController.js`))();


/*
CREATE/UPDATE Tag
*/
router.put('/:name', coroutine(function* (req, res, next) {
  const name = req.params.name;
  const data = yield TagController.update({ name }, req.body, { validate: true });
  res.status(201).data = data;
  next();
}));


/*
GET Tag
*/
router.get('/:name', coroutine(function* (req, res, next) {
  const result = yield TagController.find(req.params.name);
  res.status(200).data = result;
  next();
}));


/*******************************************************************************

POLL TAG ENDPOINTS

*******************************************************************************/


/*
Add Tag to a Poll
*/
router.put('/:name/polls/:pollId', coroutine(function* (req, res, next) {
  const tagName = req.params.name;
  const pollId = req.params.pollId;
  const data = yield TagController.addTagToPoll(tagName, pollId);
  res.status(201).data = data;
  next();
}));


/*
Remove Tag from a Poll
*/
router.delete('/:name/polls/:pollId', coroutine(function* (req, res, next) {
  const tagName = req.params.name;
  const pollId = req.params.pollId;
  const data = yield TagController.removeTagFromPoll(tagName, pollId);
  res.status(201).data = data;
  next();
}));


/*******************************************************************************

USER TAG ENDPOINTS

*******************************************************************************/


/*
Add Tag to a User
*/
router.put('/:name/users/:userId', coroutine(function* (req, res, next) {
  const tagName = req.params.name;
  const userId = req.params.userId;
  const data = yield TagController.addTagToUser(tagName, userId);
  res.status(201).data = data;
  next();
}));


/*
Remove Tag from a User
*/
router.delete('/:name/users/:userId', coroutine(function* (req, res, next) {
  const tagName = req.params.name;
  const userId = req.params.userId;
  const data = yield TagController.removeTagFromUser(tagName, userId);
  res.status(201).data = data;
  next();
}));



module.exports = router;

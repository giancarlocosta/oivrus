const root = '../../..';
const coroutine = require('co-express');
const express = require('express');
const router = new express.Router();

const logger = new (require('service-logger'))(__filename);

function getPoll(id) {
  const rand = function () { return Math.floor(Math.random() * 20); }
  const mockData = {
    1: {
      id: 'p1',
      name: 'Do you think Cardano will beat Eth?',
      choices: [{ id: 'c1.1', name: 'Yes' }, { id: 'c1.2', name: 'No' }, { id: 'c1.3', name: 'Maybe' }],
      results: [{ id: 'c1.1', name: 'Yes', votes: rand() }, { id: 'c1.2', name: 'No', votes: rand() }, { id: 'c1.3', name: 'Maybe', votes: rand() }]
    },
    2: {
      id: 'p2',
      name: 'Which crypto is your favorite?',
      choices: [{ id: 'c2.1', name: 'XRP' }, { id: 'c2.2', name: 'ETH' }, { id: 'c2.3', name: 'ADA' }],
      results: [{ id: 'c2.1', name: 'XRP', votes: rand() }, { id: 'c2.2', name: 'ETH', votes: rand() }, { id: 'c2.3', name: 'ADA', votes: rand() }],
    },
    3: {
      id: 'p3',
      name: 'What crypto are you most confident in?',
      choices: [{ id: 'c3.1', name: 'XRP' }, { id: 'c3.2', name: 'ETH' }, { id: 'c3.3', name: 'ADA' }],
      results: [{ id: 'c3.1', name: 'XRP', votes: rand() }, { id: 'c3.2', name: 'ETH', votes: rand() }, { id: 'c3.3', name: 'ADA', votes: rand() }]
    },
    4: {
      id: 'p4',
      name: 'How much do you have invested?',
      choices: [{ id: 'c4.1', name: '> 100' }, { id: 'c4.2', name: '> 1000' }, { id: 'c4.3', name: '> 10000' }],
      results: [{ id: 'c4.1', name: '> 100', votes: rand() }, { id: 'c4.2', name: '> 1000', votes: rand() }, { id: 'c4.3', name: '> 10000', votes: rand() }]
    }
  };

  return mockData[id];
}

router.get('/polls/:id', coroutine(function* (req, res, next) {
  const result = getPoll(req.params.id);
  const data = { data: result };
  res.status(200).json(data);
}));

router.post('/polls', coroutine(function* (req, res, next) {
  logger.info(req.body)
  const data = { id: 123 };
  res.status(201).json(data);
}));

router.post('/polls/:id/vote', coroutine(function* (req, res, next) {
  logger.info(req.body)
  const data = { status: 'success' };
  res.status(201).json(data);
}));


module.exports = router;

const coroutine = require('co-express');

const express = require('express');
const router = new express.Router();


router.get('/', coroutine(function* (req, res, next) {

  res.status(204).send();

}));


module.exports = router;

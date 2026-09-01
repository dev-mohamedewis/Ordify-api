const express = require('express');
const router = express.Router();
const { getApiKeys } = require('./apiKey.controller');

router.get('/', getApiKeys);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getMerchants } = require('./merchant.controller');

router.get('/', getMerchants);

module.exports = router;

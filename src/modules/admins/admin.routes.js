const express = require('express');
const router = express.Router();
const { getAdmins } = require('./admin.controller');

router.get('/', getAdmins);

module.exports = router;

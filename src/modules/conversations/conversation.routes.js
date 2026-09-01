const express = require('express');
const router = express.Router();
const { getConversations } = require('./conversation.controller');

router.get('/', getConversations);

module.exports = router;

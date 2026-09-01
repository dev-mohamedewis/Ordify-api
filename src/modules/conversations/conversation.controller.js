const { apiResponse } = require('../../utils/apiResponse');

async function getConversations(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Conversation placeholder', [], 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getConversations };

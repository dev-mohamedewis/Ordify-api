const { apiResponse } = require('../../utils/apiResponse');

async function getApiKeys(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'API key placeholder', [], 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getApiKeys };

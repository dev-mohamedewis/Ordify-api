const { apiResponse } = require('../../utils/apiResponse');

async function login(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Auth placeholder', null, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { login };

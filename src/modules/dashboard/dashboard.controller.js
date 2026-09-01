const { apiResponse } = require('../../utils/apiResponse');

async function getDashboard(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Dashboard placeholder', { summary: {} }, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };

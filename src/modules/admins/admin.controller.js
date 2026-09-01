const { apiResponse } = require('../../utils/apiResponse');

async function getAdmins(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Admin placeholder', [], 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getAdmins };

const { apiResponse } = require('../../utils/apiResponse');

async function getMerchants(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Merchant placeholder', [], 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getMerchants };

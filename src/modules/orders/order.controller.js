const { apiResponse } = require('../../utils/apiResponse');

async function createOrder(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Order placeholder', null, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrder };

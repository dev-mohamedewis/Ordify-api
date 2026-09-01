const { apiResponse } = require('../../utils/apiResponse');

async function getProducts(req, res, next) {
  try {
    res.status(200).json(apiResponse(true, 'Product placeholder', [], 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { getProducts };

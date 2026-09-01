const { apiResponse } = require('../utils/apiResponse');

function notFoundMiddleware(req, res) {
  res.status(404).json(
    apiResponse(false, `Route not found: ${req.originalUrl}`, null, 404)
  );
}

module.exports = notFoundMiddleware;

const { apiResponse } = require('../utils/apiResponse');

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack || err.message);
  }

  const response = apiResponse(false, message, null, statusCode);
  res.status(statusCode).json(response);
}

module.exports = errorMiddleware;

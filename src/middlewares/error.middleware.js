const { apiResponse } = require('../utils/apiResponse');

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const response = apiResponse(false, message, null, statusCode);

  if (process.env.NODE_ENV !== 'production') {
    response.error = {
      name: err.name,
      stack: err.stack
    };
  }

  res.status(statusCode).json(response);
}

module.exports = errorMiddleware;

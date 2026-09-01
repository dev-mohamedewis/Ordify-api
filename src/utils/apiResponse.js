function apiResponse(success, message, data = null, statusCode = 200) {
  return {
    success,
    message,
    data,
    statusCode
  };
}

module.exports = { apiResponse };

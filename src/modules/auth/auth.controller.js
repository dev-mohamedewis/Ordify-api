const { apiResponse } = require('../../utils/apiResponse');
const { loginService } = require('./auth.service');

async function login(req, res, next) {
  try {
    const result = await loginService(req.body.email, req.body.password);
    res.status(200).json(apiResponse(true, 'Admin login successful', result, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = { login };

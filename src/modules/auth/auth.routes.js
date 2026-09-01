const express = require('express');
const router = express.Router();
const { login } = require('./auth.controller');
const { loginSchema } = require('./auth.validation');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(', ');
      const validationError = new Error(details);
      validationError.statusCode = 400;
      return next(validationError);
    }

    req.body = value;
    next();
  };
}

router.post('/login', validateRequest(loginSchema), login);

module.exports = router;

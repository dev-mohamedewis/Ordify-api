const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().trim().min(8).required()
}).required().unknown(false);

module.exports = { loginSchema };

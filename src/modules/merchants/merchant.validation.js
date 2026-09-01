const Joi = require('joi');

const createMerchantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).required(),
  storeName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().allow('').optional()
});

const updateMerchantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email(),
  storeName: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().allow(''),
  status: Joi.string().valid('active', 'suspended')
}).min(1);

module.exports = { createMerchantSchema, updateMerchantSchema };

const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  sku: Joi.string().trim().min(1).max(100).allow('').optional(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  isActive: Joi.boolean().optional()
}).required().unknown(false);

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(1),
  description: Joi.string().trim().max(2000).allow(''),
  sku: Joi.string().trim().min(1).max(100).allow(''),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  isActive: Joi.boolean()
}).min(1).unknown(false);

module.exports = { createProductSchema, updateProductSchema };

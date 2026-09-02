const Joi = require('joi');

const variantSchema = Joi.object({
  color: Joi.string().trim().max(50).allow('').optional().allow(null),
  size: Joi.string().trim().max(50).allow('').optional().allow(null),
  other: Joi.string().trim().max(200).allow('').optional().allow(null)
}).required().unknown(false);

const createOrderSchema = Joi.object({
  conversationId: Joi.string().required(),
  customer: Joi.object({
    name: Joi.string().trim().max(100).allow('').allow(null).optional(),
    phone: Joi.string().trim().max(50).allow('').allow(null).optional()
  }).required().unknown(false),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      variant: variantSchema.optional()
    }).required().unknown(false)
  ).min(1).required(),
  notes: Joi.string().trim().max(2000).allow('').optional()
}).required().unknown(false);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required()
}).required().unknown(false);

module.exports = { createOrderSchema, updateStatusSchema };

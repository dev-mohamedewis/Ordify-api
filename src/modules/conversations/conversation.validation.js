const Joi = require('joi');

const createConversationSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().trim().max(100).allow('').optional(),
    phone: Joi.string().trim().max(50).allow('').optional()
  }).optional(),
  channel: Joi.string().valid('whatsapp', 'messenger', 'instagram', 'telegram', 'manual').required()
}).required().unknown(false);

const messageSchema = Joi.object({
  sender: Joi.string().valid('customer', 'merchant', 'system').required(),
  text: Joi.string().trim().min(1).required()
}).required().unknown(false);

module.exports = { createConversationSchema, messageSchema };

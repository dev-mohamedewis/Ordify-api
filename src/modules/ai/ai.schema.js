const Joi = require('joi');

const aiResponseSchema = Joi.object({
  intent: Joi.string()
    .valid('create_order', 'ask_product', 'ask_price', 'ask_availability', 'provide_customer_info', 'greeting', 'other')
    .required(),
  customer: Joi.object({
    name: Joi.alternatives().try(Joi.string().allow(''), null).required(),
    phone: Joi.alternatives().try(Joi.string().allow(''), null).required()
  }).required().unknown(false),
  items: Joi.array().items(
    Joi.object({
      productName: Joi.alternatives().try(Joi.string().allow(''), null).required(),
      quantity: Joi.number().integer().min(1).required(),
      variant: Joi.object({
        color: Joi.alternatives().try(Joi.string().allow(''), null).required(),
        size: Joi.alternatives().try(Joi.string().allow(''), null).required(),
        other: Joi.alternatives().try(Joi.string().allow(''), null).required()
      }).required().unknown(false)
    }).required().unknown(false)
  ).required(),
  notes: Joi.alternatives().try(Joi.string().allow(''), null).required(),
  confidence: Joi.number().min(0).max(1).required()
}).required().unknown(false);

module.exports = { aiResponseSchema };

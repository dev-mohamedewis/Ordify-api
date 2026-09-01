const Joi = require('joi');

const orderExtractionSchema = Joi.object({
  customerName: Joi.string().allow('').optional(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required()
    })
  ).required(),
  totalAmount: Joi.number().min(0).required()
});

module.exports = { orderExtractionSchema };

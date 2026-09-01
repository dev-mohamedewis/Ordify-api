const Joi = require('joi');

const orderSchema = Joi.object({
  customerName: Joi.string().min(2).required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required()
    })
  ).min(1).required()
});

module.exports = { orderSchema };

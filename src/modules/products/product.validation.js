const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required()
});

module.exports = { productSchema };

const Joi = require('joi');
const mongoose = require('mongoose');

const createApiKeySchema = Joi.object({
  merchantId: Joi.string().custom((value, helpers) => {
    if (!mongoose.isValidObjectId(value)) {
      return helpers.message('merchantId must be a valid MongoDB ObjectId');
    }
    return value;
  }, 'valid ObjectId').required(),
  name: Joi.string().trim().min(2).max(100).required(),
  expiresAt: Joi.date().iso().greater('now').optional()
}).required();

const revokeApiKeySchema = Joi.object({
  merchantId: Joi.string().custom((value, helpers) => {
    if (value && !mongoose.isValidObjectId(value)) {
      return helpers.message('merchantId must be a valid MongoDB ObjectId');
    }
    return value;
  }, 'valid ObjectId').optional()
}).min(0).allow(null);

module.exports = { createApiKeySchema, revokeApiKeySchema };

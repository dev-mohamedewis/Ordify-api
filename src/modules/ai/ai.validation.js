const Joi = require('joi');

const analyzeConversationSchema = Joi.object({}).required();

module.exports = { analyzeConversationSchema };

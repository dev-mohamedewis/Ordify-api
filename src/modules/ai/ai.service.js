const mongoose = require('mongoose');
const Conversation = require('../conversations/conversation.model');
const geminiService = require('./gemini.service');
const { AI_PROMPT } = require('./ai.prompt');
const { aiResponseSchema } = require('./ai.schema');

function buildForbiddenError() {
  const error = new Error('You do not have access to this conversation.');
  error.statusCode = 403;
  return error;
}

function buildNotFoundError() {
  const error = new Error('Conversation not found.');
  error.statusCode = 404;
  return error;
}

function ensureValidObjectId(id, label = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
}

function normalizeGeminiResponse(raw) {
  let parsed;

  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    const normalizedError = new Error('Gemini returned malformed JSON.');
    normalizedError.statusCode = 502;
    throw normalizedError;
  }

  const { error, value } = aiResponseSchema.validate(parsed, { abortEarly: false, stripUnknown: true });
  if (error) {
    const validationError = new Error(error.details.map((detail) => detail.message).join(', '));
    validationError.statusCode = 422;
    throw validationError;
  }

  return value;
}

async function analyzeConversationForMerchant({ merchantId, conversationId }) {
  ensureValidObjectId(merchantId, 'merchant ID');
  ensureValidObjectId(conversationId, 'conversation ID');

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw buildNotFoundError();
  }

  if (conversation.merchant.toString() !== merchantId.toString()) {
    throw buildForbiddenError();
  }

  if (!conversation.messages || conversation.messages.length === 0) {
    const error = new Error('Conversation is empty.');
    error.statusCode = 400;
    throw error;
  }

  const promptText = conversation.messages
    .map((message) => `${message.sender}: ${message.text}`)
    .join('\n');

  const prompt = AI_PROMPT.replace('{{CONVERSATION_TEXT}}', promptText);

  let responseText;
  try {
    responseText = await geminiService.callGemini(prompt);
  } catch (error) {
    error.statusCode = error.statusCode || 502;
    error.message = 'AI analysis failed.';
    throw error;
  }

  return normalizeGeminiResponse(responseText);
}

module.exports = { analyzeConversationForMerchant };

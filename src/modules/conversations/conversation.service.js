const mongoose = require('mongoose');
const Conversation = require('./conversation.model');

function ensureValidObjectId(id, label = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
}

function buildNotFoundError() {
  const error = new Error('Conversation not found.');
  error.statusCode = 404;
  return error;
}

function buildForbiddenError() {
  const error = new Error('You do not have access to this conversation.');
  error.statusCode = 403;
  return error;
}

async function findOwnedConversation(conversationId, merchantId) {
  ensureValidObjectId(conversationId, 'conversation ID');
  ensureValidObjectId(merchantId, 'merchant ID');

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw buildNotFoundError();
  }

  if (conversation.merchant.toString() !== merchantId.toString()) {
    throw buildForbiddenError();
  }

  return conversation;
}

async function createConversation({ merchantId, customer, channel }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const normalizedCustomer = customer && typeof customer === 'object' ? customer : {};
  const safeCustomer = {
    name: typeof normalizedCustomer.name === 'string' ? normalizedCustomer.name.trim() : '',
    phone: typeof normalizedCustomer.phone === 'string' ? normalizedCustomer.phone.trim() : ''
  };

  if (safeCustomer.name && safeCustomer.name.length > 100) {
    const error = new Error('Customer name must be 100 characters or fewer.');
    error.statusCode = 400;
    throw error;
  }

  if (safeCustomer.phone && safeCustomer.phone.length > 50) {
    const error = new Error('Customer phone must be 50 characters or fewer.');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.create({
    merchant: merchantId,
    customer: safeCustomer.name || safeCustomer.phone ? safeCustomer : undefined,
    channel,
    messages: [],
    status: 'active'
  });

  return conversation;
}

async function listConversations({ merchantId, page = 1, limit = 10, status, channel }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageLimit = Number(limit) > 0 ? Number(limit) : 10;

  const filters = { merchant: merchantId };

  if (status) {
    filters.status = status;
  }

  if (channel) {
    filters.channel = channel;
  }

  const total = await Conversation.countDocuments(filters);
  const conversations = await Conversation.find(filters)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit)
    .lean();

  return {
    conversations,
    pagination: {
      page: pageNumber,
      limit: pageLimit,
      total,
      pages: Math.max(1, Math.ceil(total / pageLimit))
    }
  };
}

async function getConversationById(conversationId, merchantId) {
  const conversation = await findOwnedConversation(conversationId, merchantId);
  return conversation.toObject ? conversation.toObject() : conversation;
}

async function addMessage(conversationId, merchantId, { sender, text }) {
  const conversation = await findOwnedConversation(conversationId, merchantId);

  if (conversation.status === 'closed') {
    const error = new Error('Conversation is closed.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedText = typeof text === 'string' ? text.trim() : '';
  if (!normalizedText) {
    const error = new Error('Message text is required.');
    error.statusCode = 400;
    throw error;
  }

  conversation.messages.push({
    sender,
    text: normalizedText,
    createdAt: new Date()
  });

  await conversation.save();
  return conversation;
}

async function closeConversation(conversationId, merchantId) {
  const conversation = await findOwnedConversation(conversationId, merchantId);
  conversation.status = 'closed';
  await conversation.save();
  return conversation;
}

module.exports = {
  createConversation,
  listConversations,
  getConversationById,
  addMessage,
  closeConversation
};

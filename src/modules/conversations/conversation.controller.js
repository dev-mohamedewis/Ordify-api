const { apiResponse } = require('../../utils/apiResponse');
const {
  createConversation,
  listConversations,
  getConversationById,
  addMessage,
  closeConversation
} = require('./conversation.service');

async function createConversationController(req, res, next) {
  try {
    const conversation = await createConversation({
      merchantId: req.merchant._id,
      ...req.body
    });
    res.status(201).json(apiResponse(true, 'Conversation created successfully', conversation, 201));
  } catch (error) {
    next(error);
  }
}

async function listConversationsController(req, res, next) {
  try {
    const { page, limit, status, channel } = req.query;
    const result = await listConversations({
      merchantId: req.merchant._id,
      page,
      limit,
      status,
      channel
    });
    res.status(200).json(apiResponse(true, 'Conversations fetched successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

async function getConversationByIdController(req, res, next) {
  try {
    const conversation = await getConversationById(req.params.id, req.merchant._id);
    res.status(200).json(apiResponse(true, 'Conversation fetched successfully', conversation, 200));
  } catch (error) {
    next(error);
  }
}

async function addMessageController(req, res, next) {
  try {
    const conversation = await addMessage(req.params.id, req.merchant._id, req.body);
    res.status(200).json(apiResponse(true, 'Message added successfully', conversation, 200));
  } catch (error) {
    next(error);
  }
}

async function closeConversationController(req, res, next) {
  try {
    const conversation = await closeConversation(req.params.id, req.merchant._id);
    res.status(200).json(apiResponse(true, 'Conversation closed successfully', conversation, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createConversationController,
  listConversationsController,
  getConversationByIdController,
  addMessageController,
  closeConversationController
};

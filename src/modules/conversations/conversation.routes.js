const express = require('express');
const router = express.Router();
const apiKeyMiddleware = require('../../middlewares/apiKey.middleware');
const {
  createConversationController,
  listConversationsController,
  getConversationByIdController,
  addMessageController,
  closeConversationController
} = require('./conversation.controller');
const { createConversationSchema, messageSchema } = require('./conversation.validation');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      const validationError = new Error(message);
      validationError.statusCode = 400;
      return next(validationError);
    }

    req.body = value;
    next();
  };
}

router.use(apiKeyMiddleware);
router.post('/', validateRequest(createConversationSchema), createConversationController);
router.get('/', listConversationsController);
router.get('/:id', getConversationByIdController);
router.post('/:id/messages', validateRequest(messageSchema), addMessageController);
router.patch('/:id/close', closeConversationController);

module.exports = router;

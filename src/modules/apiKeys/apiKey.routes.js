const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const apiKeyMiddleware = require('../../middlewares/apiKey.middleware');
const {
  validateApiKeyController,
  createApiKeyController,
  listApiKeysController,
  revokeApiKeyController,
  deleteApiKeyController
} = require('./apiKey.controller');
const { createApiKeySchema, revokeApiKeySchema } = require('./apiKey.validation');

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

router.get('/validate', apiKeyMiddleware, validateApiKeyController);
router.use(authMiddleware);
router.post('/', validateRequest(createApiKeySchema), createApiKeyController);
router.get('/merchant/:merchantId', listApiKeysController);
router.patch('/:id/revoke', validateRequest(revokeApiKeySchema), revokeApiKeyController);
router.delete('/:id', validateRequest(revokeApiKeySchema), deleteApiKeyController);

module.exports = router;

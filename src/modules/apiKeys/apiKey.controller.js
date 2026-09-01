const { apiResponse } = require('../../utils/apiResponse');
const {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey
} = require('./apiKey.service');

async function validateApiKeyController(req, res, next) {
  try {
    res.status(200).json(
      apiResponse(
        true,
        'API key valid',
        {
          merchant: {
            id: req.merchant._id,
            name: req.merchant.name,
            email: req.merchant.email,
            status: req.merchant.status
          },
          apiKey: {
            id: req.apiKey._id,
            name: req.apiKey.name,
            keyPrefix: req.apiKey.keyPrefix,
            isActive: req.apiKey.isActive
          }
        },
        200
      )
    );
  } catch (error) {
    next(error);
  }
}

async function createApiKeyController(req, res, next) {
  try {
    const result = await createApiKey(req.body);
    res.status(201).json(apiResponse(true, 'API key created successfully', result, 201));
  } catch (error) {
    next(error);
  }
}

async function listApiKeysController(req, res, next) {
  try {
    const keys = await listApiKeys({ merchantId: req.params.merchantId });
    res.status(200).json(apiResponse(true, 'API keys fetched successfully', { keys }, 200));
  } catch (error) {
    next(error);
  }
}

async function revokeApiKeyController(req, res, next) {
  try {
    const result = await revokeApiKey({
      id: req.params.id,
      merchantId: req.body.merchantId || req.query.merchantId
    });
    res.status(200).json(apiResponse(true, 'API key revoked successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

async function deleteApiKeyController(req, res, next) {
  try {
    const result = await deleteApiKey({
      id: req.params.id,
      merchantId: req.body.merchantId || req.query.merchantId
    });
    res.status(200).json(apiResponse(true, 'API key deleted successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateApiKeyController,
  createApiKeyController,
  listApiKeysController,
  revokeApiKeyController,
  deleteApiKeyController
};

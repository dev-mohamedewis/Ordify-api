const crypto = require('crypto');
const ApiKey = require('../modules/apiKeys/apiKey.model');
const Merchant = require('../modules/merchants/merchant.model');

function hashApiKey(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function apiKeyMiddleware(req, res, next) {
  try {
    const apiKeyValue = req.headers['x-api-key'];

    if (!apiKeyValue) {
      const error = new Error('Invalid or inactive API key.');
      error.statusCode = 401;
      throw error;
    }

    const keyHash = hashApiKey(apiKeyValue);
    const apiKey = await ApiKey.findOne({ keyHash, isActive: true });

    if (!apiKey) {
      const error = new Error('Invalid or inactive API key.');
      error.statusCode = 401;
      throw error;
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt).getTime() <= Date.now()) {
      const error = new Error('Invalid or inactive API key.');
      error.statusCode = 401;
      throw error;
    }

    const merchant = await Merchant.findById(apiKey.merchantId);

    if (!merchant || merchant.status !== 'active') {
      const error = new Error('Invalid or inactive API key.');
      error.statusCode = 401;
      throw error;
    }

    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    req.merchant = merchant;
    req.apiKey = apiKey;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'Invalid or inactive API key.';
    }

    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = 'Invalid or inactive API key.';
    }

    next(error);
  }
}

module.exports = apiKeyMiddleware;

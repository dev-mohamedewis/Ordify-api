const crypto = require('crypto');
const mongoose = require('mongoose');
const ApiKey = require('./apiKey.model');
const Merchant = require('../merchants/merchant.model');

function hashApiKey(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createApiKeyToken() {
  const secret = crypto.randomBytes(24).toString('hex');
  const key = `ord_live_${secret}`;
  return {
    rawApiKey: key,
    keyPrefix: `ord_live_${secret.slice(0, 8)}`
  };
}

function validateMerchantId(merchantId) {
  if (!merchantId || !mongoose.isValidObjectId(merchantId)) {
    const error = new Error('Invalid merchant ID.');
    error.statusCode = 400;
    throw error;
  }
}

async function createApiKey({ merchantId, name, expiresAt }) {
  validateMerchantId(merchantId);

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) {
    const error = new Error('Merchant not found.');
    error.statusCode = 404;
    throw error;
  }

  if (name && name.trim().length === 0) {
    const error = new Error('API key name is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedName = String(name || '').trim();

  if (!normalizedName) {
    const error = new Error('API key name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (expiresAt) {
    const expiryDate = new Date(expiresAt);

    if (Number.isNaN(expiryDate.getTime())) {
      const error = new Error('expiresAt must be a valid date.');
      error.statusCode = 400;
      throw error;
    }

    if (expiryDate.getTime() <= Date.now()) {
      const error = new Error('expiresAt must be in the future.');
      error.statusCode = 400;
      throw error;
    }
  }

  const { rawApiKey, keyPrefix } = createApiKeyToken();
  const keyHash = hashApiKey(rawApiKey);

  const apiKey = await ApiKey.create({
    merchantId,
    name: normalizedName,
    keyPrefix,
    keyHash,
    expiresAt: expiresAt ? new Date(expiresAt) : null
  });

  return {
    id: apiKey._id,
    apiKey: rawApiKey,
    keyPrefix,
    name: apiKey.name,
    expiresAt: apiKey.expiresAt,
    isActive: apiKey.isActive,
    createdAt: apiKey.createdAt
  };
}

async function listApiKeys({ merchantId }) {
  validateMerchantId(merchantId);

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) {
    const error = new Error('Merchant not found.');
    error.statusCode = 404;
    throw error;
  }

  const apiKeys = await ApiKey.find({ merchantId }).sort({ createdAt: -1 }).lean();

  return apiKeys.map((key) => ({
    id: key._id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    createdAt: key.createdAt
  }));
}

async function revokeApiKey({ id, merchantId }) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid API key ID.');
    error.statusCode = 400;
    throw error;
  }

  if (merchantId && !mongoose.isValidObjectId(merchantId)) {
    const error = new Error('Invalid merchant ID.');
    error.statusCode = 400;
    throw error;
  }

  const apiKey = await ApiKey.findById(id);
  if (!apiKey) {
    const error = new Error('API key not found.');
    error.statusCode = 404;
    throw error;
  }

  if (merchantId && apiKey.merchantId.toString() !== merchantId) {
    const error = new Error('API key does not belong to this merchant.');
    error.statusCode = 403;
    throw error;
  }

  apiKey.isActive = false;
  await apiKey.save();

  return {
    id: apiKey._id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    isActive: apiKey.isActive,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    updatedAt: apiKey.updatedAt
  };
}

async function deleteApiKey({ id, merchantId }) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid API key ID.');
    error.statusCode = 400;
    throw error;
  }

  if (merchantId && !mongoose.isValidObjectId(merchantId)) {
    const error = new Error('Invalid merchant ID.');
    error.statusCode = 400;
    throw error;
  }

  const apiKey = await ApiKey.findById(id);
  if (!apiKey) {
    const error = new Error('API key not found.');
    error.statusCode = 404;
    throw error;
  }

  if (merchantId && apiKey.merchantId.toString() !== merchantId) {
    const error = new Error('API key does not belong to this merchant.');
    error.statusCode = 403;
    throw error;
  }

  await ApiKey.findByIdAndDelete(id);
  return { deleted: true, id };
}

module.exports = {
  hashApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey
};

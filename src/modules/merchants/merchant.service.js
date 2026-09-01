const mongoose = require('mongoose');
const Merchant = require('./merchant.model');

function duplicateEmailError() {
  const error = new Error('A merchant with this email already exists.');
  error.statusCode = 409;
  return error;
}

async function createMerchantService(payload) {
  const email = payload.email.trim().toLowerCase();

  const existingMerchant = await Merchant.findOne({ email });
  if (existingMerchant) {
    throw duplicateEmailError();
  }

  const merchant = await Merchant.create({
    ...payload,
    email,
    password: payload.password
  });

  return merchant.toJSON();
}

async function listMerchantsService({ page = 1, limit = 10, search = '', status = '' }) {
  const query = {};
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  if (status) {
    query.status = status;
  }

  if (search) {
    const searchTerm = new RegExp(search, 'i');
    query.$or = [
      { name: searchTerm },
      { email: searchTerm },
      { storeName: searchTerm }
    ];
  }

  const [merchants, total] = await Promise.all([
    Merchant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
    Merchant.countDocuments(query)
  ]);

  return {
    merchants,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNumber)
    }
  };
}

async function getMerchantByIdService(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid merchant ID.');
    error.statusCode = 400;
    throw error;
  }

  const merchant = await Merchant.findById(id);

  if (!merchant) {
    const error = new Error('Merchant not found.');
    error.statusCode = 404;
    throw error;
  }

  return merchant.toJSON();
}

async function updateMerchantService(id, payload) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid merchant ID.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.email) {
    const existingMerchant = await Merchant.findOne({ email: payload.email.trim().toLowerCase() });
    if (existingMerchant && existingMerchant._id.toString() !== id) {
      throw duplicateEmailError();
    }
    payload.email = payload.email.trim().toLowerCase();
  }

  const merchant = await Merchant.findById(id);

  if (!merchant) {
    const error = new Error('Merchant not found.');
    error.statusCode = 404;
    throw error;
  }

  Object.keys(payload).forEach((key) => {
    merchant[key] = payload[key];
  });

  await merchant.save();
  return merchant.toJSON();
}

module.exports = {
  createMerchantService,
  listMerchantsService,
  getMerchantByIdService,
  updateMerchantService
};

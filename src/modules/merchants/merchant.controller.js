const { apiResponse } = require('../../utils/apiResponse');
const {
  createMerchantService,
  listMerchantsService,
  getMerchantByIdService,
  updateMerchantService
} = require('./merchant.service');

async function createMerchant(req, res, next) {
  try {
    const merchant = await createMerchantService(req.body);
    res.status(201).json(apiResponse(true, 'Merchant created successfully', merchant, 201));
  } catch (error) {
    next(error);
  }
}

async function listMerchants(req, res, next) {
  try {
    const { page, limit, search, status } = req.query;
    const result = await listMerchantsService({ page, limit, search, status });

    res.status(200).json(
      apiResponse(true, 'Merchants fetched successfully', {
        merchants: result.merchants,
        pagination: result.pagination
      }, 200)
    );
  } catch (error) {
    next(error);
  }
}

async function getMerchantById(req, res, next) {
  try {
    const merchant = await getMerchantByIdService(req.params.id);
    res.status(200).json(apiResponse(true, 'Merchant fetched successfully', merchant, 200));
  } catch (error) {
    next(error);
  }
}

async function updateMerchant(req, res, next) {
  try {
    const merchant = await updateMerchantService(req.params.id, req.body);
    res.status(200).json(apiResponse(true, 'Merchant updated successfully', merchant, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMerchant,
  listMerchants,
  getMerchantById,
  updateMerchant
};

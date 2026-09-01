const { apiResponse } = require('../../utils/apiResponse');
const {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deactivateProduct
} = require('./product.service');

async function createProductController(req, res, next) {
  try {
    const product = await createProduct({
      merchantId: req.merchant._id,
      ...req.body
    });

    res.status(201).json(apiResponse(true, 'Product created successfully', product, 201));
  } catch (error) {
    next(error);
  }
}

async function listProductsController(req, res, next) {
  try {
    const { page, limit, search, isActive } = req.query;
    const result = await listProducts({
      merchantId: req.merchant._id,
      page,
      limit,
      search,
      isActive
    });

    res.status(200).json(apiResponse(true, 'Products fetched successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

async function getProductByIdController(req, res, next) {
  try {
    const product = await getProductById(req.params.id, req.merchant._id);
    res.status(200).json(apiResponse(true, 'Product fetched successfully', product, 200));
  } catch (error) {
    next(error);
  }
}

async function updateProductController(req, res, next) {
  try {
    const product = await updateProduct(req.params.id, req.merchant._id, req.body);
    res.status(200).json(apiResponse(true, 'Product updated successfully', product, 200));
  } catch (error) {
    next(error);
  }
}

async function deactivateProductController(req, res, next) {
  try {
    const product = await deactivateProduct(req.params.id, req.merchant._id);
    res.status(200).json(apiResponse(true, 'Product deactivated successfully', product, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProductController,
  listProductsController,
  getProductByIdController,
  updateProductController,
  deactivateProductController
};

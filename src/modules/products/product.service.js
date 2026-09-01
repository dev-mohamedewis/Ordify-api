const mongoose = require('mongoose');
const Product = require('./product.model');

function normalizeBoolean(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }

  return undefined;
}

function buildNotFoundError() {
  const error = new Error('Product not found.');
  error.statusCode = 404;
  return error;
}

function buildForbiddenError() {
  const error = new Error('You do not have access to this product.');
  error.statusCode = 403;
  return error;
}

function ensureValidObjectId(id, label = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
}

async function findOwnedProduct(productId, merchantId) {
  ensureValidObjectId(productId, 'product ID');
  ensureValidObjectId(merchantId, 'merchant ID');

  const product = await Product.findById(productId);

  if (!product) {
    throw buildNotFoundError();
  }

  if (product.merchant.toString() !== merchantId.toString()) {
    throw buildForbiddenError();
  }

  return product;
}

async function createProduct({ merchantId, name, description, sku, price, stock, isActive }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const normalizedName = String(name || '').trim();
  if (!normalizedName) {
    const error = new Error('Product name is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedDescription = typeof description === 'string' ? description.trim() : '';
  const normalizedSku = typeof sku === 'string' ? sku.trim() : '';

  if (normalizedSku) {
    const existingProduct = await Product.findOne({ merchant: merchantId, sku: normalizedSku });
    if (existingProduct) {
      const error = new Error('A product with this SKU already exists for this merchant.');
      error.statusCode = 409;
      throw error;
    }
  }

  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice) || numericPrice < 0) {
    const error = new Error('Price must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const numericStock = Number(stock ?? 0);
  if (Number.isNaN(numericStock) || numericStock < 0) {
    const error = new Error('Stock must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.create({
    merchant: merchantId,
    name: normalizedName,
    description: normalizedDescription,
    sku: normalizedSku || undefined,
    price: numericPrice,
    stock: numericStock,
    isActive: isActive === undefined ? true : Boolean(isActive)
  });

  return product;
}

async function listProducts({ merchantId, page = 1, limit = 10, search, isActive }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageLimit = Number(limit) > 0 ? Number(limit) : 10;
  const filters = { merchant: merchantId };

  if (search && String(search).trim()) {
    filters.$or = [
      { name: { $regex: String(search).trim(), $options: 'i' } },
      { description: { $regex: String(search).trim(), $options: 'i' } },
      { sku: { $regex: String(search).trim(), $options: 'i' } }
    ];
  }

  const activeFilter = normalizeBoolean(isActive);
  if (activeFilter !== undefined) {
    filters.isActive = activeFilter;
  }

  const total = await Product.countDocuments(filters);
  const products = await Product.find(filters)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit)
    .lean();

  return {
    products,
    pagination: {
      page: pageNumber,
      limit: pageLimit,
      total,
      pages: Math.max(1, Math.ceil(total / pageLimit))
    }
  };
}

async function getProductById(productId, merchantId) {
  const product = await findOwnedProduct(productId, merchantId);
  return product.toObject ? product.toObject() : product;
}

async function updateProduct(productId, merchantId, updates) {
  const product = await findOwnedProduct(productId, merchantId);

  if (updates.merchant || updates.createdAt || updates.updatedAt) {
    const error = new Error('merchant, createdAt, and updatedAt cannot be modified.');
    error.statusCode = 400;
    throw error;
  }

  const updateFields = { ...updates };

  if (updateFields.name !== undefined) {
    updateFields.name = String(updateFields.name).trim();
    if (!updateFields.name) {
      const error = new Error('Product name is required.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (updateFields.description !== undefined) {
    updateFields.description = String(updateFields.description).trim();
  }

  if (updateFields.sku !== undefined) {
    updateFields.sku = String(updateFields.sku).trim();
    if (!updateFields.sku) {
      updateFields.sku = undefined;
    }
  }

  if (updateFields.price !== undefined) {
    const numericPrice = Number(updateFields.price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      const error = new Error('Price must be a non-negative number.');
      error.statusCode = 400;
      throw error;
    }
    updateFields.price = numericPrice;
  }

  if (updateFields.stock !== undefined) {
    const numericStock = Number(updateFields.stock);
    if (Number.isNaN(numericStock) || numericStock < 0) {
      const error = new Error('Stock must be a non-negative number.');
      error.statusCode = 400;
      throw error;
    }
    updateFields.stock = numericStock;
  }

  if (updateFields.isActive !== undefined) {
    updateFields.isActive = Boolean(updateFields.isActive);
  }

  if (updateFields.sku && updateFields.sku !== product.sku) {
    const duplicate = await Product.findOne({ merchant: merchantId, sku: updateFields.sku, _id: { $ne: product._id } });
    if (duplicate) {
      const error = new Error('A product with this SKU already exists for this merchant.');
      error.statusCode = 409;
      throw error;
    }
  }

  Object.assign(product, updateFields);
  await product.save();
  return product;
}

async function deactivateProduct(productId, merchantId) {
  const product = await findOwnedProduct(productId, merchantId);
  product.isActive = false;
  await product.save();
  return product;
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deactivateProduct
};

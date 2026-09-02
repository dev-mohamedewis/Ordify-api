const mongoose = require('mongoose');
const Order = require('./order.model');
const Conversation = require('../conversations/conversation.model');
const Product = require('../products/product.model');

const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function ensureValidObjectId(id, label = 'ID') {
  if (!id || !mongoose.isValidObjectId(id)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
}

function buildNotFoundError(type = 'Order') {
  const error = new Error(`${type} not found.`);
  error.statusCode = 404;
  return error;
}

function buildForbiddenError(type = 'order') {
  const error = new Error(`You do not have access to this ${type}.`);
  error.statusCode = 403;
  return error;
}

async function findOwnedOrder(orderId, merchantId) {
  ensureValidObjectId(orderId, 'order ID');
  ensureValidObjectId(merchantId, 'merchant ID');

  const order = await Order.findById(orderId);

  if (!order) {
    throw buildNotFoundError('Order');
  }

  if (order.merchant.toString() !== merchantId.toString()) {
    throw buildForbiddenError('order');
  }

  return order;
}

function normalizeCustomer(customer) {
  const normalized = customer && typeof customer === 'object' ? customer : {};

  return {
    name: typeof normalized.name === 'string' && normalized.name.trim() ? normalized.name.trim() : null,
    phone: typeof normalized.phone === 'string' && normalized.phone.trim() ? normalized.phone.trim() : null
  };
}

function normalizeVariant(variant) {
  const source = variant && typeof variant === 'object' ? variant : {};

  return {
    color: typeof source.color === 'string' && source.color.trim() ? source.color.trim() : null,
    size: typeof source.size === 'string' && source.size.trim() ? source.size.trim() : null,
    other: typeof source.other === 'string' && source.other.trim() ? source.other.trim() : null
  };
}

async function createOrder({ merchantId, payload }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const conversationId = payload && payload.conversationId;
  ensureValidObjectId(conversationId, 'conversation ID');

  if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
    const error = new Error('Order items are required.');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw buildNotFoundError('Conversation');
  }

  if (conversation.merchant.toString() !== merchantId.toString()) {
    throw buildForbiddenError('conversation');
  }

  const customer = normalizeCustomer(payload.customer);
  const itemRecords = [];
  let subtotal = 0;

  for (const item of payload.items) {
    if (!item || !item.productId) {
      const error = new Error('Each item must include a valid productId.');
      error.statusCode = 400;
      throw error;
    }

    ensureValidObjectId(item.productId, 'product ID');

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      const error = new Error('Quantity must be a positive integer.');
      error.statusCode = 400;
      throw error;
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      throw buildNotFoundError('Product');
    }

    if (product.merchant.toString() !== merchantId.toString()) {
      throw buildForbiddenError('product');
    }

    if (!product.isActive) {
      const error = new Error('Product is unavailable.');
      error.statusCode = 400;
      throw error;
    }

    if (typeof product.stock === 'number' && product.stock < quantity) {
      const error = new Error('Requested quantity exceeds available stock.');
      error.statusCode = 400;
      throw error;
    }

    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * quantity;

    itemRecords.push({
      product: product._id,
      productName: product.name,
      quantity,
      unitPrice,
      totalPrice,
      variant: normalizeVariant(item.variant)
    });

    subtotal += totalPrice;
  }

  const order = await Order.create({
    merchant: merchantId,
    conversation: conversation._id,
    customer,
    items: itemRecords,
    subtotal,
    total: subtotal,
    status: 'pending',
    notes: typeof payload.notes === 'string' && payload.notes.trim() ? payload.notes.trim() : null
  });

  return order;
}

async function listOrders({ merchantId, page = 1, limit = 20, status }) {
  ensureValidObjectId(merchantId, 'merchant ID');

  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageLimit = Number(limit) > 0 ? Number(limit) : 20;
  const filters = { merchant: merchantId };

  if (status) {
    if (!VALID_ORDER_STATUSES.includes(status)) {
      const error = new Error('Invalid order status.');
      error.statusCode = 400;
      throw error;
    }
    filters.status = status;
  }

  const total = await Order.countDocuments(filters);
  const orders = await Order.find(filters)
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit)
    .lean();

  return {
    orders,
    pagination: {
      page: pageNumber,
      limit: pageLimit,
      total,
      pages: Math.max(1, Math.ceil(total / pageLimit))
    }
  };
}

async function getOrderById(orderId, merchantId) {
  const order = await findOwnedOrder(orderId, merchantId);
  return order.toObject ? order.toObject() : order;
}

async function updateOrderStatus({ orderId, merchantId, status }) {
  const order = await findOwnedOrder(orderId, merchantId);

  if (!VALID_ORDER_STATUSES.includes(status)) {
    const error = new Error('Invalid order status.');
    error.statusCode = 400;
    throw error;
  }

  order.status = status;
  await order.save();
  return order;
}

async function cancelOrder({ orderId, merchantId }) {
  const order = await findOwnedOrder(orderId, merchantId);

  if (order.status === 'cancelled') {
    return order;
  }

  if (order.status === 'delivered') {
    const error = new Error('Order is already delivered and cannot be cancelled.');
    error.statusCode = 400;
    throw error;
  }

  order.status = 'cancelled';
  await order.save();
  return order;
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};

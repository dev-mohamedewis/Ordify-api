const { apiResponse } = require('../../utils/apiResponse');
const {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
} = require('./order.service');

async function createOrderController(req, res, next) {
  try {
    const order = await createOrder({
      merchantId: req.merchant._id,
      payload: req.body
    });

    res.status(201).json(apiResponse(true, 'Order created successfully', { order }, 201));
  } catch (error) {
    next(error);
  }
}

async function listOrdersController(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status || undefined;

    const result = await listOrders({
      merchantId: req.merchant._id,
      page,
      limit,
      status
    });

    res.status(200).json(apiResponse(true, 'Orders fetched successfully', result, 200));
  } catch (error) {
    next(error);
  }
}

async function getOrderByIdController(req, res, next) {
  try {
    const order = await getOrderById(req.params.id, req.merchant._id);
    res.status(200).json(apiResponse(true, 'Order fetched successfully', { order }, 200));
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatusController(req, res, next) {
  try {
    const order = await updateOrderStatus({
      orderId: req.params.id,
      merchantId: req.merchant._id,
      status: req.body.status
    });

    res.status(200).json(apiResponse(true, 'Order status updated successfully', { order }, 200));
  } catch (error) {
    next(error);
  }
}

async function cancelOrderController(req, res, next) {
  try {
    const order = await cancelOrder({
      orderId: req.params.id,
      merchantId: req.merchant._id
    });

    res.status(200).json(apiResponse(true, 'Order cancelled successfully', { order }, 200));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrderController,
  listOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  cancelOrderController
};

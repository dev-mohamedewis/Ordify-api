const express = require('express');
const router = express.Router();
const apiKeyMiddleware = require('../../middlewares/apiKey.middleware');
const {
  createOrderController,
  listOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
  cancelOrderController
} = require('./order.controller');
const { createOrderSchema, updateStatusSchema } = require('./order.validation');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });

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

router.use(apiKeyMiddleware);
router.post('/', validateRequest(createOrderSchema), createOrderController);
router.get('/', listOrdersController);
router.get('/:id', getOrderByIdController);
router.patch('/:id/status', validateRequest(updateStatusSchema), updateOrderStatusController);
router.patch('/:id/cancel', cancelOrderController);

module.exports = router;

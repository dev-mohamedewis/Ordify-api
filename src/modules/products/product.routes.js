const express = require('express');
const router = express.Router();
const apiKeyMiddleware = require('../../middlewares/apiKey.middleware');
const {
  createProductController,
  listProductsController,
  getProductByIdController,
  updateProductController,
  deactivateProductController
} = require('./product.controller');
const { createProductSchema, updateProductSchema } = require('./product.validation');

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

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
router.post('/', validateRequest(createProductSchema), createProductController);
router.get('/', listProductsController);
router.get('/:id', getProductByIdController);
router.patch('/:id', validateRequest(updateProductSchema), updateProductController);
router.delete('/:id', deactivateProductController);

module.exports = router;

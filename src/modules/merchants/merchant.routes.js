const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const {
  createMerchant,
  listMerchants,
  getMerchantById,
  updateMerchant
} = require('./merchant.controller');
const { createMerchantSchema, updateMerchantSchema } = require('./merchant.validation');

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

router.use(authMiddleware);
router.post('/merchants', validateRequest(createMerchantSchema), createMerchant);
router.get('/merchants', listMerchants);
router.get('/merchants/:id', getMerchantById);
router.patch('/merchants/:id', validateRequest(updateMerchantSchema), updateMerchant);

module.exports = router;

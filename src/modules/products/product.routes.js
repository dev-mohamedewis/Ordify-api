const express = require('express');
const router = express.Router();
const { getProducts } = require('./product.controller');

router.get('/', getProducts);

module.exports = router;

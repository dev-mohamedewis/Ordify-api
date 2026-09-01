const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const adminRoutes = require('../modules/admins/admin.routes');
const merchantRoutes = require('../modules/merchants/merchant.routes');
const apiKeyRoutes = require('../modules/apiKeys/apiKey.routes');
const productRoutes = require('../modules/products/product.routes');
const conversationRoutes = require('../modules/conversations/conversation.routes');
const orderRoutes = require('../modules/orders/order.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ordify API is running'
  });
});

router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/admin', merchantRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/products', productRoutes);
router.use('/conversations', conversationRoutes);
router.use('/orders', orderRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

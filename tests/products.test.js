const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const app = require('../src/app');
const Merchant = require('../src/modules/merchants/merchant.model');
const Product = require('../src/modules/products/product.model');
const ApiKey = require('../src/modules/apiKeys/apiKey.model');
const { hashApiKey } = require('../src/modules/apiKeys/apiKey.service');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = 'http://127.0.0.1:4018';

async function createMerchant(email) {
  return Merchant.create({
    name: 'Merchant One',
    email,
    password: 'StrongPassword123!',
    storeName: 'Store One',
    status: 'active'
  });
}

async function createApiKeyForMerchant(merchant) {
  const key = `ord_live_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  await ApiKey.create({
    merchantId: merchant._id,
    name: 'Primary Key',
    keyPrefix: key.slice(0, 18),
    keyHash: hashApiKey(key),
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000)
  });
  return key;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordify-products');

  await Promise.all([
    Merchant.deleteMany({}),
    Product.deleteMany({}),
    ApiKey.deleteMany({})
  ]);

  const merchantA = await createMerchant('merchant-a@ordify.test');
  const merchantB = await createMerchant('merchant-b@ordify.test');
  const merchantAKey = await createApiKeyForMerchant(merchantA);
  const merchantBKey = await createApiKeyForMerchant(merchantB);

  const server = app.listen(4018, async () => {
    try {
      const createRes = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({
          name: 'Classic Shirt',
          description: 'Cotton shirt',
          sku: 'SKU-001',
          price: 42.5,
          stock: 10,
          isActive: true
        })
      });
      const createData = await createRes.json();
      console.log('CREATE_PRODUCT', createRes.status, JSON.stringify(createData));

      const noKeyRes = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bad', price: 10 })
      });
      const noKeyData = await noKeyRes.json();
      console.log('NO_API_KEY', noKeyRes.status, JSON.stringify(noKeyData));

      const listRes = await fetch(`${baseUrl}/api/v1/products?limit=10&page=1`, {
        headers: { 'x-api-key': merchantAKey }
      });
      const listData = await listRes.json();
      console.log('LIST_PRODUCTS', listRes.status, JSON.stringify(listData));

      const productId = listData.data.products[0]._id;

      const getRes = await fetch(`${baseUrl}/api/v1/products/${productId}`, {
        headers: { 'x-api-key': merchantAKey }
      });
      const getData = await getRes.json();
      console.log('GET_PRODUCT', getRes.status, JSON.stringify(getData));

      const updateRes = await fetch(`${baseUrl}/api/v1/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({
          price: 49.99,
          stock: 12,
          description: 'Updated cotton shirt'
        })
      });
      const updateData = await updateRes.json();
      console.log('UPDATE_PRODUCT', updateRes.status, JSON.stringify(updateData));

      const deactivateRes = await fetch(`${baseUrl}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: { 'x-api-key': merchantAKey }
      });
      const deactivateData = await deactivateRes.json();
      console.log('DEACTIVATE_PRODUCT', deactivateRes.status, JSON.stringify(deactivateData));

      const otherMerchantRes = await fetch(`${baseUrl}/api/v1/products/${productId}`, {
        headers: { 'x-api-key': merchantBKey }
      });
      const otherMerchantData = await otherMerchantRes.json();
      console.log('OTHER_MERCHANT_ACCESS', otherMerchantRes.status, JSON.stringify(otherMerchantData));

      const invalidPriceRes = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ name: 'Bad Price', price: -1, stock: 1 })
      });
      const invalidPriceData = await invalidPriceRes.json();
      console.log('NEGATIVE_PRICE', invalidPriceRes.status, JSON.stringify(invalidPriceData));

      const invalidStockRes = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ name: 'Bad Stock', price: 5, stock: -1 })
      });
      const invalidStockData = await invalidStockRes.json();
      console.log('NEGATIVE_STOCK', invalidStockRes.status, JSON.stringify(invalidStockData));

      const duplicateSkuRes = await fetch(`${baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({
          name: 'Duplicate Sku Shirt',
          description: 'Another one',
          sku: 'SKU-001',
          price: 20,
          stock: 2,
          isActive: true
        })
      });
      const duplicateSkuData = await duplicateSkuRes.json();
      console.log('DUPLICATE_SKU', duplicateSkuRes.status, JSON.stringify(duplicateSkuData));

      await mongoose.disconnect();
      server.close();
    } catch (error) {
      console.error('TEST_ERROR', error);
      await mongoose.disconnect();
      server.close();
      process.exitCode = 1;
    }
  });
}

run();

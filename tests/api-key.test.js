const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
const app = require('../src/app');
const Admin = require('../src/modules/admins/admin.model');
const Merchant = require('../src/modules/merchants/merchant.model');
const ApiKey = require('../src/modules/apiKeys/apiKey.model');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = 'http://127.0.0.1:4016';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordify-api-keys');

  await Promise.all([
    Admin.deleteMany({}),
    Merchant.deleteMany({}),
    ApiKey.deleteMany({})
  ]);

  const admin = await Admin.create({
    name: 'System Admin',
    email: 'admin-api@ordify.test',
    passwordHash: 'placeholder-hash',
    role: 'admin',
    isActive: true
  });

  const adminToken = jwt.sign({ id: admin._id.toString(), role: 'admin' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

  const merchant = await Merchant.create({
    name: 'API Merchant',
    email: 'merchant-api@ordify.test',
    password: 'StrongPassword123!',
    storeName: 'API Merchant Store',
    status: 'active'
  });

  const server = app.listen(4016, async () => {
    try {
      const createRes = await fetch(`${baseUrl}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          merchantId: merchant._id.toString(),
          name: 'Primary Integration Key',
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        })
      });

      const createData = await createRes.json();
      console.log('CREATE', createRes.status, JSON.stringify(createData));

      const stored = await ApiKey.findOne({ merchantId: merchant._id }).select('+keyHash');
      console.log('RAW_NOT_STORED', createData.data.apiKey !== undefined && stored.keyHash && !stored.keyHash.includes(createData.data.apiKey));
      console.log('HASH_STORED', Boolean(stored && stored.keyHash));

      const authRes = await fetch(`${baseUrl}/api/v1/api-keys/validate`, {
        headers: {
          'X-API-Key': createData.data.apiKey
        }
      });

      const authData = await authRes.json();
      console.log('AUTH_OK', authRes.status, JSON.stringify(authData));

      const missingKeyRes = await fetch(`${baseUrl}/api/v1/api-keys/validate`);
      const missingKeyData = await missingKeyRes.json();
      console.log('MISSING_KEY', missingKeyRes.status, JSON.stringify(missingKeyData));

      const invalidKeyRes = await fetch(`${baseUrl}/api/v1/api-keys/validate`, {
        headers: { 'X-API-Key': 'ord_live_invalid_key_123' }
      });
      const invalidKeyData = await invalidKeyRes.json();
      console.log('INVALID_KEY', invalidKeyRes.status, JSON.stringify(invalidKeyData));

      const listRes = await fetch(`${baseUrl}/api/v1/api-keys/merchant/${merchant._id.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const listData = await listRes.json();
      console.log('LIST', listRes.status, JSON.stringify(listData));

      const revokeRes = await fetch(`${baseUrl}/api/v1/api-keys/${stored._id.toString()}/revoke`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ merchantId: merchant._id.toString() })
      });
      const revokeData = await revokeRes.json();
      console.log('REVOKE', revokeRes.status, JSON.stringify(revokeData));

      const revokedAuthRes = await fetch(`${baseUrl}/api/v1/api-keys/validate`, {
        headers: { 'X-API-Key': createData.data.apiKey }
      });
      const revokedAuthData = await revokedAuthRes.json();
      console.log('REVOKED_AUTH', revokedAuthRes.status, JSON.stringify(revokedAuthData));

      const badAdminToken = jwt.sign({ id: merchant._id.toString(), role: 'merchant' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
      const forbiddenRes = await fetch(`${baseUrl}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${badAdminToken}`
        },
        body: JSON.stringify({
          merchantId: merchant._id.toString(),
          name: 'Forbidden Key'
        })
      });
      const forbiddenData = await forbiddenRes.json();
      console.log('FORBIDDEN', forbiddenRes.status, JSON.stringify(forbiddenData));

      const missingMerchantRes = await fetch(`${baseUrl}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          merchantId: new mongoose.Types.ObjectId().toString(),
          name: 'Ghost Key'
        })
      });
      const missingMerchantData = await missingMerchantRes.json();
      console.log('MISSING_MERCHANT', missingMerchantRes.status, JSON.stringify(missingMerchantData));

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

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');
const app = require('../src/app');
const Admin = require('../src/modules/admins/admin.model');
const Merchant = require('../src/modules/merchants/merchant.model');
const { verifyToken } = require('../src/utils/jwt');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = 'http://127.0.0.1:4017';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordify-admin-auth');

  await Promise.all([
    Admin.deleteMany({}),
    Merchant.deleteMany({})
  ]);

  const passwordHash = await require('bcryptjs').hash('StrongPassword123!', 10);

  const admin = await Admin.create({
    name: 'System Admin',
    email: 'admin@example.com',
    passwordHash,
    role: 'admin',
    isActive: true
  });

  const merchant = await Merchant.create({
    name: 'Merchant User',
    email: 'merchant@example.com',
    password: 'StrongPassword123!',
    storeName: 'Merchant Store',
    status: 'active'
  });

  const server = app.listen(4017, async () => {
    try {
      const validRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'StrongPassword123!'
        })
      });

      const validData = await validRes.json();
      console.log('VALID_LOGIN', validRes.status, JSON.stringify(validData));

      const token = validData.data.token;
      console.log('TOKEN_PRESENT', Boolean(token));
      console.log('JWT_VALID', !!verifyToken(token));

      const wrongPasswordRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'WrongPassword123!'
        })
      });
      const wrongPasswordData = await wrongPasswordRes.json();
      const wrongPasswordHasStack = Boolean(wrongPasswordData.error && wrongPasswordData.error.stack);
      console.log('WRONG_PASSWORD', wrongPasswordRes.status, JSON.stringify(wrongPasswordData));
      console.log('NO_STACK_IN_WRONG_PASSWORD_RESPONSE', !wrongPasswordHasStack);

      const unknownEmailRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'missing@example.com',
          password: 'StrongPassword123!'
        })
      });
      const unknownEmailData = await unknownEmailRes.json();
      console.log('UNKNOWN_EMAIL', unknownEmailRes.status, JSON.stringify(unknownEmailData));

      const missingEmailRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'StrongPassword123!'
        })
      });
      const missingEmailData = await missingEmailRes.json();
      console.log('MISSING_EMAIL', missingEmailRes.status, JSON.stringify(missingEmailData));

      const missingPasswordRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com'
        })
      });
      const missingPasswordData = await missingPasswordRes.json();
      console.log('MISSING_PASSWORD', missingPasswordRes.status, JSON.stringify(missingPasswordData));

      const invalidEmailRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'StrongPassword123!'
        })
      });
      const invalidEmailData = await invalidEmailRes.json();
      console.log('INVALID_EMAIL', invalidEmailRes.status, JSON.stringify(invalidEmailData));

      const responseHasPassword = Object.prototype.hasOwnProperty.call(validData.data.admin, 'password');
      const responseHasPasswordHash = Object.prototype.hasOwnProperty.call(validData.data.admin, 'passwordHash');
      console.log('NO_PASSWORD_IN_RESPONSE', !responseHasPassword);
      console.log('NO_PASSWORD_HASH_IN_RESPONSE', !responseHasPasswordHash);

      const merchantLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'merchant@example.com',
          password: 'StrongPassword123!'
        })
      });
      const merchantLoginData = await merchantLoginRes.json();
      console.log('MERCHANT_LOGIN_REJECTED', merchantLoginRes.status, JSON.stringify(merchantLoginData));

      const middlewareRes = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const middlewareData = await middlewareRes.json();
      console.log('AUTH_MIDDLEWARE_ACCEPTS_JWT', middlewareRes.status, JSON.stringify(middlewareData));

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

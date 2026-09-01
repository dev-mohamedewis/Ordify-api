const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const app = require('../src/app');
const Admin = require('../src/modules/admins/admin.model');
const Merchant = require('../src/modules/merchants/merchant.model');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = 'http://127.0.0.1:4015';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });

  await Promise.all([
    Admin.deleteMany({}),
    Merchant.deleteMany({})
  ]);

  const admin = await Admin.create({
    name: 'System Admin',
    email: 'admin@ordify.test',
    passwordHash: 'placeholder-hash',
    role: 'admin',
    isActive: true
  });

  const adminToken = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const server = app.listen(4015, async () => {
    try {
      const createRes = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Ahmed Mohamed',
          email: 'ahmed@example.com',
          password: 'StrongPassword123!',
          storeName: 'Ahmed Store',
          phone: '01012345678'
        })
      });

      const createData = await createRes.json();
      console.log('CREATE', createRes.status, JSON.stringify(createData));

      const duplicateRes = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Another Merchant',
          email: 'ahmed@example.com',
          password: 'AnotherPass123!',
          storeName: 'Another Store'
        })
      });

      const duplicateData = await duplicateRes.json();
      console.log('DUPLICATE', duplicateRes.status, JSON.stringify(duplicateData));

      const merchantDoc = await Merchant.findOne({ email: 'ahmed@example.com' }).select('+password');
      console.log('HASHED_PASSWORD_CHECK', Boolean(merchantDoc && merchantDoc.password && merchantDoc.password !== 'StrongPassword123!'));
      console.log('PASSWORD_NOT_IN_RESPONSE', createData.data && Object.prototype.hasOwnProperty.call(createData.data, 'password') === false);

      const listRes = await fetch(`${baseUrl}/api/v1/admin/merchants?page=1&limit=10&search=ahmed&status=active`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const listData = await listRes.json();
      console.log('LIST', listRes.status, JSON.stringify(listData));

      const getRes = await fetch(`${baseUrl}/api/v1/admin/merchants/${listData.data.merchants[0]._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const getData = await getRes.json();
      console.log('GET_BY_ID', getRes.status, JSON.stringify(getData));

      const updateRes = await fetch(`${baseUrl}/api/v1/admin/merchants/${listData.data.merchants[0]._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Ahmed Updated',
          storeName: 'Updated Store',
          status: 'suspended'
        })
      });
      const updateData = await updateRes.json();
      console.log('UPDATE', updateRes.status, JSON.stringify(updateData));

      const invalidIdRes = await fetch(`${baseUrl}/api/v1/admin/merchants/not-a-valid-id`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const invalidIdData = await invalidIdRes.json();
      console.log('INVALID_ID', invalidIdRes.status, JSON.stringify(invalidIdData));

      const fakeUserToken = jwt.sign({ id: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const forbiddenRes = await fetch(`${baseUrl}/api/v1/admin/merchants`, {
        headers: { Authorization: `Bearer ${fakeUserToken}` }
      });
      const forbiddenData = await forbiddenRes.json();
      console.log('FORBIDDEN', forbiddenRes.status, JSON.stringify(forbiddenData));

      await mongoose.disconnect();
      server.close();
    } catch (error) {
      console.error('TEST_ERROR', error);
      await mongoose.disconnect();
      server.close();
      process.exitCode = 1;
    }
  });

  await wait(200);
}

run();

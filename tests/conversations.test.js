const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const app = require('../src/app');
const Merchant = require('../src/modules/merchants/merchant.model');
const Conversation = require('../src/modules/conversations/conversation.model');
const ApiKey = require('../src/modules/apiKeys/apiKey.model');
const { hashApiKey } = require('../src/modules/apiKeys/apiKey.service');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const baseUrl = 'http://127.0.0.1:4019';

async function createMerchant(email) {
  return Merchant.create({
    name: 'Test Merchant',
    email,
    password: 'StrongPassword123!',
    storeName: `Store ${Date.now()}`,
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
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordify-conversations');

  await Promise.all([
    Merchant.deleteMany({}),
    Conversation.deleteMany({}),
    ApiKey.deleteMany({})
  ]);

  const merchantA = await createMerchant('merchant-a-conv@ordify.test');
  const merchantB = await createMerchant('merchant-b-conv@ordify.test');
  const merchantAKey = await createApiKeyForMerchant(merchantA);
  const merchantBKey = await createApiKeyForMerchant(merchantB);

  const server = app.listen(4019, async () => {
    try {
      const createRes = await fetch(`${baseUrl}/api/v1/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({
          customer: { name: 'Ahmed', phone: '01000000000' },
          channel: 'whatsapp'
        })
      });
      const createData = await createRes.json();
      console.log('CREATE_CONVERSATION', createRes.status, JSON.stringify(createData));
      const conversationId = createData.data._id;

      const noKeyRes = await fetch(`${baseUrl}/api/v1/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp' })
      });
      const noKeyData = await noKeyRes.json();
      console.log('NO_API_KEY', noKeyRes.status, JSON.stringify(noKeyData));

      const listRes = await fetch(`${baseUrl}/api/v1/conversations?page=1&limit=10`, {
        headers: { 'x-api-key': merchantAKey }
      });
      const listData = await listRes.json();
      console.log('LIST_CONVERSATIONS', listRes.status, JSON.stringify(listData));

      const getRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}`, {
        headers: { 'x-api-key': merchantAKey }
      });
      const getData = await getRes.json();
      console.log('GET_CONVERSATION', getRes.status, JSON.stringify(getData));

      const addCustomerMessageRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ sender: 'customer', text: 'عايز 2 تيشيرت أسود XL' })
      });
      const addCustomerMessageData = await addCustomerMessageRes.json();
      console.log('ADD_CUSTOMER_MESSAGE', addCustomerMessageRes.status, JSON.stringify(addCustomerMessageData));

      const addMerchantMessageRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ sender: 'merchant', text: 'ممكن أرسللك خيارات؟' })
      });
      const addMerchantMessageData = await addMerchantMessageRes.json();
      console.log('ADD_MERCHANT_MESSAGE', addMerchantMessageRes.status, JSON.stringify(addMerchantMessageData));

      const closeRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/close`, {
        method: 'PATCH',
        headers: { 'x-api-key': merchantAKey }
      });
      const closeData = await closeRes.json();
      console.log('CLOSE_CONVERSATION', closeRes.status, JSON.stringify(closeData));

      const closedMessageRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ sender: 'customer', text: 'Still here' })
      });
      const closedMessageData = await closedMessageRes.json();
      console.log('REJECT_MESSAGE_AFTER_CLOSE', closedMessageRes.status, JSON.stringify(closedMessageData));

      const otherMerchantRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}`, {
        headers: { 'x-api-key': merchantBKey }
      });
      const otherMerchantData = await otherMerchantRes.json();
      console.log('OTHER_MERCHANT_ACCESS', otherMerchantRes.status, JSON.stringify(otherMerchantData));

      const invalidChannelRes = await fetch(`${baseUrl}/api/v1/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({
          customer: { name: 'Bad', phone: '010' },
          channel: 'invalid-channel'
        })
      });
      const invalidChannelData = await invalidChannelRes.json();
      console.log('INVALID_CHANNEL', invalidChannelRes.status, JSON.stringify(invalidChannelData));

      const emptyMessageRes = await fetch(`${baseUrl}/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': merchantAKey
        },
        body: JSON.stringify({ sender: 'customer', text: '   ' })
      });
      const emptyMessageData = await emptyMessageRes.json();
      console.log('EMPTY_MESSAGE', emptyMessageRes.status, JSON.stringify(emptyMessageData));

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

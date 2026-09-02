const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('../src/app');
const Merchant = require('../src/modules/merchants/merchant.model');
const Conversation = require('../src/modules/conversations/conversation.model');
const ApiKey = require('../src/modules/apiKeys/apiKey.model');
const { hashApiKey } = require('../src/modules/apiKeys/apiKey.service');
const geminiService = require('../src/modules/ai/gemini.service');

const baseUrl = 'http://127.0.0.1:4020';
let server;
let merchantA;
let merchantB;
let merchantAKey;
let merchantBKey;
let conversation;
let emptyConversation;

async function createMerchant(email) {
  return Merchant.create({
    name: 'AI Merchant',
    email,
    password: 'StrongPassword123!',
    storeName: 'AI Store',
    status: 'active'
  });
}

async function createApiKeyForMerchant(merchant) {
  const key = `ord_live_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  await ApiKey.create({
    merchantId: merchant._id,
    name: 'AI Key',
    keyPrefix: key.slice(0, 18),
    keyHash: hashApiKey(key),
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000)
  });
  return key;
}

async function seedData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ordify-ai');
  await Promise.all([
    Merchant.deleteMany({}),
    Conversation.deleteMany({}),
    ApiKey.deleteMany({})
  ]);

  merchantA = await createMerchant('merchant-a-ai@ordify.test');
  merchantB = await createMerchant('merchant-b-ai@ordify.test');
  merchantAKey = await createApiKeyForMerchant(merchantA);
  merchantBKey = await createApiKeyForMerchant(merchantB);

  conversation = await Conversation.create({
    merchant: merchantA._id,
    customer: { name: 'Ahmed', phone: '01000000000' },
    channel: 'whatsapp',
    messages: [
      { sender: 'customer', text: 'عايز 2 تيشيرت أسود XL' },
      { sender: 'merchant', text: 'أكيد، عندنا' }
    ],
    status: 'active'
  });

  emptyConversation = await Conversation.create({
    merchant: merchantA._id,
    customer: { name: 'Empty', phone: '01111111111' },
    channel: 'manual',
    messages: [],
    status: 'active'
  });
}

async function analyzeConversation({ conversationId, apiKey }) {
  const response = await fetch(`${baseUrl}/api/v1/ai/analyze/${conversationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {})
    }
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

test.before(async () => {
  await seedData();
  await new Promise((resolve) => {
    server = app.listen(4020, resolve);
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await mongoose.disconnect();
});

test('requires a valid API key', async () => {
  const result = await analyzeConversation({ conversationId: conversation._id });
  assert.equal(result.status, 401);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /Invalid or inactive API key/i);
});

test('returns valid structured analysis for owned conversations', async () => {
  geminiService.callGemini = async () => JSON.stringify({
    intent: 'create_order',
    customer: { name: null, phone: '01000000000' },
    items: [{ productName: 'T-Shirt', quantity: 2, variant: { color: 'black', size: 'XL', other: null } }],
    notes: null,
    confidence: 0.94
  });

  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.intent, 'create_order');
  assert.equal(result.body.data.items[0].quantity, 2);
  assert.equal(result.body.data.confidence, 0.94);
});

test('returns 404 when the conversation is missing', async () => {
  const result = await analyzeConversation({
    conversationId: new mongoose.Types.ObjectId(),
    apiKey: merchantAKey
  });

  assert.equal(result.status, 404);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /Conversation not found/i);
});

test('rejects access to conversations owned by another merchant', async () => {
  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantBKey });
  assert.equal(result.status, 403);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /do not have access/i);
});

test('rejects empty conversations', async () => {
  const result = await analyzeConversation({ conversationId: emptyConversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /Conversation is empty/i);
});

test('rejects malformed JSON returned by Gemini', async () => {
  geminiService.callGemini = async () => '{ bad json';

  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 502);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /malformed JSON|Gemini request failed/i);
});

test('validates quantity constraints in the AI response', async () => {
  geminiService.callGemini = async () => JSON.stringify({
    intent: 'create_order',
    customer: { name: null, phone: '01000000000' },
    items: [{ productName: 'T-Shirt', quantity: 0, variant: { color: 'black', size: 'XL', other: null } }],
    notes: null,
    confidence: 0.94
  });

  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 422);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /quantity/i);
});

test('validates confidence range in the AI response', async () => {
  geminiService.callGemini = async () => JSON.stringify({
    intent: 'create_order',
    customer: { name: null, phone: '01000000000' },
    items: [{ productName: 'T-Shirt', quantity: 2, variant: { color: 'black', size: 'XL', other: null } }],
    notes: null,
    confidence: 1.5
  });

  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 422);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /confidence/i);
});

test('handles provider failures safely', async () => {
  geminiService.callGemini = async () => {
    const error = new Error('Gemini outage');
    error.statusCode = 502;
    throw error;
  };

  const result = await analyzeConversation({ conversationId: conversation._id, apiKey: merchantAKey });
  assert.equal(result.status, 502);
  assert.equal(result.body.success, false);
  assert.match(result.body.message, /AI analysis failed|Gemini request failed/i);
});

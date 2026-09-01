# Ordify API

Ordify is a SaaS MVP that helps online sellers convert customer chat messages into structured orders using AI.

## Product goal

The initial MVP focuses on one flow only: customer message → AI understands the message → structured order → validation → save order → merchant dashboard.

## Tech stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JavaScript (CommonJS)
- Joi
- JWT
- bcryptjs
- dotenv

## Project structure

```text
ordify-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── apiKey.middleware.js
│   │   ├── error.middleware.js
│   │   ├── notFound.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── hash.js
│   │   └── apiResponse.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── admins/
│   │   ├── merchants/
│   │   ├── apiKeys/
│   │   ├── products/
│   │   ├── conversations/
│   │   ├── orders/
│   │   ├── ai/
│   │   └── dashboard/
│   └── routes/
│       └── index.js
├── tests/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/server.js
```

## Installation

```bash
npm install
```

## Environment variables

Create a `.env` file using the example:

```bash
cp .env.example .env
```

Required variables:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`

## Development command

```bash
npm run dev
```

## Production command

```bash
npm start
```

## Health endpoint

```http
GET /api/v1/health
```

Example response:

```json
{
  "success": true,
  "message": "Ordify API is running"
}
```

## Current MVP scope

This version is intentionally limited to a backend foundation for the order workflow:

- chat message intake
- AI parsing foundation
- order structure foundation
- validation layer
- save order flow
- merchant dashboard landing-point

## API keys

API keys let a merchant authenticate requests to Ordify without exposing a user session or admin credentials. Each API key belongs to a single merchant and must be managed by an admin.

### What API keys are

API keys are used for merchant-owned integrations and service-to-service access. They are generated as secure values in the form `ord_live_<secret>` and hashed before they are stored in MongoDB.

> Important: the raw API key is shown only once when it is created. It cannot be retrieved later.

### Admin creates an API key

```bash
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{
    "merchantId": "<merchant-id>",
    "name": "Primary Webhook Key",
    "expiresAt": "2027-01-01T00:00:00.000Z"
  }'
```

Example successful response:

```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": "<api-key-id>",
    "apiKey": "ord_live_8f7c2a...",
    "keyPrefix": "ord_live_8f7c2a",
    "name": "Primary Webhook Key",
    "expiresAt": "2027-01-01T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
}
```

### Merchant usage

A merchant sends the API key with the X-API-Key header:

```bash
curl -X GET http://localhost:3000/api/v1/api-keys/validate \
  -H "X-API-Key: ord_live_xxxxxxxxx"
```

The server validates the hashed key, checks whether the key is active and not expired, confirms the merchant is active, and then attaches the merchant identity to the request.

### Security notes

- The raw API key is never stored in MongoDB.
- The hash is stored instead.
- Revoked or expired keys are rejected with a generic 401 message.
- The raw API key is never returned by list or detail endpoints.
- Only admin users can create, list, revoke, or delete merchant API keys.

## Future roadmap

Integrations such as WhatsApp, Instagram, Facebook Messenger, and Telegram are planned for future versions. This MVP does not include those channels yet.

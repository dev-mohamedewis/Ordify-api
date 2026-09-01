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

## Future roadmap

Integrations such as WhatsApp, Instagram, Facebook Messenger, and Telegram are planned for future versions. This MVP does not include those channels yet.

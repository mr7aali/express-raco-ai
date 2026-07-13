# E-commerce Ordering and Payment API

Backend API for an e-commerce ordering and payment system built with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Stripe, and bKash.

## Features

- User registration and login with JWT authentication
- Role-based access for customers and admins
- Product CRUD with unique SKU, status, stock, and category support
- Hierarchical categories with DFS traversal for related product recommendations
- Redis cache for category tree traversal
- Order creation with deterministic subtotal and total calculation
- Safe stock reduction after successful payment
- Stripe payment intent, confirmation, and webhook handling
- bKash checkout, execute, query, and callback handling
- Strategy pattern for payment providers
- Centralized validation and error handling
- Swagger/OpenAPI and Postman documentation
- Docker support for backend, PostgreSQL, and Redis

## Tech Stack

- Node.js 22+
- Express 5
- TypeScript
- Prisma 7
- PostgreSQL
- Redis
- Stripe
- bKash sandbox/live API shape
- Jest
- Biome
- Docker Compose

## Project Structure

```txt
src/
  app.ts
  server.ts
  config/
  docs/
  generated/prisma/
  lib/
  middlewares/
  modules/
    auth/
    categories/
    orders/
    payments/
    products/
    users/
  utils/
prisma/
  migrations/
  schema.prisma
  seed.ts
scripts/
docs/
tests/
```

## Environment

Copy the example file and update secrets:

```bash
cp env.example .env
```

Required variables:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ecommerce_payment_db?schema=public
REDIS_URL=redis://localhost:6379

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin@123456

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_CURRENCY=usd

BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_CALLBACK_URL=http://localhost:5000/api/payments/bkash/callback
```

Never commit real `.env` files or payment secrets.

## Local Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Generate Prisma client:

```bash
npm run db:generate
```

Apply the included SQL migration:

```bash
npm run db:apply
```

Seed admin user, categories, and sample products:

```bash
npm run db:seed
```

Start development server:

```bash
npm run dev
```

Backend runs at:

```txt
http://localhost:5000
```

## Docker Deployment

Build and run all services:

```bash
docker compose build
docker compose up -d
```

For production containers, migration and seed can be run from compiled JavaScript:

```bash
docker compose run --rm backend node dist/scripts/apply-sql-migration.js
docker compose run --rm backend node dist/prisma/seed.js
docker compose restart backend
```

Check logs:

```bash
docker compose logs backend --tail=100
```

## API Documentation

Swagger UI:

```txt
http://localhost:5000/api/docs
```

OpenAPI JSON:

```txt
http://localhost:5000/api/docs.json
```

Postman collection:

```txt
docs/API_POSTMAN.json
```

Additional documentation:

```txt
docs/api-documentation.md
docs/database.md
docs/deployment.md
docs/payment-flow.md
docs/System Architecture Diagram-reco ai.drawio.svg
```

## Main Endpoints

```txt
GET    /health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/me
GET    /api/categories
POST   /api/categories
GET    /api/products
POST   /api/products
GET    /api/products/:id
GET    /api/products/:id/recommendations
POST   /api/orders
GET    /api/orders
POST   /api/payments/checkout
POST   /api/payments/stripe/confirm
POST   /api/payments/webhooks/stripe
GET    /api/payments/bkash/callback
```

## Stripe Webhook

Webhook endpoint:

```txt
https://your-public-url/api/payments/webhooks/stripe
```

Enabled events:

```txt
payment_intent.succeeded
payment_intent.payment_failed
```

After creating the webhook in Stripe Dashboard, copy the signing secret into:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## bKash Callback

Configure callback URL:

```env
BKASH_CALLBACK_URL=https://your-public-url/api/payments/bkash/callback
```

## Test Credentials

Seeded admin:

```txt
Email: admin@example.com
Password: Admin@123456
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript
npm start            # Run compiled server
npm test             # Run Jest tests
npm run lint         # Run Biome checks
npm run format       # Format files
npm run db:generate  # Generate Prisma client
npm run db:apply     # Apply included SQL migration
npm run db:seed      # Seed data
```

## Verification

Run before submission:

```bash
npm run lint
npm run build
npm test
```

## Error Response Format

Errors are returned in a consistent JSON shape:

```json
{
  "success": false,
  "errorCode": "VALIDATION_FAILED",
  "message": "Validation failed",
  "errors": {},
  "path": "/api/auth/register",
  "timestamp": "2026-07-14T00:00:00.000Z"
}
```

## Assignment Coverage

- OOP service/controller structure for core modules
- Relational schema with indexed users, products, categories, orders, order items, and payments
- Deterministic order subtotal and total calculation
- Safe stock decrement after successful payment
- Payment strategy pattern for Stripe and bKash
- DFS category traversal with Redis-backed category tree cache
- Migrations, seeders, API documentation, payment flow docs, Docker deployment, tests, and centralized error handling

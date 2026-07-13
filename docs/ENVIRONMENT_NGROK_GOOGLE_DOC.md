# Environment Configuration Guide and Local ngrok Setup Documentation

## Project

E-commerce Ordering and Payment System

## Submitted By

[Your Name]

## Purpose

This document explains how the backend environment is configured and how the project is exposed publicly using ngrok for testing and review.

The backend is deployed on a VPS using Docker Compose with PostgreSQL, Redis, the Express backend, the Next.js frontend, and nginx as a reverse proxy.

## Current Public Base URL

The project is currently exposed through ngrok using the following base URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/
```

Backend API base URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api
```

Health check:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/health
```

API documentation:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api/docs
```

OpenAPI JSON:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api/docs.json
```

## Deployment Environment

The application is deployed on a VPS.

The VPS runs:

- nginx on port 80
- Frontend container on internal port 3000
- Backend container on internal port 5000
- PostgreSQL container on internal port 5432
- Redis container on internal port 6379

nginx routes public requests as follows:

```txt
/            -> frontend:3000
/api/*       -> backend:5000/api/*
/health      -> backend:5000/health
```

## Backend Environment Configuration

The production backend environment file is:

```txt
/opt/ecommerce/express-raco-ai/.env.production
```

Example production configuration:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@postgres:5432/ecommerce_payment_db?schema=public
REDIS_URL=redis://redis:6379

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin@123456

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_CURRENCY=usd

BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_CALLBACK_URL=https://genia-ralliform-notarially.ngrok-free.dev/api/payments/bkash/callback
```

Important note:

Inside Docker, the backend uses service names instead of localhost:

```txt
PostgreSQL host: postgres
Redis host: redis
```

Therefore, the production database URL uses:

```txt
postgres:5432
```

not:

```txt
localhost:5433
```

## Frontend Environment Configuration

The frontend environment file is:

```txt
/opt/ecommerce/e-commerce-frontend/.env
```

Example:

```env
NEXT_PUBLIC_API_URL=https://genia-ralliform-notarially.ngrok-free.dev
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

Important note:

The frontend API URL should not include `/api`.

Correct:

```txt
https://genia-ralliform-notarially.ngrok-free.dev
```

Incorrect:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api
```

The frontend code appends API paths such as:

```txt
/api/products
/api/auth/login
/api/auth/register
```

## Docker Compose Setup

The VPS deployment uses Docker Compose from:

```txt
/opt/ecommerce/docker-compose.yml
```

Services:

```txt
nginx
frontend
backend
postgres
redis
```

Common deployment commands:

```bash
cd /opt/ecommerce
docker compose build
docker compose up -d
```

Database migration and seed commands:

```bash
docker compose run --rm backend node dist/scripts/apply-sql-migration.js
docker compose run --rm backend node dist/prisma/seed.js
docker compose restart backend
```

Status and logs:

```bash
docker compose ps
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
docker compose logs nginx --tail=100
```

## ngrok Setup

ngrok is used because there is currently no custom domain.

The ngrok tunnel forwards the public HTTPS URL to the VPS nginx server on port 80:

```bash
ngrok http 80
```

Current ngrok forwarding URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/ -> http://localhost:80
```

## Keeping ngrok Running

To keep ngrok running after closing the SSH terminal, tmux is used.

Install tmux:

```bash
apt install tmux -y
```

Create a tmux session:

```bash
tmux new -s ngrok
```

Start ngrok inside tmux:

```bash
ngrok http 80
```

Detach from tmux while keeping ngrok running:

```txt
CTRL + B
D
```

Check tmux sessions:

```bash
tmux ls
```

Reopen the ngrok tmux session:

```bash
tmux attach -t ngrok
```

## Stripe Webhook URL

Stripe webhook endpoint:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api/payments/webhooks/stripe
```

Enabled Stripe events:

```txt
payment_intent.succeeded
payment_intent.payment_failed
```

The Stripe webhook signing secret is stored in:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

## bKash Callback URL

bKash callback URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api/payments/bkash/callback
```

The backend environment variable is:

```env
BKASH_CALLBACK_URL=https://genia-ralliform-notarially.ngrok-free.dev/api/payments/bkash/callback
```

## Testing With Postman

Postman base URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev
```

Example endpoints:

```txt
POST {{baseUrl}}/api/auth/register
POST {{baseUrl}}/api/auth/login
GET  {{baseUrl}}/api/products
GET  {{baseUrl}}/api/categories
POST {{baseUrl}}/api/orders
POST {{baseUrl}}/api/payments/checkout
```

For ngrok free plan, add this header in Postman if needed:

```txt
ngrok-skip-browser-warning: true
```

## Verification Checklist

Run these commands on the VPS:

```bash
cd /opt/ecommerce
docker compose ps
curl http://127.0.0.1/health
curl http://127.0.0.1/api/products
```

Expected health response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

Public verification URLs:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/
https://genia-ralliform-notarially.ngrok-free.dev/health
https://genia-ralliform-notarially.ngrok-free.dev/api/docs
https://genia-ralliform-notarially.ngrok-free.dev/api/products
```

## Notes

The ngrok free plan may show a browser warning page. Visitors can click "Visit Site" once.

The ngrok URL can go offline if the tunnel stops. To keep it running, the tunnel is started inside a tmux session.

If ngrok restarts and gives a new URL, the following must be updated:

- Frontend `NEXT_PUBLIC_API_URL`
- Stripe webhook endpoint URL
- bKash callback URL
- Postman base URL
- Submitted demo URL

## Final Environment Verdict

The backend is configured and deployed on a VPS using Docker Compose. The public demo is exposed through ngrok at:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/
```

The backend API is available at:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api
```

This setup is suitable for assignment review and API testing without requiring a purchased domain.

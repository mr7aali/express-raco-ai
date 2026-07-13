# Environment Configuration and ngrok Setup Guide

This guide documents the environment variables, local setup, Docker setup, and ngrok public URL setup used to run and demonstrate the backend.

## 1. Environment Files

The backend reads configuration from environment variables. Start by copying the example file:

```bash
cp env.example .env
```

Do not commit real `.env` files. Use `.env` locally and `.env.production` on the VPS.

## 2. Local Development Environment

Use this when running the backend directly on your machine.

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

Local setup commands:

```bash
npm install
docker compose up -d postgres redis
npm run db:generate
npm run db:apply
npm run db:seed
npm run dev
```

Local backend URL:

```txt
http://localhost:5000
```

## 3. VPS Docker Environment

Use this when running the backend in Docker Compose on a VPS.

Example `/opt/ecommerce/express-raco-ai/.env.production`:

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@postgres:5432/ecommerce_payment_db?schema=public
REDIS_URL=redis://redis:6379

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
BKASH_CALLBACK_URL=http://YOUR_PUBLIC_URL/api/payments/bkash/callback
```

Important Docker differences:

```txt
PostgreSQL host: postgres
PostgreSQL port: 5432
Redis host: redis
Redis port: 6379
```

So the container database URL must use:

```txt
postgresql://postgres:password@postgres:5432/ecommerce_payment_db?schema=public
```

not:

```txt
localhost:5433
```

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

Docker deployment commands:

```bash
cd /opt/ecommerce
docker compose build backend
docker compose up -d postgres redis backend
docker compose run --rm backend node dist/scripts/apply-sql-migration.js
docker compose run --rm backend node dist/prisma/seed.js
docker compose restart backend
```

## 4. ngrok Setup

ngrok is used to expose the backend/VPS publicly over HTTPS when there is no domain.

Install ngrok:

```bash
snap install ngrok
```

If snap is unavailable, install from ngrok's apt repository:

```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null

echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
  | tee /etc/apt/sources.list.d/ngrok.list

apt update
apt install ngrok -y
```

Add your ngrok auth token:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

If nginx is serving the app on VPS port 80, start:

```bash
ngrok http 80
```

If running backend directly on local port 5000, start:

```bash
ngrok http 5000
```

Example public URL:

```txt
https://genia-ralliform-notarially.ngrok-free.dev
```

Then the backend API base URL is:

```txt
https://genia-ralliform-notarially.ngrok-free.dev/api
```

## 5. Public URLs

When ngrok forwards to nginx on port 80:

```txt
Frontend:
https://your-ngrok-url

Backend API:
https://your-ngrok-url/api

Health:
https://your-ngrok-url/health

Swagger docs:
https://your-ngrok-url/api/docs

OpenAPI JSON:
https://your-ngrok-url/api/docs.json

Stripe webhook:
https://your-ngrok-url/api/payments/webhooks/stripe

bKash callback:
https://your-ngrok-url/api/payments/bkash/callback
```

## 6. Frontend Environment With ngrok

The frontend should use the public root URL without `/api`:

```env
NEXT_PUBLIC_API_URL=https://your-ngrok-url
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

Next.js public environment variables are baked into the build, so rebuild the frontend after changing this:

```bash
cd /opt/ecommerce
docker compose build frontend
docker compose up -d frontend nginx
```

## 7. Stripe Webhook Configuration

In Stripe Dashboard, create a webhook endpoint:

```txt
https://your-ngrok-url/api/payments/webhooks/stripe
```

Enable these events:

```txt
payment_intent.succeeded
payment_intent.payment_failed
```

Copy the signing secret and update:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

Restart backend after updating the secret:

```bash
docker compose up -d backend
docker compose restart backend
```

## 8. bKash Callback Configuration

Set:

```env
BKASH_CALLBACK_URL=https://your-ngrok-url/api/payments/bkash/callback
```

Restart backend:

```bash
docker compose restart backend
```

## 9. Testing With ngrok

Browser:

```txt
https://your-ngrok-url
https://your-ngrok-url/health
https://your-ngrok-url/api/docs
```

curl:

```bash
curl https://your-ngrok-url/health
curl https://your-ngrok-url/api/products
```

Postman header for ngrok free warning:

```txt
ngrok-skip-browser-warning: true
```

## 10. Notes About ngrok Free Plan

The free ngrok plan can show a warning page in browsers. Visitors can click "Visit Site" once. API clients can send:

```txt
ngrok-skip-browser-warning: true
```

The free ngrok URL can change when the tunnel restarts. If it changes, update:

```txt
NEXT_PUBLIC_API_URL
BKASH_CALLBACK_URL
Stripe webhook endpoint URL
```

Then rebuild/restart the affected services.

## 11. Verification Checklist

```bash
docker compose ps
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
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

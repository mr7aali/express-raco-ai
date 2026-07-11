# Deployment and Environment Guide

## Environment

Copy `env.example` to `.env` and fill real credentials before live usage.

Important values:

```txt
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ecommerce_payment_db?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-long-random-secret
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli_or_dashboard
STRIPE_CURRENCY=usd
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_APP_KEY=your_bkash_app_key
BKASH_APP_SECRET=your_bkash_app_secret
BKASH_USERNAME=your_bkash_username
BKASH_PASSWORD=your_bkash_password
BKASH_CALLBACK_URL=http://localhost:5000/api/payments/bkash/callback
```

## Development

Run database/cache in Docker and backend locally:

```bash
docker compose up -d postgres redis
npm run db:apply
npm run db:seed
npm run dev
```

Backend URL:

```txt
http://localhost:5000
```

Health check:

```txt
GET http://localhost:5000/health
```

## Docker Demo Deployment

Run backend, PostgreSQL, and Redis together:

```bash
docker compose up -d
```

Check containers:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs -f backend
```

Stop everything:

```bash
docker compose down
```

## Webhooks With ngrok

Start backend locally or with Docker, then expose it:

```bash
ngrok http 5000
```

Stripe webhook URL:

```txt
https://your-ngrok-url.ngrok-free.app/api/payments/webhooks/stripe
```

bKash callback URL:

```txt
https://your-ngrok-url.ngrok-free.app/api/payments/bkash/callback
```

Update `.env` with the public callback URL before testing bKash callbacks.

# Database Setup

Use PostgreSQL as the primary database and Redis as the cache.

PostgreSQL stores the assignment's relational data:

- `users`: registered users and admins
- `categories`: parent-child category tree for DFS recommendations
- `products`: products with unique SKU, price, stock, and status
- `orders`: user orders with total amount and status
- `order_items`: products inside each order
- `payments`: Stripe/bKash transaction records with raw provider response

Redis stores short-lived/cache data:

- category tree cache
- DFS recommendation results
- optional payment/session temporary values

## Local Usage

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Create the database tables:

```bash
npm run db:migrate -- --name init
npm run db:generate
```

Seed an admin user and sample products:

```bash
npm run db:seed
```

Open Prisma Studio:

```bash
npm run db:studio
```

Default seeded admin:

```txt
email: admin@example.com
password: Admin@123456
```

Change these values in `.env` using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

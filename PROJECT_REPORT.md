# Project Report: E-commerce Ordering and Payment System

## 1. Executive Summary

This project implements a backend system for an e-commerce ordering and payment workflow. The system supports users, products, categories, orders, and payments with Stripe and bKash integrations. It uses a relational PostgreSQL database, Prisma ORM, Redis caching, JWT authentication, centralized validation, centralized error handling, and Docker-based deployment.

The final implementation satisfies the core assignment requirements: clean REST APIs, user management, product management, order creation, payment initiation and verification, Stripe webhook handling, bKash checkout/callback handling, OOP-style service organization, strategy pattern for payments, DFS category traversal, Redis caching, migrations, seeders, documentation, tests, and Docker deployment.

## 2. Implementation Approach and Rationale

### 2.1 Backend Architecture

The backend is built with Express and TypeScript. The codebase is organized by feature modules:

```txt
src/modules/auth
src/modules/users
src/modules/categories
src/modules/products
src/modules/orders
src/modules/payments
```

Each module uses a route, controller, validation, and service structure where appropriate. This keeps HTTP concerns separate from business logic.

The main application file mounts routers as follows:

```txt
/api/auth
/api/users
/api/categories
/api/products
/api/orders
/api/payments
/api/payments/webhooks/stripe
```

This modular structure was chosen because it is easy to test, easy to extend, and clear for reviewers to follow.

### 2.2 Database Design

PostgreSQL is used as the primary database. Prisma defines the schema and generated client. The schema includes:

```txt
users
categories
products
orders
order_items
payments
```

Important design decisions:

- UUID primary keys are used for all major entities.
- `users.email`, `products.sku`, and `payments.transaction_id` are unique.
- `categories` use a self-referencing parent-child relationship.
- `orders` and `order_items` model a many-product order.
- `payments` stores provider, transaction ID, status, and raw provider response.
- Indexes are added to role, status, category, price, user, provider/status, and created date fields for faster filtering.

This schema directly supports the assignment's relational data structure requirement.

### 2.3 Authentication and Authorization

JWT authentication is used. Users can register and login. Protected routes use `requireAuth`, while admin routes additionally use `requireRole("ADMIN")`.

Passwords are hashed with bcrypt before storage. JWT secrets and payment keys are read from environment variables.

### 2.4 Product and Category Management

Admins can create, update, and delete products. Products include:

```txt
id, name, sku, description, price, stock, status, categoryId, timestamps
```

Categories support hierarchy through `parentId`. This enables category trees and related product recommendations.

### 2.5 Order Management Algorithm

Order creation is deterministic:

1. Duplicate product items are merged.
2. Products are loaded from the database.
3. Product availability and stock are validated.
4. Each line subtotal is calculated as `price * quantity`.
5. The order total is calculated by summing all subtotals.
6. The order and order items are saved together.

Stock reduction happens only after a payment succeeds. Stock is decremented inside a database transaction using `updateMany` with a `stock >= quantity` guard. This prevents stock from going negative.

### 2.6 Payment Strategy Pattern

Payments are implemented with a strategy pattern:

```txt
PaymentContext
StripePaymentStrategy
BkashPaymentStrategy
```

`PaymentContext` delegates payment creation, confirmation, and webhook handling to the selected provider strategy. This allows new providers to be added later without rewriting the core checkout flow.

Stripe supports:

- Create payment intent
- Confirm payment intent
- Webhook handling for `payment_intent.succeeded`
- Webhook handling for `payment_intent.payment_failed`

bKash supports:

- Token grant
- Checkout/create payment
- Execute payment
- Query payment
- Callback handling

### 2.7 DFS and Redis Caching

Category hierarchy traversal uses DFS. The category tree is cached in Redis using the key:

```txt
categories:tree
```

When category data changes, the cache is invalidated. If Redis is unavailable, the system falls back to building the tree from the database, so the application still works.

This satisfies the DFS and caching requirement while keeping the system resilient.

### 2.8 Error Handling

The backend uses centralized error handling. All handled errors return a consistent shape:

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

Handled error categories include:

- Validation errors
- Authentication and authorization errors
- Duplicate email/SKU/payment transaction errors
- Invalid related records
- Missing resources
- Database schema or connection errors
- Malformed JSON bodies
- Stripe errors
- bKash/external provider errors
- Unknown server errors with safe messages

This gives understandable messages without exposing secrets or stack traces in production responses.

## 3. Rejected Alternatives

### 3.1 MongoDB Instead of PostgreSQL

MongoDB was rejected because the assignment explicitly benefits from relational tables, foreign keys, indexed fields, orders with items, and payment relationships. PostgreSQL is a better fit for transactional order and payment data.

### 3.2 Manual SQL Queries Instead of Prisma

Manual SQL was rejected because Prisma provides type-safe queries, schema modeling, generated client types, and easier maintainability. A small SQL migration helper is still included for deployment reliability.

### 3.3 Single Payment Service Without Strategy Pattern

A single payment service with `if/else` logic was rejected because it would become harder to maintain as more providers are added. The strategy pattern keeps provider-specific logic isolated.

### 3.4 Reducing Stock During Order Creation

Reducing stock immediately when an order is created was rejected because users may abandon payment. The implemented flow reduces stock only after payment success, which matches the assignment requirement.

### 3.5 Caching Every Product Query

Full product-list caching was rejected to avoid stale product and stock data. Only the category tree is cached because it changes less frequently and directly supports DFS traversal.

### 3.6 Returning Raw Errors to API Clients

Returning raw stack traces or provider errors was rejected for security. The final implementation returns safe, understandable messages and logs full errors on the server.

## 4. Testing Approach and Reports

### 4.1 Testing Strategy

The project includes Jest tests focused on:

- Request validation
- Data coercion and defaults
- Empty update rejection
- Required order items
- Pagination defaults
- Payment provider normalization
- Payment strategy delegation and strategy switching
- Payment confirmation and webhook delegation

The tests avoid requiring a live database so they can run quickly in local and CI environments.

### 4.2 Test Files

```txt
tests/validation.test.ts
tests/payment-context.test.ts
```

### 4.3 Commands Used

```bash
npm run lint
npm run build
npm test
```

### 4.4 Latest Test Report

```txt
Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
Snapshots:   0 total
```

### 4.5 Manual Verification

Manual verification was also performed for:

- Health endpoint
- User registration
- User login
- Product listing
- Swagger documentation
- Docker container startup
- VPS/ngrok routing through nginx

Important URLs:

```txt
GET /health
GET /api/docs
GET /api/products?page=1&limit=12
POST /api/auth/register
POST /api/auth/login
```

## 5. API and Router Documentation

### 5.1 Root App Routes

```txt
GET /health
GET /api/docs
GET /api/docs.json
```

### 5.2 Auth Router

Base path:

```txt
/api/auth
```

Routes:

```txt
POST /register
POST /login
```

Purpose:

- Register a new customer
- Login and receive a JWT token

### 5.3 User Router

Base path:

```txt
/api/users
```

Routes:

```txt
GET /me
GET /me/orders
GET /me/payments
```

Purpose:

- View authenticated user profile
- View user's orders
- View user's payments

### 5.4 Category Router

Base path:

```txt
/api/categories
```

Routes:

```txt
GET /
GET /:id
GET /:id/children
GET /:id/products
POST /
PATCH /:id
DELETE /:id
```

Purpose:

- Manage category hierarchy
- Retrieve child categories
- Retrieve products under a category tree

Admin authorization is required for create, update, and delete.

### 5.5 Product Router

Base path:

```txt
/api/products
```

Routes:

```txt
GET /
GET /:id
GET /:id/recommendations
POST /
PATCH /:id
DELETE /:id
```

Purpose:

- List and filter products
- View product details
- Get recommendations using category DFS
- Admin product management

Admin authorization is required for create, update, and delete.

### 5.6 Order Router

Base path:

```txt
/api/orders
```

Routes:

```txt
POST /
GET /
GET /:id
PATCH /:id/cancel
```

Purpose:

- Create orders
- List authenticated user's orders
- View order details
- Cancel pending orders

Authentication is required.

### 5.7 Payment Router

Base path:

```txt
/api/payments
```

Routes:

```txt
POST /checkout
POST /stripe/confirm
POST /bkash/execute
POST /bkash/query
GET /bkash/callback
```

Purpose:

- Start checkout with Stripe or bKash
- Confirm Stripe payments
- Execute or query bKash payments
- Handle bKash callback

Authentication is required for checkout.

### 5.8 Stripe Webhook Router

Base path:

```txt
/api/payments/webhooks/stripe
```

Routes:

```txt
POST /
```

Supported events:

```txt
payment_intent.succeeded
payment_intent.payment_failed
```

The webhook uses `express.raw()` before JSON parsing so Stripe signature verification can work correctly.

### 5.9 Documentation Files

```txt
docs/api-documentation.md
docs/API.json
docs/API_POSTMAN.json
docs/database.md
docs/deployment.md
docs/payment-flow.md
docs/System Architecture Diagram-reco ai.drawio.svg
```

## 6. Deployment Summary

The backend is Dockerized and can run with PostgreSQL and Redis through Docker Compose. A VPS deployment can expose the app through nginx on port 80. For HTTPS demos without a domain, ngrok can forward the public HTTPS URL to the VPS.

Typical production flow:

```bash
docker compose build
docker compose up -d postgres redis
docker compose run --rm backend node dist/scripts/apply-sql-migration.js
docker compose run --rm backend node dist/prisma/seed.js
docker compose up -d
```

For Stripe webhooks, the configured endpoint is:

```txt
https://your-public-url/api/payments/webhooks/stripe
```

For bKash callbacks:

```txt
https://your-public-url/api/payments/bkash/callback
```

## 7. Known Limitations

- The current tests are focused and fast, but they do not spin up a real PostgreSQL test database.
- bKash behavior depends on valid sandbox/live merchant credentials.
- Stripe live payments require live keys, a public HTTPS endpoint, and production webhook configuration.
- ngrok free URLs can change and show a browser warning page.
- Frontend environment variables are baked into the Next.js build and require rebuilds when changed.

## 8. Final Verdict

The project is complete for the assignment requirements. It provides a clean REST backend with user, product, category, order, and payment workflows; supports Stripe and bKash with an extensible strategy pattern; uses PostgreSQL with proper relational modeling; implements DFS traversal and Redis caching; includes validation, secure configuration, logging, centralized error handling, documentation, tests, seed data, and Docker deployment.

The final system is suitable for assessment review and can be demonstrated locally, through VPS IP hosting, or through an ngrok public URL.

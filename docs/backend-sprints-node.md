# Backend Development Sprints
## Local Commerce Management SaaS — Egypt
### Node.js + Express + PostgreSQL + Redis + Cloudflare R2

> **Stack:** Node.js 20 LTS, Express 4, PostgreSQL (`pg` pool), Redis (ioredis + BullMQ), Cloudflare R2 (AWS SDK v3), JWT (RS256 via `jsonwebtoken`)
> **Base URL:** `/api/v1`
> **Project Structure:** Modular Express — each feature is a self-contained router mounted on the main app
> **All authenticated routes enforce `vendor_id` scoping via `tenantMiddleware` unless marked `[PUBLIC]` or `[ADMIN]`**

---

## Project Folder Structure

```
src/
├── app.js                        # Express app: middleware stack + router mounting
├── server.js                     # HTTP server entry point (app.listen)
├── config/
│   ├── env.js                    # Env validation (Joi) — crash fast on startup
│   ├── db.js                     # pg Pool singleton
│   └── redis.js                  # ioredis client singleton
├── middleware/
│   ├── auth.js                   # JWT verify → attaches req.vendor
│   ├── tenant.js                 # Extracts vendor_id from JWT → req.vendorId (CRITICAL)
│   ├── adminAuth.js              # Admin-only JWT guard
│   ├── planGuard.js              # Rejects writes when trial expired / limit hit
│   ├── rateLimiter.js            # express-rate-limit configs per route group
│   ├── validate.js               # Joi schema validation factory
│   └── errorHandler.js           # Global 4-param error handler (must be last)
├── modules/
│   ├── auth/
│   │   ├── auth.router.js
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   ├── products/
│   │   ├── products.router.js
│   │   ├── products.controller.js
│   │   ├── products.service.js
│   │   └── products.schema.js    # Joi schemas
│   ├── customers/
│   ├── orders/
│   │   └── stateMachine.js       # Order state transition rules
│   ├── delivery-zones/
│   ├── analytics/
│   ├── storefront/               # All PUBLIC routes under /storefront/:slug
│   ├── admin/
│   ├── staff/                    # Phase 2
│   └── rfq/                      # Phase 2
├── db/
│   ├── migrations/               # SQL files run by node-pg-migrate
│   └── seeds/                    # Governorates + plans seed scripts
├── workers/
│   └── notification.worker.js    # BullMQ worker process (separate Node process)
└── utils/
    ├── AppError.js               # Custom operational error class
    ├── asyncHandler.js           # Wraps async controllers — no try/catch boilerplate
    ├── jwt.js                    # signAccess / signRefresh / verifyToken
    ├── hash.js                   # bcrypt helpers
    ├── phoneValidator.js         # Egyptian phone regex
    └── r2Upload.js               # Sharp resize + R2 upload helper
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "pg": "^8.11.0",
    "node-pg-migrate": "^6.2.0",
    "ioredis": "^5.3.0",
    "bullmq": "^5.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "joi": "^17.12.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "@aws-sdk/client-s3": "^3.500.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.2.0",
    "cookie-parser": "^1.4.6",
    "pino": "^8.19.0",
    "pino-http": "^9.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "nodemon": "^3.1.0"
  }
}
```

---

## Core Patterns (Express-Specific)

### asyncHandler — eliminates try/catch in every route
```js
// utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
module.exports = asyncHandler;
```

### AppError — structured operational errors
```js
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;   // e.g. 'ORDER_STATUS_INVALID'
    this.isOperational = true;
  }
}
module.exports = AppError;
```

### Global Error Handler (must be last middleware in app.js)
```js
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    data: null,
    meta: null,
    error: {
      message: err.isOperational ? err.message : 'Internal server error',
      errorCode: err.errorCode || 'INTERNAL_ERROR',
    }
  });
};
```

### Joi Validation Middleware Factory
```js
// middleware/validate.js
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false });
  if (error) return next(new AppError(
    error.details.map(d => d.message).join(', '), 422, 'VALIDATION_ERROR'
  ));
  req[source] = value;
  next();
};
module.exports = validate;
```

### Response Envelope
```js
// Attached in app.js before routers
app.use((req, res, next) => {
  res.success = (data, meta = null) => res.json({ data, meta, error: null });
  next();
});
```

---

## PHASE 1 — MVP (Weeks 1–10)

---

### SPRINT 1 — Project Foundation & DevOps (Week 1)

**Goal:** Runnable Express app with DB, Redis, env validation, Docker, and CI/CD.

#### Tasks

- [ ] **1.1 — Express App Bootstrap**
  - `src/app.js` exports the configured Express app (no `listen` call — that lives in `server.js`)
  - Separating app from server allows `supertest` in tests to import `app` without binding a port
  - ESLint (`eslint-config-airbnb-base`) + Prettier + Husky pre-commit hooks

- [ ] **1.2 — Global Middleware Stack (order in app.js is critical)**
  ```js
  app.use(pinoHttp());                          // 1. Logging first
  app.use(helmet());                            // 2. Security headers
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {                 // Response envelope helper
    res.success = (data, meta = null) => res.json({ data, meta, error: null });
    next();
  });

  // Public routes (no auth)
  app.use('/api/v1/storefront', storefrontRouter);
  app.use('/api/v1/auth', authLimiter, authRouter);

  // Vendor-authenticated routes
  app.use('/api/v1/products', authMiddleware, tenantMiddleware, planGuard, productsRouter);
  app.use('/api/v1/orders', authMiddleware, tenantMiddleware, planGuard, ordersRouter);
  app.use('/api/v1/customers', authMiddleware, tenantMiddleware, customersRouter);
  app.use('/api/v1/delivery-zones', authMiddleware, tenantMiddleware, deliveryZonesRouter);
  app.use('/api/v1/analytics', authMiddleware, tenantMiddleware, analyticsRouter);

  // Admin routes
  app.use('/api/v1/admin', adminAuthMiddleware, adminRouter);

  app.use(errorHandler);                        // MUST be last
  ```

- [ ] **1.3 — PostgreSQL Pool (`config/db.js`)**
  ```js
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,               // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  // Helper used everywhere: db.query(sql, params)
  module.exports = { query: (text, params) => pool.query(text, params), pool };
  ```

- [ ] **1.4 — Redis Client (`config/redis.js`)**
  ```js
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL, { lazyConnect: false });
  redis.on('error', (err) => console.error('Redis error:', err));
  module.exports = redis;
  // BullMQ uses a separate connection (ioredis doesn't share connections with BullMQ)
  ```

- [ ] **1.5 — Environment Validation (`config/env.js`)**
  ```js
  // Runs synchronously on startup — crashes immediately if any required var is missing
  const Joi = require('joi');
  const schema = Joi.object({
    NODE_ENV:              Joi.string().valid('development', 'staging', 'production').required(),
    PORT:                  Joi.number().default(3000),
    DATABASE_URL:          Joi.string().uri().required(),
    REDIS_URL:             Joi.string().required(),
    JWT_PRIVATE_KEY:       Joi.string().required(),   // RS256 PEM — newlines as \n in .env
    JWT_PUBLIC_KEY:        Joi.string().required(),
    R2_ACCOUNT_ID:         Joi.string().required(),
    R2_ACCESS_KEY_ID:      Joi.string().required(),
    R2_SECRET_ACCESS_KEY:  Joi.string().required(),
    R2_BUCKET_NAME:        Joi.string().required(),
    R2_PUBLIC_URL:         Joi.string().uri().required(),
    ADMIN_JWT_SECRET:      Joi.string().min(32).required(),
  }).unknown(false);
  const { error, value } = schema.validate(process.env, { allowUnknown: true });
  if (error) { console.error('Config error:', error.message); process.exit(1); }
  module.exports = value;
  ```

- [ ] **1.6 — CI/CD**
  - GitHub Actions: `lint → test → build` on every PR
  - Docker: `Dockerfile` (node:20-alpine, non-root user) + `docker-compose.yml` (app + postgres + redis)
  - Auto-deploy to staging on merge to `main`
  - `.env.example` committed, `.env` gitignored

- [ ] **1.7 — Database Schema — Initial Migration**

  ```sql
  -- db/migrations/001_initial_schema.sql

  CREATE TABLE vendors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name_ar    VARCHAR(200) NOT NULL,
    business_name_en    VARCHAR(200),
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    store_slug          VARCHAR(50) UNIQUE NOT NULL,
    logo_url            TEXT,
    banner_url          TEXT,
    settings            JSONB DEFAULT '{}',
    plan_id             UUID,
    trial_ends_at       TIMESTAMPTZ,
    is_active           BOOLEAN DEFAULT true,
    refresh_token_hash  VARCHAR(255),
    last_order_number   INT DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name_ar         VARCHAR(300) NOT NULL,
    name_en         VARCHAR(300),
    description_ar  TEXT,
    description_en  TEXT,
    product_type    VARCHAR(20) NOT NULL DEFAULT 'standard'
                    CHECK (product_type IN ('standard','made_to_order','perishable','digital')),
    base_price      NUMERIC(10,2) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    images          JSONB DEFAULT '[]',
    custom_fields   JSONB DEFAULT '[]',
    sort_order      INT DEFAULT 0,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE product_variants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id      UUID NOT NULL REFERENCES vendors(id),
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    combination    JSONB NOT NULL,
    price_override NUMERIC(10,2),
    stock          INT,
    sku            VARCHAR(100),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE customers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id  UUID NOT NULL REFERENCES vendors(id),
    name       VARCHAR(200) NOT NULL,
    phone      VARCHAR(20) NOT NULL,
    addresses  JSONB DEFAULT '[]',
    notes      TEXT,
    source     VARCHAR(50),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, phone)
  );

  CREATE TABLE orders (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id            UUID NOT NULL REFERENCES vendors(id),
    order_number         INT NOT NULL,
    customer_id          UUID REFERENCES customers(id),
    status               VARCHAR(50) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled','pending_cod_collection')),
    items                JSONB NOT NULL,
    subtotal             NUMERIC(10,2) NOT NULL,
    delivery_fee         NUMERIC(10,2) DEFAULT 0,
    total                NUMERIC(10,2) NOT NULL,
    payment_method       VARCHAR(50) DEFAULT 'cod',
    delivery_governorate VARCHAR(100),
    delivery_address     TEXT,
    delivery_promise     TEXT,
    cod_collected        BOOLEAN,
    status_history       JSONB DEFAULT '[]',
    notes                TEXT,
    idempotency_key      VARCHAR(100),
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, order_number),
    UNIQUE(vendor_id, idempotency_key)
  );

  CREATE TABLE delivery_zones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id               UUID NOT NULL REFERENCES vendors(id),
    governorate             VARCHAR(100) NOT NULL,
    fee                     NUMERIC(10,2) DEFAULT 0,
    free_delivery_threshold NUMERIC(10,2),
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, governorate)
  );

  CREATE TABLE subscription_plans (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(50) NOT NULL,
    price_egp            NUMERIC(10,2),
    product_limit        INT,
    order_limit_monthly  INT,
    features             JSONB DEFAULT '{}',
    created_at           TIMESTAMPTZ DEFAULT NOW()
  );

  -- Performance indexes
  CREATE INDEX idx_products_vendor        ON products(vendor_id) WHERE deleted_at IS NULL;
  CREATE INDEX idx_orders_vendor          ON orders(vendor_id);
  CREATE INDEX idx_orders_vendor_status   ON orders(vendor_id, status);
  CREATE INDEX idx_orders_vendor_created  ON orders(vendor_id, created_at DESC);
  CREATE INDEX idx_customers_vendor_phone ON customers(vendor_id, phone) WHERE deleted_at IS NULL;
  CREATE INDEX idx_delivery_zones_vendor  ON delivery_zones(vendor_id);
  ```

- [ ] **1.8 — Seed Scripts**
  ```js
  // db/seeds/governorates.js — array of 27 Arabic governorate names
  // db/seeds/plans.js — Starter(199), Growth(499), Pro(999), Enterprise(1999)
  // npm script: "seed": "node db/seeds/run.js"
  ```

---

### SPRINT 2 — Authentication Module (Week 2)

**Goal:** Vendor auth with RS256 JWT, refresh rotation, tenant isolation middleware.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/auth/register` | `[PUBLIC]` | Vendor registration |
| `POST` | `/api/v1/auth/login` | `[PUBLIC]` | Login → access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | `[PUBLIC]` | Rotate refresh token (reads httpOnly cookie) |
| `POST` | `/api/v1/auth/logout` | `JWT` | Invalidate refresh token |
| `GET` | `/api/v1/auth/me` | `JWT` | Get current vendor profile |
| `PATCH` | `/api/v1/auth/profile` | `JWT` | Update store profile |

#### Tasks

- [ ] **2.1 — JWT Helpers (`utils/jwt.js`)**
  ```js
  const jwt = require('jsonwebtoken');
  const env = require('../config/env');

  const signAccess = (payload) =>
    jwt.sign(payload, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' });

  const signRefresh = (payload) =>
    jwt.sign(payload, env.JWT_PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '30d' });

  const verifyToken = (token) =>
    jwt.verify(token, env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] });

  module.exports = { signAccess, signRefresh, verifyToken };
  ```

- [ ] **2.2 — Auth Middleware (`middleware/auth.js`)**
  ```js
  const { verifyToken } = require('../utils/jwt');
  const AppError = require('../utils/AppError');
  const asyncHandler = require('../utils/asyncHandler');

  module.exports = asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const decoded = verifyToken(header.split(' ')[1]);  // throws on invalid/expired
    req.vendor = decoded;  // { vendor_id, email, plan_id }
    next();
  });
  ```

- [ ] **2.3 — Tenant Middleware (`middleware/tenant.js`) — CRITICAL**
  ```js
  // Applied AFTER authMiddleware on ALL vendor-scoped routes
  // Services must ONLY use req.vendorId — never trust req.body.vendor_id or req.params
  const AppError = require('../utils/AppError');
  module.exports = (req, res, next) => {
    if (!req.vendor?.vendor_id)
      throw new AppError('Forbidden', 403, 'TENANT_FORBIDDEN');
    req.vendorId = req.vendor.vendor_id;
    next();
  };
  ```

- [ ] **2.4 — Rate Limiters (`middleware/rateLimiter.js`)**
  ```js
  const rateLimit = require('express-rate-limit');
  const envelope = (msg, code) => ({ data: null, meta: null, error: { message: msg, errorCode: code } });

  exports.authLimiter    = rateLimit({ windowMs: 60000, max: 5,   message: envelope('Too many attempts', 'RATE_LIMITED') });
  exports.orderLimiter   = rateLimit({ windowMs: 60000, max: 60,  keyGenerator: (req) => req.vendorId || req.ip });
  exports.generalLimiter = rateLimit({ windowMs: 60000, max: 300, keyGenerator: (req) => req.vendorId || req.ip });
  ```

- [ ] **2.5 — `POST /auth/register`**
  - Joi schema: `business_name_ar` (required), `business_name_en`, `email`, `phone` (EGY regex), `password` (min 8), `store_slug`
  - Slug rules: `/^[a-z0-9-]{3,50}$/`, unique in DB, not in reserved list: `['admin','api','www','support','login','store','auth','dashboard']`
  - `bcrypt.hash(password, 12)`
  - Insert vendor row in DB
  - Batch-insert 27 delivery zone rows for the new vendor
  - Return: `{ vendor, access_token }` + set refresh token in `httpOnly` cookie

- [ ] **2.6 — `POST /auth/login`**
  - Lookup vendor by email → `bcrypt.compare(password, hash)`
  - On success: `signAccess({ vendor_id, email, plan_id })` + `signRefresh({ vendor_id })`
  - `bcrypt.hash(refreshToken, 10)` → store in `vendors.refresh_token_hash`
  - `res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 30 * 24 * 3600 * 1000 })`

- [ ] **2.7 — `POST /auth/refresh`**
  - Read `req.cookies.refresh_token`
  - `verifyToken(token)` → extract `vendor_id`
  - Fetch vendor → `bcrypt.compare(token, vendor.refresh_token_hash)` — prevents replay after rotation
  - Issue new pair, update hash, reset cookie

- [ ] **2.8 — `POST /auth/logout`**
  - `UPDATE vendors SET refresh_token_hash = NULL WHERE id = $1`
  - `res.clearCookie('refresh_token')`

- [ ] **2.9 — `PATCH /auth/profile`**
  - Joi: `logo_url`, `banner_url`, `business_name_ar`, `business_name_en`, `settings`
  - `UPDATE vendors SET ... WHERE id = $1` — always `req.vendorId`
  - Invalidate Redis store cache: `redis.del('store:' + vendor.store_slug)`

---

### SPRINT 3 — Product Module (Week 3)

**Goal:** Full product CRUD, variant matrix, custom fields, image upload.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/products` | `JWT` | List vendor products (paginated) |
| `POST` | `/api/v1/products` | `JWT` | Create product |
| `GET` | `/api/v1/products/:id` | `JWT` | Product detail |
| `PATCH` | `/api/v1/products/:id` | `JWT` | Update product |
| `DELETE` | `/api/v1/products/:id` | `JWT` | Soft delete |
| `PATCH` | `/api/v1/products/:id/toggle` | `JWT` | Toggle is_active |
| `POST` | `/api/v1/products/:id/variants` | `JWT` | Upsert full variant matrix |
| `GET` | `/api/v1/products/:id/variants` | `JWT` | List variants |
| `POST` | `/api/v1/products/upload-image` | `JWT` | Upload → R2 → return CDN URL |
| `GET` | `/api/v1/storefront/:slug/products` | `[PUBLIC]` | Public product listing |
| `GET` | `/api/v1/storefront/:slug/products/:id` | `[PUBLIC]` | Public product detail |

> ⚠️ **Router order:** `POST /products/upload-image` MUST be registered BEFORE `GET /products/:id` in the router file.

#### Tasks

- [ ] **3.1 — Product CRUD Service**
  - All queries: `WHERE vendor_id = $1` using `req.vendorId`
  - Plan limit before insert:
    ```js
    const { rows } = await db.query(
      `SELECT COUNT(*) FROM products WHERE vendor_id = $1 AND deleted_at IS NULL`, [vendorId]
    );
    if (plan.product_limit && parseInt(rows[0].count) >= plan.product_limit)
      throw new AppError('Product limit reached', 402, 'PLAN_PRODUCT_LIMIT');
    ```
  - Soft delete: `UPDATE products SET deleted_at = NOW() WHERE id = $1 AND vendor_id = $2`

- [ ] **3.2 — Variant Upsert (Transaction)**
  ```js
  // POST /products/:id/variants — body: [{ combination, price_override, stock }]
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    // Verify product belongs to vendor
    await client.query(`DELETE FROM product_variants WHERE product_id=$1 AND vendor_id=$2`, [productId, vendorId]);
    if (variants.length > 0) {
      const values = variants.map((v, i) => `($${i*5+1},$${i*5+2},$${i*5+3}::jsonb,$${i*5+4},$${i*5+5})`).join(',');
      const params = variants.flatMap(v => [vendorId, productId, JSON.stringify(v.combination), v.price_override ?? null, v.stock ?? null]);
      await client.query(`INSERT INTO product_variants (vendor_id,product_id,combination,price_override,stock) VALUES ${values}`, params);
    }
    await client.query('COMMIT');
  } catch(e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
  ```

- [ ] **3.3 — Image Upload Route + R2 Service**
  ```js
  // products.router.js
  const multer = require('multer');
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype))
        return cb(new AppError('Invalid file type', 415, 'IMAGE_TYPE_INVALID'));
      cb(null, true);
    }
  });
  router.post('/upload-image', upload.single('image'), asyncHandler(controller.uploadImage));

  // utils/r2Upload.js
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const sharp = require('sharp');
  const { v4: uuid } = require('uuid');
  const s3 = new S3Client({ region: 'auto', endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } });

  const uploadImage = async (buffer, vendorId) => {
    const resized = await sharp(buffer).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const key = `${vendorId}/${uuid()}.webp`;
    await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Body: resized, ContentType: 'image/webp' }));
    return `${R2_PUBLIC_URL}/${key}`;
  };
  ```

- [ ] **3.4 — Public Product Listing (Redis cached)**
  ```js
  // GET /storefront/:slug/products — no auth middleware on this router
  const cacheKey = `storefront:${slug}:products:p${page}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.success(JSON.parse(cached));
  // Query: join products + first variant for price range
  await redis.setex(cacheKey, 30, JSON.stringify(result));  // 30s TTL
  res.success(result);
  ```

---

### SPRINT 4 — Customer CRM Module (Week 4)

**Goal:** Guest customer profiles, auto-creation on order, phone-based linking.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/customers` | `JWT` | List customers (search by name/phone) |
| `POST` | `/api/v1/customers` | `JWT` | Create guest customer |
| `GET` | `/api/v1/customers/lookup` | `JWT` | Lookup by phone |
| `GET` | `/api/v1/customers/:id` | `JWT` | Profile + order history |
| `PATCH` | `/api/v1/customers/:id` | `JWT` | Update profile |
| `DELETE` | `/api/v1/customers/:id` | `JWT` | Soft delete |

> ⚠️ **Router order:** `GET /customers/lookup` MUST be registered BEFORE `GET /customers/:id`.

#### Tasks

- [ ] **4.1 — Customer CRUD**
  - All queries scoped with `vendor_id = $1` from `req.vendorId`
  - `UNIQUE(vendor_id, phone)` handled at DB level — catch `23505` error code and return `409 CUSTOMER_PHONE_EXISTS`
  - Soft delete: `SET deleted_at = NOW()` — orders remain linked

- [ ] **4.2 — Phone Lookup**
  ```js
  // GET /customers/lookup?phone=01XXXXXXXXX
  const { phone } = req.query;
  // Validate EGY format first
  const sql = `
    SELECT c.*,
      (SELECT json_agg(o ORDER BY o.created_at DESC)
       FROM orders o WHERE o.customer_id = c.id LIMIT 5) AS last_orders
    FROM customers c
    WHERE c.vendor_id = $1 AND c.phone = $2 AND c.deleted_at IS NULL`;
  ```

- [ ] **4.3 — findOrCreate (called from Order Service)**
  ```js
  // customers.service.js — exported and called internally
  const findOrCreate = async (vendorId, { name, phone }) => {
    const { rows } = await db.query(
      `SELECT * FROM customers WHERE vendor_id=$1 AND phone=$2 AND deleted_at IS NULL`, [vendorId, phone]
    );
    if (rows[0]) return rows[0];
    const { rows: newRows } = await db.query(
      `INSERT INTO customers (vendor_id, name, phone) VALUES ($1,$2,$3) RETURNING *`, [vendorId, name, phone]
    );
    return newRows[0];
  };
  ```

---

### SPRINT 5 — Order Module (Week 5–6)

**Goal:** Full order lifecycle — storefront + manual + state machine + COD.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/storefront/:slug/orders` | `[PUBLIC]` | Customer places storefront order |
| `GET` | `/api/v1/orders` | `JWT` | List orders with filters |
| `POST` | `/api/v1/orders` | `JWT` | Manual order entry by seller |
| `GET` | `/api/v1/orders/pending-cod` | `JWT` | Orders in Pending COD Collection |
| `GET` | `/api/v1/orders/:id` | `JWT` | Order detail + status history |
| `PATCH` | `/api/v1/orders/:id/status` | `JWT` | Advance order status |
| `PATCH` | `/api/v1/orders/:id/cod-confirm` | `JWT` | COD cash collection confirmation |
| `PATCH` | `/api/v1/orders/:id/notes` | `JWT` | Update notes |

> ⚠️ **Router order:** `GET /orders/pending-cod` MUST be before `GET /orders/:id`.

#### Tasks

- [ ] **5.1 — Joi Schemas (`orders/orders.schema.js`)**
  ```js
  const Joi = require('joi');
  const EGY_PHONE = /^(\+20|0020|0)?1[0-2,5][0-9]{8}$/;

  exports.storefrontOrder = Joi.object({
    customer_name:          Joi.string().min(2).required(),
    customer_phone:         Joi.string().pattern(EGY_PHONE).required(),
    delivery_address:       Joi.string().min(5).required(),
    delivery_governorate:   Joi.string().required(),
    delivery_promise:       Joi.string().max(100),
    privacy_consent:        Joi.boolean().valid(true).required()
                            .messages({ 'any.only': 'Privacy consent is required' }),
    items: Joi.array().items(Joi.object({
      product_id:  Joi.string().uuid().required(),
      variant_id:  Joi.string().uuid(),
      quantity:    Joi.number().integer().min(1).required(),
    })).min(1).required(),
  });
  ```

- [ ] **5.2 — State Machine (`orders/stateMachine.js`)**
  ```js
  const TRANSITIONS = {
    pending:                ['confirmed', 'cancelled'],
    confirmed:              ['preparing', 'cancelled'],
    preparing:              ['out_for_delivery'],
    out_for_delivery:       ['delivered', 'cancelled'],
    delivered:              [],
    cancelled:              [],
    pending_cod_collection: ['delivered'],
  };

  const advance = (current, next) => {
    if (!TRANSITIONS[current]?.includes(next))
      throw new AppError(`Cannot move from ${current} to ${next}`, 422, 'ORDER_STATUS_INVALID');
  };
  module.exports = { advance };
  ```

- [ ] **5.3 — `POST /storefront/:slug/orders` (Public)**
  ```js
  // 1. Resolve vendor_id from slug
  const { rows: [vendor] } = await db.query(
    `SELECT id, plan_id, last_order_number FROM vendors WHERE store_slug=$1 AND is_active=true`, [slug]
  );
  if (!vendor) throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');

  // 2. Idempotency check (if header present)
  const idempKey = req.headers['idempotency-key'];

  // 3. Plan monthly order limit check

  // 4. Validate & snapshot each item
  //    SELECT from products WHERE id=ANY($1) AND vendor_id=$2 AND is_active=true
  //    Reject if any product not found (prevents cross-vendor product injection)

  // 5. Get delivery fee from delivery_zones WHERE vendor_id=$1 AND governorate=$2

  // 6. Atomic order number increment (in transaction)
  //    UPDATE vendors SET last_order_number = last_order_number + 1 WHERE id=$1 RETURNING last_order_number

  // 7. findOrCreate customer by phone

  // 8. INSERT order — all in same transaction as step 6

  // 9. Return { order_number, total, status: 'pending' }
  ```

- [ ] **5.4 — Status Advance Handler**
  ```js
  // PATCH /orders/:id/status — body: { status, note }
  const { rows: [order] } = await db.query(
    `SELECT status FROM orders WHERE id=$1 AND vendor_id=$2`, [req.params.id, req.vendorId]
  );
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  stateMachine.advance(order.status, req.body.status);

  const entry = { status: req.body.status, changed_by: req.vendorId,
                  timestamp: new Date().toISOString(), note: req.body.note || null };

  await db.query(
    `UPDATE orders SET status=$1, status_history = status_history || $2::jsonb, updated_at=NOW()
     WHERE id=$3 AND vendor_id=$4`,
    [req.body.status, JSON.stringify(entry), req.params.id, req.vendorId]
  );
  ```

- [ ] **5.5 — COD Confirmation**
  ```js
  // PATCH /orders/:id/cod-confirm — body: { collected: boolean }
  const newStatus = req.body.collected ? 'delivered' : 'pending_cod_collection';
  await db.query(
    `UPDATE orders SET status=$1, cod_collected=$2, updated_at=NOW() WHERE id=$3 AND vendor_id=$4`,
    [newStatus, req.body.collected, req.params.id, req.vendorId]
  );
  ```

- [ ] **5.6 — Dynamic Filter Query Builder**
  ```js
  // GET /orders?status=pending&from=2024-01-01&to=2024-01-31&page=1&limit=20
  const conditions = ['vendor_id = $1'];
  const params = [req.vendorId];
  let idx = 2;
  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (from)   { conditions.push(`created_at >= $${idx++}`); params.push(from); }
  if (to)     { conditions.push(`created_at <= $${idx++}`); params.push(to); }
  const offset = (page - 1) * limit;
  params.push(limit, offset);
  const sql = `SELECT * FROM orders WHERE ${conditions.join(' AND ')}
               ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  ```

---

### SPRINT 6 — Delivery Zones Module (Week 7)

**Goal:** 27-governorate matrix with per-vendor pricing.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/delivery-zones` | `JWT` | Vendor's zone matrix |
| `PATCH` | `/api/v1/delivery-zones/:governorate` | `JWT` | Update single zone |
| `PUT` | `/api/v1/delivery-zones/bulk` | `JWT` | Bulk update all zones |
| `GET` | `/api/v1/storefront/:slug/delivery-fee` | `[PUBLIC]` | Fee lookup for a governorate |

#### Tasks

- [ ] **6.1 — Governorate Seed (all 27, Arabic names)**
  ```js
  const GOVERNORATES = [
    'القاهرة','الجيزة','الإسكندرية','الدقهلية','البحر الأحمر',
    'البحيرة','الفيوم','الغربية','الإسماعيلية','المنوفية',
    'المنيا','القليوبية','الوادي الجديد','السويس','أسوان',
    'أسيوط','بني سويف','بورسعيد','دمياط','الشرقية',
    'جنوب سيناء','كفر الشيخ','مطروح','الأقصر','قنا',
    'شمال سيناء','سوهاج'
  ];
  // On vendor registration: batch INSERT using VALUES ($1,$2), ($3,$4)...
  ```

- [ ] **6.2 — Bulk Update (UPSERT)**
  ```sql
  INSERT INTO delivery_zones (vendor_id, governorate, fee, free_delivery_threshold, is_active)
  VALUES ($1,$2,$3,$4,$5)
  ON CONFLICT (vendor_id, governorate)
  DO UPDATE SET fee=EXCLUDED.fee, free_delivery_threshold=EXCLUDED.free_delivery_threshold,
                is_active=EXCLUDED.is_active, updated_at=NOW()
  ```

- [ ] **6.3 — Public Fee Lookup (Redis 5-min cache)**
  ```js
  const cacheKey = `delivery:${slug}:${governorate}`;
  // Invalidate on PATCH/PUT delivery-zones: await redis.keys(`delivery:${slug}:*`) → redis.del(...keys)
  ```

---

### SPRINT 7 — Analytics Module (Week 8)

**Goal:** Revenue and order analytics.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/analytics/summary` | `JWT` | Revenue + orders by period |
| `GET` | `/api/v1/analytics/orders-by-day` | `JWT` | Daily breakdown for chart |

#### Tasks

- [ ] **7.1 — Summary with period filter**
  ```js
  const periodSQL = { today: `DATE_TRUNC('day',NOW())`, week: `DATE_TRUNC('week',NOW())`, month: `DATE_TRUNC('month',NOW())` };
  const sql = `
    SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS total_orders,
           COUNT(*) FILTER (WHERE status='delivered') AS delivered,
           COUNT(*) FILTER (WHERE status='pending') AS pending,
           COUNT(*) FILTER (WHERE status='cancelled') AS cancelled
    FROM orders WHERE vendor_id=$1 AND created_at >= ${periodSQL[period]}`;
  ```

- [ ] **7.2 — Orders-by-Day**
  ```sql
  SELECT DATE(created_at) AS date, COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='delivered') AS delivered,
         COUNT(*) FILTER (WHERE status='cancelled') AS cancelled
  FROM orders
  WHERE vendor_id=$1 AND created_at BETWEEN $2 AND $3
  GROUP BY DATE(created_at) ORDER BY date ASC
  ```

- [ ] **7.3 — Composite index (migration)**
  ```sql
  CREATE INDEX idx_orders_analytics ON orders(vendor_id, created_at DESC, status);
  ```

---

### SPRINT 8 — Storefront Meta & PWA (Week 9)

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/storefront/:slug` | `[PUBLIC]` | Store info |
| `GET` | `/api/v1/storefront/:slug/manifest.json` | `[PUBLIC]` | Dynamic PWA manifest |

#### Tasks

- [ ] **8.1 — Store Info (Redis 60s cache)**
  ```js
  // Returns: business_name_ar, business_name_en, logo_url, banner_url, settings, is_active
  // 404 if store not found or is_active = false
  ```

- [ ] **8.2 — PWA Manifest**
  ```js
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    name: vendor.business_name_ar,
    short_name: slug,
    start_url: '/',
    display: 'standalone',
    theme_color: vendor.settings?.theme_color || '#2563eb',
    background_color: '#ffffff',
    icons: [{ src: vendor.logo_url, sizes: '192x192 512x512', type: 'image/png' }]
  });
  ```

---

### SPRINT 9 — Super Admin & Billing (Week 10)

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/admin/auth/login` | `[PUBLIC]` | Admin login |
| `GET` | `/api/v1/admin/vendors` | `[ADMIN]` | List all vendors |
| `GET` | `/api/v1/admin/vendors/:id` | `[ADMIN]` | Vendor detail + metrics |
| `PATCH` | `/api/v1/admin/vendors/:id/plan` | `[ADMIN]` | Activate/change subscription |
| `POST` | `/api/v1/admin/plans` | `[ADMIN]` | Create a plan |

#### Tasks

- [ ] **9.1 — Admin Auth Middleware (`middleware/adminAuth.js`)**
  - Admin JWT signed with `ADMIN_JWT_SECRET` (symmetric HS256 is fine here — internal only)
  - Admin users stored in separate `admin_users` table
  - Separate login endpoint — never share with vendor auth flow

- [ ] **9.2 — Plan Guard Middleware (`middleware/planGuard.js`)**
  ```js
  // Applied on all vendor write routes
  module.exports = asyncHandler(async (req, res, next) => {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next(); // reads always allowed
    const { rows: [vendor] } = await db.query(
      `SELECT plan_id, trial_ends_at FROM vendors WHERE id=$1`, [req.vendorId]
    );
    const trialExpired = vendor.trial_ends_at < new Date() && !vendor.plan_id;
    if (trialExpired) throw new AppError('Trial expired', 402, 'TRIAL_EXPIRED');
    next();
  });
  ```

- [ ] **9.3 — Trial Expiry BullMQ Cron**
  ```js
  // Runs daily via BullMQ repeatable job
  // SELECT id FROM vendors WHERE trial_ends_at < NOW() AND plan_id IS NULL AND is_active = true
  // UPDATE SET is_active = false WHERE id = ANY($1)
  ```

---

### SPRINT 10 — Testing, Security & Launch Prep (Week 10)

#### Tasks

- [ ] **10.1 — Jest + Supertest Test Suite**
  ```js
  // __tests__/tenant-isolation.test.js
  // Setup: create vendorA and vendorB, get their JWTs
  // Test 1: GET /api/v1/products/:vendorBProductId with vendorA token → expect 403 or 404
  // Test 2: GET /api/v1/orders/:vendorBOrderId with vendorA token → expect 403 or 404
  // Test 3: POST /api/v1/orders with vendor_id: vendorB in body → order stored under vendorA
  // Test 4: PATCH /api/v1/products/:vendorBProductId/toggle with vendorA → 403 or 404
  ```

- [ ] **10.2 — k6 Load Test Script**
  ```js
  // Scenario: 1000 VUs hitting GET /storefront/:slug/products
  // Target: p95 < 300ms, 0% error rate
  ```

- [ ] **10.3 — Security Hardening**
  - `helmet()` CSP: block inline scripts on storefront
  - `express.json({ limit: '1mb' })` — prevents DoS via oversized payloads
  - All SQL: parameterized `$1,$2` only — zero string interpolation in queries
  - `bcrypt.compare` for all token comparisons — never `===`
  - No `X-Powered-By: Express` header (helmet removes it automatically)

- [ ] **10.4 — PDPL Compliance Audit**
  - Confirm all PII (name, phone, address) stored on me-south-1 (Bahrain) or Egypt servers
  - `privacy_consent: true` validated in Joi schema + checked in order service layer (double validation)
  - Privacy policy URL accessible from storefront footer

---

## PHASE 2 — Growth (Months 3–6)

### SPRINT 11 — InstaPay & Pay Later

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/orders/:id/instapay` | `JWT` | Submit InstaPay reference |
| `PATCH` | `/api/v1/orders/:id/instapay/confirm` | `JWT` | Confirm or reject payment |
| `GET` | `/api/v1/customers/:id/credit` | `JWT` | Customer credit balance |
| `POST` | `/api/v1/customers/:id/credit/payment` | `JWT` | Record manual payment |

#### DB Migration

```sql
-- db/migrations/002_instapay_credit.sql
ALTER TABLE orders ADD COLUMN instapay_reference VARCHAR(100);
ALTER TABLE orders ADD COLUMN instapay_status VARCHAR(50)
  CHECK (instapay_status IN ('pending_review','confirmed','rejected'));
ALTER TABLE customers ADD COLUMN credit_balance NUMERIC(10,2) DEFAULT 0;
```

---

### SPRINT 12 — Staff & Driver Accounts

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/staff` | `JWT` | List staff |
| `POST` | `/api/v1/staff` | `JWT` | Create staff member |
| `PATCH` | `/api/v1/staff/:id/permissions` | `JWT` | Update role/permissions |
| `DELETE` | `/api/v1/staff/:id` | `JWT` | Remove staff |
| `POST` | `/api/v1/staff/auth/login` | `[PUBLIC]` | Staff login (separate from vendor) |
| `GET` | `/api/v1/driver/orders` | `JWT:driver` | Driver's assigned orders |
| `PATCH` | `/api/v1/driver/orders/:id/delivered` | `JWT:driver` | Mark delivered |
| `POST` | `/api/v1/admin/drivers/:id/verify` | `[ADMIN]` | Approve driver |

#### DB Migration

```sql
-- db/migrations/003_staff.sql
CREATE TABLE staff_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name              VARCHAR(200) NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(20),
  role              VARCHAR(50) NOT NULL CHECK (role IN ('manager','staff','driver')),
  permissions       JSONB DEFAULT '{}',
  verification_docs JSONB,
  is_verified       BOOLEAN DEFAULT false,
  password_hash     VARCHAR(255),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staff_vendor ON staff_members(vendor_id);
```

**Note:** Staff JWT payload: `{ staff_id, vendor_id, role, permissions }` — `tenantMiddleware` still works identically, `vendor_id` from JWT claims scopes everything.

---

### SPRINT 13 — RFQ Module

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/storefront/:slug/rfq` | `[PUBLIC]` | Customer submits RFQ |
| `GET` | `/api/v1/rfq` | `JWT` | List vendor RFQs |
| `POST` | `/api/v1/rfq` | `JWT` | Seller creates manual RFQ |
| `GET` | `/api/v1/rfq/:id` | `JWT` | RFQ detail + quote thread |
| `POST` | `/api/v1/rfq/:id/quote` | `JWT` | Seller sends quote |
| `PATCH` | `/api/v1/rfq/:id/respond` | `[PUBLIC+token]` | Customer: accept/negotiate/reject |
| `POST` | `/api/v1/rfq/:id/convert` | `JWT` | Convert accepted RFQ → Order |

#### DB Migration

```sql
-- db/migrations/004_rfq.sql
CREATE TABLE rfqs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id                UUID NOT NULL REFERENCES vendors(id),
  customer_id              UUID REFERENCES customers(id),
  customer_name            VARCHAR(200),
  customer_phone           VARCHAR(20),
  description              TEXT NOT NULL,
  quantity                 INT,
  budget_egp               NUMERIC(10,2),
  status                   VARCHAR(50) DEFAULT 'submitted'
    CHECK (status IN ('submitted','quoted','negotiating','accepted','converted','rejected')),
  quote_thread             JSONB DEFAULT '[]',
  converted_order_id       UUID REFERENCES orders(id),
  customer_token           VARCHAR(100) UNIQUE,
  customer_token_expires_at TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rfq_vendor ON rfqs(vendor_id);
CREATE INDEX idx_rfq_token  ON rfqs(customer_token);
```

#### Token Pattern for Customer Response
```js
// When seller sends quote → generate token for customer response link
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);  // 7 days
// Customer link: yourapp.com/[slug]/rfq?token=[token]
// PATCH /rfq/:id/respond?token=X → verify token + expiry, no JWT needed
```

---

### SPRINT 14 — Enhanced Analytics & Notifications

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/analytics/best-sellers` | `JWT` | Top products by revenue/count |
| `GET` | `/api/v1/analytics/cod-report` | `JWT` | Uncollected COD daily report |
| `GET` | `/api/v1/analytics/customers` | `JWT` | New vs returning customer rate |

#### WhatsApp Notification Worker
```js
// workers/notification.worker.js — separate Node process
const { Worker } = require('bullmq');
const redis = require('../config/redis');
const worker = new Worker('notifications', async (job) => {
  if (job.name === 'whatsapp_order_status') {
    const { phone, templateName, params } = job.data;
    // POST to Meta WhatsApp Business API (after Meta verification)
  }
}, { connection: redis });
```

---

## PHASE 3 — Scale (Months 6–18)

### SPRINT 15+ — Online Payments, Bosta, Batching

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/payments/paymob/initiate` | `JWT` | Create Paymob payment intent |
| `POST` | `/api/v1/webhooks/paymob` | `[PUBLIC+HMAC]` | Paymob payment webhook |
| `POST` | `/api/v1/orders/:id/fawry` | `JWT` | Generate Fawry reference |
| `POST` | `/api/v1/webhooks/fawry` | `[PUBLIC+HMAC]` | Fawry payment webhook |
| `POST` | `/api/v1/shipments/bosta` | `JWT` | Create Bosta shipment |
| `GET` | `/api/v1/shipments/bosta/rates` | `JWT` | Rate by governorate |
| `POST` | `/api/v1/batches` | `JWT` | Create delivery batch |
| `GET` | `/api/v1/batches` | `JWT` | List batches |
| `PATCH` | `/api/v1/batches/:id/assign` | `JWT` | Assign orders + driver |
| `GET` | `/api/v1/analytics/heatmap` | `JWT` | Order density by governorate |
| `GET` | `/api/v1/analytics/export` | `JWT` | Export CSV |

#### Webhook HMAC Verification Pattern
```js
// CRITICAL: webhooks need raw body — mount BEFORE express.json()
// app.js:
app.post('/api/v1/webhooks/paymob', express.raw({ type: '*/*' }), asyncHandler(async (req, res) => {
  const sig = req.headers['hmac'];
  const hash = crypto.createHmac('sha512', PAYMOB_HMAC_SECRET).update(req.body).digest('hex');
  if (sig !== hash) return res.status(401).json({ error: 'Invalid signature' });
  // Process payment confirmation...
}));
```

---

## Express-Specific Gotchas

| Issue | Solution |
|-------|---------|
| Route order conflicts | Register `/orders/pending-cod`, `/customers/lookup`, `/products/upload-image` BEFORE `/:id` param routes in the same router |
| Async errors silently swallowed | Wrap ALL async route handlers with `asyncHandler()` — without it, unhandled promise rejections bypass `errorHandler` |
| errorHandler not triggering | Must have exactly 4 params: `(err, req, res, next)` — Express detects error handlers by arity |
| Webhook raw body lost | Mount webhook routes with `express.raw()` BEFORE the global `express.json()` — or use `verify` callback on `express.json` |
| CORS + credentials broken | `origin: '*'` blocks cookies — set `origin` to explicit frontend URL + `credentials: true` |
| Cookie not sent on subdomain | Use `sameSite: 'lax'` (not `'strict'`) if storefront and API are on different subdomains |
| pg pool exhaustion | Default `max: 10` is low for concurrent requests — set `max: 20` and monitor with `pool.totalCount` |
| Redis BullMQ connection sharing | BullMQ requires its own dedicated ioredis connection — do NOT reuse the general `redis` client |
| Missing `await` on db.query | No TypeORM here — every DB call is async; forgetting `await` causes silent undefined returns |

---

## Error Code Reference

| Code | HTTP | Description |
|------|------|-------------|
| `ORDER_STATUS_INVALID` | 422 | Attempted invalid state transition |
| `PLAN_PRODUCT_LIMIT` | 402 | Starter plan product cap reached |
| `PLAN_ORDER_LIMIT` | 402 | Starter plan order cap reached |
| `TRIAL_EXPIRED` | 402 | Trial period ended, no active plan |
| `TENANT_FORBIDDEN` | 403 | Cross-tenant access attempted |
| `SLUG_TAKEN` | 409 | Store slug already in use |
| `SLUG_RESERVED` | 409 | Store slug is a reserved word |
| `PHONE_INVALID` | 422 | Egyptian phone number format invalid |
| `CONSENT_REQUIRED` | 422 | Privacy consent not checked |
| `IMAGE_TOO_LARGE` | 413 | Image exceeds 5MB |
| `IMAGE_TYPE_INVALID` | 415 | Unsupported image format |
| `RFQ_ALREADY_CONVERTED` | 409 | RFQ already converted to order |
| `STORE_NOT_FOUND` | 404 | No active store with this slug |
| `RATE_LIMITED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 422 | Joi schema validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid/expired JWT |
| `CUSTOMER_PHONE_EXISTS` | 409 | Phone already linked to another customer |

---

## Security Checklist (Pre-Launch)

- [ ] `tenantMiddleware` applied on ALL vendor routes — verified with cross-tenant pen tests in Jest
- [ ] ALL SQL uses parameterized `$1,$2` — zero string interpolation in queries
- [ ] Auth endpoints rate limited (5/min per IP via `authLimiter`)
- [ ] RS256 signing — private key in env, never committed to git
- [ ] Refresh tokens: hashed with bcrypt before DB storage, delivered via `httpOnly` cookie
- [ ] `helmet()` applied — removes `X-Powered-By`, adds CSP, HSTS, etc.
- [ ] File uploads: MIME type validated by multer `fileFilter` + file size limit enforced before Sharp processing
- [ ] Webhook routes use `express.raw()` + HMAC signature verification before any processing
- [ ] No raw card numbers stored — PCI delegated to Paymob/Accept (Phase 3)
- [ ] PDPL: all PII stored in me-south-1 (Bahrain) or Egypt-based servers
- [ ] `privacy_consent` validated in Joi schema AND rechecked in order service (belt and suspenders)
- [ ] Admin JWT guard uses separate secret — vendor tokens cannot reach admin routes
- [ ] `pg` pool connection limit set + monitored — no connection exhaustion under load

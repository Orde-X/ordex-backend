# Backend Development Sprints
## Local Commerce Management SaaS — Egypt
### NestJS + PostgreSQL + Redis + Cloudflare R2

> **Stack:** NestJS (Node.js), PostgreSQL (TypeORM), Redis (BullMQ), Cloudflare R2, JWT (RS256)
> **Base URL:** `/api/v1`
> **All routes require `vendor_id` scoping via TenantInterceptor unless marked `[PUBLIC]` or `[ADMIN]`**

---

## PHASE 1 — MVP (Weeks 1–10)

---

### SPRINT 1 — Project Foundation & DevOps (Week 1)

**Goal:** Runnable project skeleton with CI/CD, DB, and env config.

#### Tasks

- [ ] **1.1 — NestJS Project Bootstrap**
  - Init NestJS monorepo with `@nestjs/cli`
  - Configure TypeScript strict mode
  - Set up ESLint + Prettier + Husky pre-commit hooks
  - Configure module aliases

- [ ] **1.2 — Database Setup**
  - PostgreSQL connection via TypeORM
  - Configure `synchronize: false` (migrations only in production)
  - Set up migration runner script
  - Create base entity with `id` (UUID), `created_at`, `updated_at`, `vendor_id`

- [ ] **1.3 — Redis Setup**
  - Redis connection for BullMQ and caching
  - Configure `ioredis` adapter
  - BullMQ queue module setup

- [ ] **1.4 — Environment & Config Module**
  - `@nestjs/config` with Joi validation schema
  - Environments: `development`, `staging`, `production`
  - Secrets: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `R2_*`

- [ ] **1.5 — CI/CD Pipeline**
  - GitHub Actions: lint → test → build on PR
  - Docker `Dockerfile` + `docker-compose.yml` for local dev
  - Auto-deploy to staging on `main` merge

- [ ] **1.6 — Global Middleware**
  - Helmet (security headers)
  - CORS configuration (storefront + dashboard origins)
  - Request logging (Pino)
  - Global validation pipe (`class-validator`, `class-transformer`)
  - Standard response envelope: `{ data, meta, error }`

- [ ] **1.7 — Database Schema — Initial Migration**

  ```sql
  -- Core tables for MVP
  CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name_ar VARCHAR(200) NOT NULL,
    business_name_en VARCHAR(200),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    store_slug VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    settings JSONB DEFAULT '{}',
    plan_id UUID,
    trial_ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    name_ar VARCHAR(300) NOT NULL,
    name_en VARCHAR(300),
    description_ar TEXT,
    description_en TEXT,
    product_type VARCHAR(20) NOT NULL DEFAULT 'standard',
    base_price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    images JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '[]',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    combination JSONB NOT NULL,
    price_override NUMERIC(10,2),
    stock INT,
    sku VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    addresses JSONB DEFAULT '[]',
    notes TEXT,
    source VARCHAR(50),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, phone)
  );

  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    order_number INT NOT NULL,
    customer_id UUID REFERENCES customers(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    items JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cod',
    delivery_governorate VARCHAR(100),
    delivery_address TEXT,
    delivery_promise TEXT,
    cod_collected BOOLEAN,
    status_history JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, order_number)
  );

  CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    governorate VARCHAR(100) NOT NULL,
    fee NUMERIC(10,2) DEFAULT 0,
    free_delivery_threshold NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, governorate)
  );

  CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    price_egp NUMERIC(10,2),
    product_limit INT,
    order_limit_monthly INT,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX idx_products_vendor ON products(vendor_id);
  CREATE INDEX idx_orders_vendor ON orders(vendor_id);
  CREATE INDEX idx_orders_status ON orders(vendor_id, status);
  CREATE INDEX idx_customers_vendor_phone ON customers(vendor_id, phone);
  CREATE INDEX idx_delivery_zones_vendor ON delivery_zones(vendor_id);
  ```

---

### SPRINT 2 — Authentication Module (Week 2)

**Goal:** Full vendor auth with JWT, tenant isolation interceptor.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/auth/register` | `[PUBLIC]` | Vendor registration |
| `POST` | `/api/v1/auth/login` | `[PUBLIC]` | Login → access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | `[PUBLIC]` | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | `JWT` | Invalidate session |
| `GET` | `/api/v1/auth/me` | `JWT` | Get current vendor profile |
| `PATCH` | `/api/v1/auth/profile` | `JWT` | Update store profile |

#### Tasks

- [ ] **2.1 — JWT Strategy**
  - Generate RS256 key pair, store private in env
  - `JwtAccessStrategy` (15min), `JwtRefreshStrategy` (30 days)
  - Refresh token stored in `httpOnly` cookie, hashed in DB

- [ ] **2.2 — `POST /auth/register`**
  - DTO: `business_name_ar` (required), `business_name_en`, `email`, `phone` (regex EGY), `password` (min 8), `store_slug`
  - Validate slug: lowercase alphanumeric + hyphens, 3–50 chars, unique, not reserved (`admin`, `api`, `www`, `support`, `login`, `store`, `auth`)
  - Hash password with bcrypt (cost 12)
  - Seed 27 delivery zones for new vendor (from master list)
  - Return vendor + access token

- [ ] **2.3 — `POST /auth/login`**
  - Email + password validation
  - Return access token in body, refresh token in `httpOnly` cookie

- [ ] **2.4 — `POST /auth/refresh`**
  - Read refresh token from cookie
  - Validate against hashed value in DB
  - Rotate: invalidate old, issue new pair

- [ ] **2.5 — TenantInterceptor (CRITICAL)**
  - Global NestJS interceptor applied to all routes
  - Extracts `vendor_id` from JWT claims
  - Attaches to `request.vendorId`
  - Throws HTTP 403 if missing or JWT vendor_id !== resource vendor_id
  - Write cross-tenant penetration test suite

- [ ] **2.6 — Rate Limiting**
  - Auth endpoints: 5 requests/min per IP (ThrottlerGuard)
  - General API: 300 requests/min per vendor

- [ ] **2.7 — `PATCH /auth/profile`**
  - Update: logo, banner, business names, working hours, settings JSONB

---

### SPRINT 3 — Product Module (Week 3)

**Goal:** Full product CRUD with variants, custom fields, image upload.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/products` | `JWT` | List vendor products (paginated) |
| `POST` | `/api/v1/products` | `JWT` | Create product |
| `GET` | `/api/v1/products/:id` | `JWT` | Get product detail |
| `PATCH` | `/api/v1/products/:id` | `JWT` | Update product |
| `DELETE` | `/api/v1/products/:id` | `JWT` | Soft delete product |
| `PATCH` | `/api/v1/products/:id/toggle` | `JWT` | Toggle active/inactive |
| `POST` | `/api/v1/products/:id/variants` | `JWT` | Create/replace variant matrix |
| `GET` | `/api/v1/products/:id/variants` | `JWT` | List variants |
| `POST` | `/api/v1/products/upload-image` | `JWT` | Upload image → R2 CDN URL |
| `GET` | `/api/v1/storefront/:slug/products` | `[PUBLIC]` | Public product listing for storefront |
| `GET` | `/api/v1/storefront/:slug/products/:id` | `[PUBLIC]` | Public product detail |

#### Tasks

- [ ] **3.1 — Product CRUD**
  - `vendor_id` injected from JWT on all writes
  - Plan limit check: Starter → reject at 31st product with HTTP 402
  - Bilingual fields: `name_ar` required, others optional

- [ ] **3.2 — Variant Builder**
  - Accept variant matrix as array: `[{ combination: { size: "L", color: "Red" }, price_override: 150, stock: 20 }]`
  - Upsert variants: delete removed combinations, insert/update rest
  - No cap on variant count

- [ ] **3.3 — Custom Fields**
  - JSONB schema: `[{ key, label_ar, label_en, type: text|number|select|multiselect|image, options: [], required: bool }]`
  - Validate field types on save

- [ ] **3.4 — Image Upload Service**
  - `POST /products/upload-image` → multipart
  - Validate MIME type (JPEG/PNG/WebP only), max 5MB
  - Resize to max 800px width (Sharp library)
  - Convert to WebP
  - Upload to Cloudflare R2 with vendor-scoped path
  - Return CDN URL

- [ ] **3.5 — Storefront Public Routes**
  - `GET /storefront/:slug/products` — no auth, cached (Redis 60s)
  - Include active variants and first image per product
  - Filter: `is_active = true`

---

### SPRINT 4 — Customer CRM Module (Week 4)

**Goal:** Guest customer profiles with auto-linking.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/customers` | `JWT` | List customers (search by name/phone) |
| `POST` | `/api/v1/customers` | `JWT` | Create guest customer profile |
| `GET` | `/api/v1/customers/:id` | `JWT` | Customer detail + order history |
| `PATCH` | `/api/v1/customers/:id` | `JWT` | Update customer profile |
| `DELETE` | `/api/v1/customers/:id` | `JWT` | Soft delete (sets deleted_at) |
| `GET` | `/api/v1/customers/lookup` | `JWT` | Lookup by phone number (for order form) |

#### Tasks

- [ ] **4.1 — Customer CRUD**
  - Unique constraint: `(vendor_id, phone)` — same phone = same customer per vendor
  - Soft delete: set `deleted_at`, never remove order links

- [ ] **4.2 — Auto-Profile Creation**
  - When order placed with a new phone number: auto-create guest profile
  - When order placed with existing phone: link to existing customer

- [ ] **4.3 — Phone Lookup Endpoint**
  - `GET /customers/lookup?phone=01XXXXXXXXX`
  - Used by dashboard manual order form to find existing customer
  - Returns profile + last 5 orders

- [ ] **4.4 — Customer Order History**
  - `GET /customers/:id` includes paginated orders list
  - Sorted by `created_at DESC`

---

### SPRINT 5 — Order Module (Week 5–6)

**Goal:** Full order lifecycle: storefront placement + manual entry + state machine + COD.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/storefront/:slug/orders` | `[PUBLIC]` | Customer places order from storefront |
| `GET` | `/api/v1/orders` | `JWT` | List orders (filter: status, date) |
| `POST` | `/api/v1/orders` | `JWT` | Manual order entry by seller |
| `GET` | `/api/v1/orders/:id` | `JWT` | Order detail with full status history |
| `PATCH` | `/api/v1/orders/:id/status` | `JWT` | Advance order status |
| `PATCH` | `/api/v1/orders/:id/cod-confirm` | `JWT` | Confirm/deny COD cash collection |
| `PATCH` | `/api/v1/orders/:id/notes` | `JWT` | Update order notes |
| `GET` | `/api/v1/orders/pending-cod` | `JWT` | List orders in Pending COD Collection |

#### Tasks

- [ ] **5.1 — `POST /storefront/:slug/orders` (Public)**
  - Resolve `vendor_id` from slug
  - DTO: `customer_name`, `customer_phone` (EGY regex), `delivery_address`, `delivery_governorate`, `items[]`, `delivery_promise`, `privacy_consent` (must be `true` — reject if false)
  - Apply delivery fee from vendor's zone matrix for selected governorate
  - Calculate subtotal + total
  - Generate sequential `order_number` (per-vendor atomic increment)
  - Create/link customer profile by phone
  - Snapshot product name + price at time of order
  - Idempotency-Key header support

- [ ] **5.2 — `POST /orders` (Manual Entry)**
  - Same logic as storefront but seller-initiated
  - Additional: `price_override` per item, seller notes
  - Customer lookup by phone first; create if not found

- [ ] **5.3 — State Machine Enforcement**
  - Valid transitions only:
    - `pending → confirmed`
    - `confirmed → preparing`
    - `preparing → out_for_delivery`
    - `out_for_delivery → delivered`
    - `out_for_delivery → cancelled`
    - `pending → cancelled`
    - `confirmed → cancelled`
  - Every transition: append `{status, changed_by: vendor_id, timestamp, note}` to `status_history` JSONB
  - Reject invalid transitions with HTTP 422 + `errorCode: ORDER_STATUS_INVALID`

- [ ] **5.4 — COD Confirmation**
  - `PATCH /orders/:id/cod-confirm` with body `{ collected: boolean }`
  - If `collected: false` → status becomes `pending_cod_collection`
  - If `collected: true` → status stays `delivered`, set `cod_collected: true`

- [ ] **5.5 — Plan Limit Enforcement**
  - Starter plan: count orders this calendar month
  - At 120: insert warning in response meta
  - At 150: return HTTP 402 on new order creation, dashboard upgrade banner

- [ ] **5.6 — Order Listing & Filters**
  - `GET /orders?status=pending&from=2024-01-01&to=2024-01-31&customer_id=&page=1&limit=20`
  - Default sort: `created_at DESC`

---

### SPRINT 6 — Delivery Zones & Egypt Module (Week 7)

**Goal:** 27-governorate zone matrix with per-vendor pricing.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/delivery-zones` | `JWT` | Get vendor's zone matrix |
| `PATCH` | `/api/v1/delivery-zones/:governorate` | `JWT` | Update fee for a specific governorate |
| `PUT` | `/api/v1/delivery-zones/bulk` | `JWT` | Bulk update all zones at once |
| `GET` | `/api/v1/storefront/:slug/delivery-fee` | `[PUBLIC]` | Get delivery fee for a governorate |

#### Tasks

- [ ] **6.1 — Master Governorate Seed**
  - Seed script with all 27 Egyptian governorates
  - On vendor registration: auto-create 27 zone rows with `fee: 0, is_active: true`

- [ ] **6.2 — Zone Management**
  - Vendor sets `fee` and optional `free_delivery_threshold` per governorate
  - Toggle zone active/inactive (inactive = not delivered there)

- [ ] **6.3 — Public Fee Lookup**
  - `GET /storefront/:slug/delivery-fee?governorate=Cairo`
  - Used by storefront to show delivery cost dynamically as customer selects governorate
  - Cached in Redis (5 min TTL)

---

### SPRINT 7 — Analytics Module (Week 8)

**Goal:** Basic revenue and order analytics for dashboard.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/analytics/summary` | `JWT` | Revenue + order count summary |
| `GET` | `/api/v1/analytics/orders-by-day` | `JWT` | Daily order counts with status breakdown |

#### Tasks

- [ ] **7.1 — `GET /analytics/summary`**
  - Query params: `period=today|week|month`
  - Returns: `total_revenue_egp`, `order_count`, `breakdown_by_status`
  - SQL aggregate with `WHERE vendor_id = $1 AND created_at >= $period_start`

- [ ] **7.2 — `GET /analytics/orders-by-day`**
  - Query params: `from`, `to` (max 31 days)
  - Returns: `[{ date, count, delivered, cancelled, pending }]`
  - Used to render bar chart in dashboard

- [ ] **7.3 — Query Optimization**
  - Add composite index: `(vendor_id, created_at)` on orders table
  - Target: < 3s for monthly aggregate across 10k orders (NFR-P06)

---

### SPRINT 8 — Storefront & PWA (Week 9)

**Goal:** Public storefront meta-endpoint + PWA manifest endpoint.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/storefront/:slug` | `[PUBLIC]` | Store info: name, logo, banner, settings |
| `GET` | `/api/v1/storefront/:slug/manifest.json` | `[PUBLIC]` | PWA manifest |

#### Tasks

- [ ] **8.1 — Store Resolution**
  - Lookup vendor by slug
  - Return: `business_name_ar`, `business_name_en`, `logo_url`, `banner_url`, `settings`, `is_active`
  - If inactive → HTTP 404

- [ ] **8.2 — PWA Manifest**
  - Dynamic manifest with vendor store name
  - `start_url`, `display: standalone`, `theme_color`, `icons`

- [ ] **8.3 — Redis Caching**
  - Cache store info for 60s per slug
  - Cache product listing per slug + page for 30s
  - Invalidate on product/store update

---

### SPRINT 9 — Super Admin & Billing (Week 10)

**Goal:** Internal admin panel API for subscription management.

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/admin/vendors` | `[ADMIN]` | List all vendors + plan status |
| `PATCH` | `/api/v1/admin/vendors/:id/plan` | `[ADMIN]` | Activate/change/deactivate subscription |
| `GET` | `/api/v1/admin/vendors/:id` | `[ADMIN]` | Vendor detail + metrics |
| `POST` | `/api/v1/admin/plans` | `[ADMIN]` | Create subscription plan |

#### Tasks

- [ ] **9.1 — Admin Guard**
  - Separate `AdminJwtStrategy` — only platform operators
  - Admin tokens never exposed to vendor-facing auth flows

- [ ] **9.2 — Plan Activation**
  - `PATCH /admin/vendors/:id/plan` — set `plan_id`, `trial_ends_at`, `is_active`
  - On trial expiry: cron job sets account to read-only mode

- [ ] **9.3 — Read-Only Enforcement**
  - When `trial_ends_at < NOW()` and no active plan: reject write operations (POST/PATCH/DELETE) with HTTP 402
  - GET endpoints still work

---

### SPRINT 10 — Testing, Security & Launch Prep (Week 10)

#### Tasks

- [ ] **10.1 — Cross-Tenant Penetration Tests**
  - Test: vendor A cannot access vendor B's products via `/api/v1/products/:b_product_id`
  - Test: vendor A cannot see vendor B's orders
  - Test: slug manipulation attacks
  - Test: JWT vendor_id tampering

- [ ] **10.2 — Load Testing**
  - k6 script: 1000 concurrent users hitting `/storefront/:slug/products`
  - Target: < 300ms p95

- [ ] **10.3 — Performance Validation**
  - Lighthouse audit on storefront (score > 80 mobile)
  - Slow 3G simulation: page load < 3s

- [ ] **10.4 — PDPL Compliance Audit**
  - Verify all Egyptian personal data in me-south-1 or Egypt servers
  - Privacy policy accessible from all public pages
  - Consent field validated server-side

---

## PHASE 2 — Growth (Months 3–6)

### SPRINT 11 — Payment Flows (InstaPay, Pay Later)

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/orders/:id/instapay` | `JWT` | Submit InstaPay reference |
| `PATCH` | `/api/v1/orders/:id/instapay/confirm` | `JWT` | Seller confirms/rejects payment |
| `GET` | `/api/v1/customers/:id/credit` | `JWT` | Get customer credit balance |
| `POST` | `/api/v1/customers/:id/credit/payment` | `JWT` | Record manual payment on credit |

#### DB Changes

```sql
ALTER TABLE orders ADD COLUMN instapay_reference VARCHAR(100);
ALTER TABLE orders ADD COLUMN instapay_status VARCHAR(50);
ALTER TABLE customers ADD COLUMN credit_balance NUMERIC(10,2) DEFAULT 0;
```

---

### SPRINT 12 — Staff & Driver Accounts

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/staff` | `JWT` | List staff members |
| `POST` | `/api/v1/staff` | `JWT` | Invite staff member |
| `PATCH` | `/api/v1/staff/:id/permissions` | `JWT` | Update permissions |
| `DELETE` | `/api/v1/staff/:id` | `JWT` | Remove staff |
| `GET` | `/api/v1/driver/orders` | `JWT:driver` | Driver: list assigned deliveries |
| `PATCH` | `/api/v1/driver/orders/:id/delivered` | `JWT:driver` | Driver: mark order delivered |
| `POST` | `/api/v1/admin/drivers/verify` | `[ADMIN]` | Approve driver verification |

#### DB Changes

```sql
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL, -- manager | staff | driver
  permissions JSONB DEFAULT '{}',
  verification_docs JSONB,
  is_verified BOOLEAN DEFAULT false,
  password_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### SPRINT 13 — RFQ Module

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/storefront/:slug/rfq` | `[PUBLIC]` | Customer submits RFQ |
| `GET` | `/api/v1/rfq` | `JWT` | Seller: list all RFQs |
| `GET` | `/api/v1/rfq/:id` | `JWT` | RFQ detail + quote thread |
| `POST` | `/api/v1/rfq/:id/quote` | `JWT` | Seller sends a quote |
| `PATCH` | `/api/v1/rfq/:id/respond` | `[PUBLIC+token]` | Customer: accept / negotiate / reject |
| `POST` | `/api/v1/rfq/:id/convert` | `JWT` | Convert accepted RFQ → Order |
| `POST` | `/api/v1/rfq` | `JWT` | Seller creates manual RFQ (WhatsApp negotiation) |

#### DB Changes

```sql
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(200),
  customer_phone VARCHAR(20),
  description TEXT NOT NULL,
  quantity INT,
  budget_egp NUMERIC(10,2),
  status VARCHAR(50) DEFAULT 'submitted',
  quote_thread JSONB DEFAULT '[]',
  converted_order_id UUID REFERENCES orders(id),
  customer_token VARCHAR(100), -- for customer response link
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### SPRINT 14 — Enhanced Analytics & WhatsApp Notifications

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/v1/analytics/best-sellers` | `JWT` | Top products by revenue/orders |
| `GET` | `/api/v1/analytics/cod-report` | `JWT` | Uncollected COD report |
| `GET` | `/api/v1/analytics/customers` | `JWT` | New vs returning customer rate |
| `POST` | `/api/v1/notifications/whatsapp` | `[INTERNAL]` | BullMQ worker: send WA notification |

---

## PHASE 3 — Scale (Months 6–18)

### SPRINT 15+ — Payments, Courier, Advanced Features

#### Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/payments/paymob/initiate` | `JWT` | Create Paymob payment intent |
| `POST` | `/api/v1/webhooks/paymob` | `[PUBLIC+HMAC]` | Paymob payment confirmation |
| `POST` | `/api/v1/orders/:id/fawry` | `JWT` | Generate Fawry reference |
| `POST` | `/api/v1/webhooks/fawry` | `[PUBLIC+HMAC]` | Fawry payment webhook |
| `POST` | `/api/v1/shipments/bosta` | `JWT` | Create Bosta shipment |
| `GET` | `/api/v1/shipments/bosta/rates` | `JWT` | Get Bosta rate for governorate |
| `POST` | `/api/v1/batches` | `JWT` | Create delivery batch |
| `GET` | `/api/v1/batches` | `JWT` | List batches |
| `PATCH` | `/api/v1/batches/:id/assign` | `JWT` | Assign orders to batch + driver |
| `GET` | `/api/v1/analytics/heatmap` | `JWT` | Governorate order density |
| `GET` | `/api/v1/analytics/export` | `JWT` | Export to CSV/Excel |

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
| `CONSENT_REQUIRED` | 422 | Privacy consent checkbox not checked |
| `IMAGE_TOO_LARGE` | 413 | Image exceeds 5MB limit |
| `IMAGE_TYPE_INVALID` | 415 | Unsupported image format |
| `RFQ_ALREADY_CONVERTED` | 409 | RFQ already converted to order |

---

## Security Checklist (Pre-Launch)

- [ ] TenantInterceptor applied globally — verified with pen tests
- [ ] All auth endpoints rate limited
- [ ] Refresh tokens hashed in DB, stored in httpOnly cookie
- [ ] RS256 signing — no HS256
- [ ] All inputs validated server-side with class-validator
- [ ] R2 file upload: MIME type + size validated before upload
- [ ] HTTPS enforced, HSTS enabled
- [ ] No raw card numbers stored
- [ ] PDPL: all personal data in me-south-1 or Egypt
- [ ] Privacy consent validated server-side (not just client-side)

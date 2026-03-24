# Software Requirements Specification (SRS): Local Commerce Management SaaS Platform — Egypt
## Formal Specification of Functional, Non-Functional & System Requirements

**Version:** 1.0  
**Market:** Egypt — all 27 governorates  
**Date:** 2025  
**Classification:** Confidential

---

1. Introduction

1.1 Purpose

This Software Requirements Specification (SRS) defines the complete set of functional and non-functional requirements for the Local Commerce Management SaaS platform targeting Egypt's social commerce market. This document serves as the formal contract between the product team and the development team, establishing unambiguous, testable, and traceable requirements for all system components.

1.2 Scope

The system is a multi-tenant, subscription-based web application that provides Egyptian micro and small businesses with a centralized platform to manage products, orders, customers, and deliveries. The platform replaces the chaotic WhatsApp/Instagram/Facebook DM-based commerce operations currently used by an estimated 350,000+ Egyptian sellers receiving 5–100 orders per day.

Key scope boundaries:

- **IN SCOPE:** Vendor management, product catalog, order lifecycle, customer CRM, Egypt-specific payment flows (InstaPay, Fawry, COD), 27-governorate delivery zones, analytics, Arabic/English bilingual UI.
- **IN SCOPE:** Customer-facing storefront pages at `yourapp.com/store-name` with PWA capability.
- **OUT OF SCOPE (MVP):** Native iOS/Android apps, online payment gateway (Phase 3), marketplace mode, WhatsApp Business API (Phase 2).
- **OUT OF SCOPE:** GCC market features — this specification covers Egypt-only deployment.

### 1.3 Definitions & Acronyms

| Term | Definition |
| :--- | :--- |
| **Vendor** | A registered business owner using the platform to manage their store and orders. |
| **Tenant** | Synonymous with Vendor — each vendor is an isolated tenant in the multi-tenant architecture. |
| **COD** | Cash on Delivery — the dominant Egyptian payment method for small business e-commerce. |
| **InstaPay** | Egypt's Central Bank of Egypt (CBE)-backed instant bank transfer system. |
| **Fawry** | Egypt's most widespread digital payment kiosk network. |
| **PDPL** | Egypt's Personal Data Protection Law No. 151 of 2020. |
| **PWA** | Progressive Web App — web application installable to mobile home screen without app store. |
| **Masri** | Egyptian colloquial Arabic dialect (as opposed to Modern Standard Arabic / MSA). |
| **Governorate** | Egypt's top-level administrative division — 27 total, used for delivery zone pricing. |
| **Row-Level Isolation** | Multi-tenancy approach where all tenant data shares one DB but is separated by `vendor_id` foreign keys. |
| **JWT** | JSON Web Token — stateless authentication token used for API authorization. |
| **SaaS** | Software as a Service — subscription-based cloud software delivery model. |

1.4 System Overview

The platform consists of three primary user-facing surfaces and one administrative surface:

| Surface | Technology | Description |
| :--- | :--- | :--- |
| **Seller Dashboard** | React + Vite SPA | The primary interface for vendors — managing products, orders, customers, analytics, and store settings. |
| **Customer Storefront** | Next.js SSR | Public storefront at `yourapp.com/store-name` — product browsing, order placement, PWA-capable. |
| **Backend API** | NestJS (Node.js) | RESTful API serving both frontend surfaces — multi-tenant with JWT auth and `vendor_id` scoping. |
| **Super Admin Panel** | Internal-only | Platform operator's view of all tenants, subscriptions, and support management. |

2. Overall System Description

2.1 Product Perspective

The platform operates as an independent SaaS application in the Egyptian digital commerce ecosystem. It integrates
with or operates alongside the following external systems:

| External System | Integration Role |
| :--- | :--- |
| **WhatsApp Business API** | Phase 2: automated order status notifications sent to customers via WhatsApp. |
| **InstaPay (CBE)** | Manual confirmation flow in MVP; direct API integration in Phase 2. |
| **Fawry Accept API** | Automated payment confirmation webhook — Phase 2. |
| **Bosta Courier API** | Real-time rate lookup and automated label generation for inter-governorate shipping — Phase 2. |
| **Cloudflare R2** | Object storage for product images with global CDN and Cairo PoP. |
| **Redis** | Session management, caching of store pages, rate limiting, BullMQ job queue. |
| **PostgreSQL** | Primary database — row-level multi-tenant isolation. |
| **AWS me-south-1 / Telecom Egypt Cloud** | Data residency options compliant with Egypt PDPL Law No. 151 of 2020. |

2.2 Product Functions — Summary

The platform provides the following primary functional groups:

| ID | Function Group | Description |
| :--- | :--- | :--- |
| **F1** | Authentication & Multi-Tenancy | Vendor registration, JWT auth, staff accounts, complete tenant data isolation |
| **F2** | Product Catalog Management | CRUD, dynamic variants, custom fields, bilingual content, image management |
| **F3** | Order Lifecycle Management | Creation, status transitions, manual entry, delivery promise, COD confirmation |
| **F4** | Customer CRM | Guest profiles, order history, tags, credit balances, address management |
| **F5** | Egypt Payment Flows | InstaPay confirmation, Fawry reference, COD collection tracking |
| **F6** | Delivery Management | 27-governorate zone matrix, batch planning, driver assignment |
| **F7** | Store Storefront | Public product pages, order form, bilingual, PWA, mobile-optimized |
| **F8** | Analytics | Revenue, orders, customers, best-sellers, COD report |
| **F9** | Subscription & Plans | Starter/Growth/Pro/Enterprise feature gates and billing |
| **F10** | Notifications | In-app notifications MVP; WhatsApp API Phase 2 |

2.3 User Classes

| User Class | Responsibilities & Access Level |
| :--- | :--- |
| **Vendor/Owner** | Primary user — creates and manages the full store; has all permissions. |
| **Store Manager** | Staff role — manages orders and customers; cannot edit billing or store settings. |
| **Staff Member** | Limited role — manages orders only; no access to customer financials. |
| **Driver** | Mobile-focused role — views delivery batches and marks orders as Delivered. |
| **Customer** | End customer — places orders via the public storefront; no account required. |
| **Platform Admin** | Platform-level — manages all tenants, plans, and platform operations. |

3. Functional Requirements

### 3.1 Authentication Module (AUTH)

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **AUTH-001** | P0 | Vendor Registration: The system SHALL allow a new vendor to register by providing: business name (Arabic + English), email address, Egyptian mobile number (+20 format), password (min 8 chars), store slug. System SHALL validate slug uniqueness. |
| **AUTH-002** | P0 | Vendor Login: The system SHALL authenticate vendors using email + password, returning a JWT access token (15-min expiry) and refresh token (30-day expiry). |
| **AUTH-003** | P0 | Token Refresh: The system SHALL provide a `/auth/refresh` endpoint that accepts a valid refresh token and returns a new access token without re-login. |
| **AUTH-004** | P1 | Staff Sub-Accounts: The system SHALL allow vendors on Growth+ plans to create staff sub-accounts with role assignment (Manager, Staff, Driver) and granular permission toggles. |
| **AUTH-005** | P1 | Password Reset: The system SHALL provide OTP-based password reset via Egyptian mobile SMS. |
| **AUTH-006** | P0 | Session Management: The system SHALL invalidate all tokens on explicit logout. Refresh tokens SHALL be stored in `httpOnly` cookies. |

### 3.2 Product Module (PROD)

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **PROD-001** | P0 | The system SHALL support bilingual product creation with `name_ar` (required), `name_en` (optional), `description_ar`, `description_en` fields. |
| **PROD-002** | P0 | The system SHALL support 4 product types: Standard, Made-to-Order, Perishable, Digital — each with type-specific behavior. |
| **PROD-003** | P0 | The system SHALL allow sellers to define unlimited custom variant dimensions with unlimited combinations, each with individual pricing override and stock. |
| **PROD-004** | P0 | The system SHALL support dynamic custom fields per product: text input, number, single select, multi-select, image picker. |
| **PROD-005** | P1 | Perishable products SHALL have configurable: Order Cutoff Time (daily), Available Days of Week, Lead Time Required (hours), Auto-Expire Date. |
| **PROD-006** | P1 | Made-to-Order products SHALL automatically set order status to 'Preparing' upon creation and display estimated production time to customers. |
| **PROD-007** | P1 | The system SHALL display auto-generated Order Badges on products (e.g., 'Ordered 240 times this month') computed from real order data. |
| **PROD-008** | P0 | Product images SHALL be uploaded to Cloudflare R2, processed to max 800px width, and served via CDN URL with WebP conversion. |
| **PROD-009** | P0 | The system SHALL enforce product limits per subscription plan: Starter (30 products), Growth/Pro/Enterprise (unlimited). |
| **PROD-010** | P1 | The system SHALL prevent customers from ordering perishable products after the seller-configured daily cutoff time. |

### 3.3 Order Module (ORD)

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **ORD-001** | P0 | Manual Order Entry: The system SHALL support manual order entry by sellers on behalf of customers — selecting products, variants, quantities, and overriding price. |
| **ORD-002** | P0 | Order State Machine: The system SHALL implement an order status state machine: Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered / Cancelled. |
| **ORD-003** | P0 | Audit Log: The system SHALL record a `status_history` entry (status, changed_by, timestamp, note) for every transition — immutable audit log. |
| **ORD-004** | P0 | Item Snapshot: Order items SHALL be stored as a JSON snapshot at time of order — product name, price, variant details. |
| **ORD-005** | P0 | COD Confirmation: The system SHALL implement a COD Confirmation step: when marking 'Delivered', ask 'Cash collected?'. If 'No', order enters 'Pending COD Collection'. |
| **ORD-006** | P0 | Delivery Promise: The system SHALL provide a Delivery Promise field: free-text (max 100 chars) or time-slot selection. |
| **ORD-007** | P0 | Order Numbers: The system SHALL assign unique human-readable sequential order numbers (e.g., #1042) per vendor. |
| **ORD-008** | P1 | InstaPay Flow: The system SHALL support an InstaPay payment confirmation flow: reference entry -> 'Payment Under Review' -> seller confirms/rejects. |
| **ORD-009** | P1 | Pay Later: The system SHALL support a 'Pay Later' (Credit/Hesabi) method that tracks credit balance per customer. |
| **ORD-010** | P1 | Issue Flagging: The system SHALL allow sellers to flag issues on any order (Issue Flag) with resolution logging: Replaced, Refunded, Discount. |
| **ORD-011** | P2 | Delivery Batching: The system SHALL support order batching: grouping multiple orders by governorate/district into a named delivery batch. |
| **ORD-012** | P0 | Order Limits: The system SHALL enforce order limits for Starter plan vendors (150 orders/month) with dashboard notifications. |

### 3.4 Customer CRM Module (CRM)

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **CRM-001** | P0 | Guest Profiles: The system SHALL allow sellers to create customer profiles with: name, phone (+20), addresses, notes, and source (WhatsApp, etc.) — no customer account required. |
| **CRM-002** | P0 | Order Linking: All orders SHALL be linked to a customer profile via phone number; history view supported. |
| **CRM-003** | P1 | Customer Tags: The system SHALL support tags (VIP, Blocked, etc.) with potential automatic discount rules. |
| **CRM-004** | P1 | Credit Balances: The system SHALL track `credit_balance` per customer for Pay Later orders. |
| **CRM-005** | P1 | Family Support: Multiple addresses per customer with recipient name override support. |
| **CRM-006** | P1 | Aggregates: The system SHALL maintain denormalized `order_count` and `total_spent` for fast display. |
| **CRM-007** | P0 | Soft Delete: Customer deletion SHALL be soft-delete to preserve historical order integrity. |

### 3.5 Egypt-Specific Requirements (EGY)

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **EGY-001** | P0 | Delivery Zone Matrix: Pre-loaded 27 governorates with customizable per-zone pricing and free delivery thresholds. |
| **EGY-002** | P0 | Mobile-First: Customer-facing pages must load in <3s on Slow 3G; <200KB weight; Cloudflare Cairo PoP. |
| **EGY-003** | P0 | PWA: Storefront must be a PWA with service worker caching and home screen install on Android. |
| **EGY-004** | P1 | Seasonal Calendar: Pre-loaded Islamic/Coptic holidays withOperational Profile trigger suggestions. |
| **EGY-005** | P1 | Ramadan Mode: Operational profile preset shifting hours to 8pm–2am and prayer-aware time slots. |
| **EGY-006** | P1 | Masri Dialect: All UI strings in conversational Egyptian Arabic (Masri); MSA formal toggle for reports. |
| **EGY-007** | P1 | Font Optimiz: Self-hosted Cairo/Tajawal font subsets to reduce load on mid-range Android devices. |
| **EGY-008** | P2 | Bosta Courier: API integration for rates, labels, and status tracking (Pro plan). |
d
shipping label generation, and shipment status webhooks — available for Pro plan vendors.

4. Non-Functional Requirements

4.1 Performance Requirements

| ID | Metric | Target | Condition |
| :--- | :--- | :--- | :--- |
| **NFR-P01** | Storefront page load (Slow 3G, Egypt) | <3 seconds | All customer-facing pages — verified via Lighthouse |
| **NFR-P02** | API response — order creation | <500ms p95 | Under 1,000 concurrent requests |
| **NFR-P03** | API response — product listing | <300ms p95 | With CDN caching for public pages |
| **NFR-P04** | Dashboard initial load | <2 seconds | Seller dashboard SPA on 4G mobile |
| **NFR-P05** | Image upload processing | <5 seconds | Per image including R2 upload and WebP conversion |
| **NFR-P06** | Analytics query | <3 seconds | Monthly aggregate across up to 10,000 orders |

4.2 Security Requirements

| ID | Category | Requirement |
| :--- | :--- | :--- |
| **NFR-S01** | Multi-Tenancy Isolation | Every API endpoint MUST enforce `vendor_id` filtering from JWT claims. A tenant MUST NOT access another tenant's data. |
| **NFR-S02** | Authentication | Passwords hashed with bcrypt (cost 12+). JWTs signed with RS256. Refresh tokens in `httpOnly` cookies. |
| **NFR-S03** | Input Validation | All inputs validated server-side. SQLi prevention via TypeORM. XSS prevention via CSP headers. |
| **NFR-S04** | HTTPS Enforcement | All communications over TLS 1.2+. HTTP redirected to HTTPS. HSTS enabled. |
| **NFR-S05** | Rate Limiting | Auth: 5/min IP. Order: 60/min vendor. General API: 300/min vendor. |
| **NFR-S06** | File Upload Security | Scan for malware. Only JPEG/PNG/WebP accepted. Max 5MB per image. |

4.3 Reliability & Availability

| ID | Requirement | Detail |
| :--- | :--- | :--- |
| **NFR-R01** | Uptime SLA | 99.5% uptime for all production services. |
| **NFR-R02** | Data Backup | Daily automated PostgreSQL snapshots with 30-day retention; R2 cross-region replication. |
| **NFR-R03** | Error Handling | Standardized error response envelope; machine-readable error codes; sanitization. |
| **NFR-R04** | Queue Resilience | BullMQ jobs in Redis are persistent; automatic retry on failure; dead-letter queue. |
| **NFR-R05** | Graceful Degradation | System remains functional in core paths (order placement) if secondary services (analytics) are down. |

4.4 Data Privacy & Compliance

All data handling MUST comply with Egypt's Personal Data Protection Law No. 151 of 2020 (PDPL):

- All Egyptian personal data (customer names, phone numbers, addresses) MUST be stored on servers located within Egypt or AWS me-south-1 (Bahrain) as the nearest compliant region.
- Customer order forms MUST include an explicit consent checkbox with Arabic-language privacy notice.
- Vendors terminating their account MUST be offered complete data export before deletion, after which all their data and their customers' data MUST be permanently deleted within 30 days.
- The platform MUST NOT share vendor or customer data with third parties without explicit consent.
- Privacy policy MUST be available in Arabic and easily accessible from all public-facing pages.

5. System Architecture Requirements

5.1 Multi-Tenancy Architecture

The system SHALL use Row-Level Isolation as the multi-tenancy strategy:

- ALL tables containing tenant data MUST have a `vendor_id` UUID column with a `NOT NULL` constraint and an index.
- ALL NestJS service methods MUST inject `vendor_id` from the authenticated JWT and apply it as a `WHERE` clause.
- A `TenantInterceptor` MUST be applied globally and throw HTTP 403 if `vendor_id` is missing or mismatched.

**Critical Security Requirement**
The `TenantInterceptor` MUST be tested with explicit cross-tenant penetration tests before production deployment. A test vendor account MUST be unable to access any resource belonging to another vendor via any API endpoint, including by manipulating request parameters.

5.2 API Design Requirements

| ID | Requirement | Detail |
| :--- | :--- | :--- |
| **API-001** | RESTful conventions | GET (read), POST (create), PATCH (update), DELETE (soft delete). |
| **API-002** | Versioning | All routes prefixed with `/api/v1/`. |
| **API-003** | Response format | Standard envelope: `{data, meta, error}`. |
| **API-004** | Error codes | Machine-readable `errorCode` strings (e.g., `ORDER_STATUS_INVALID`). |
| **API-005** | Idempotency | Order creation supports `Idempotency-Key` header. |

5.3 Database Schema Requirements

The  following  tables  are  mandatory  in  the  initial  schema.  All  tables  MUST  include  created_at  and  updated_at
timestamps with default NOW() and auto-update triggers:

| Table Name | Description |
| :--- | :--- |
| **vendors** | Tenant root. Profile data, plan reference, JSONB settings. |
| **products** | Per-vendor catalog. JSONB images, custom fields, variants. |
| **product_variants** | Purchasable combinations with independent pricing and stock. |
| **orders** | Central transactions. JSONB items snapshot, status history, metadata. |
| **customers** | Vendor-scoped profiles. JSONB addresses, tags, credit balances. |
| **delivery_batches** | Grouped delivery runs with order reference arrays. |
| **staff_members** | Vendor sub-accounts with JSONB permissions. |
| **subscription_plans** | Platform-level feature gates and limits. |

6. Interface Requirements

6.1 User Interface Requirements

- **UI-001:** The primary UI language SHALL be Arabic (Masri dialect), rendered right-to-left (RTL). An English / LTR toggle SHALL be available on all customer-facing pages.
- **UI-002:** All customer-facing pages SHALL pass Lighthouse Mobile audit with score >80. Maximum initial page weight: 200KB (excluding lazy-loaded images).
- **UI-003:** The seller dashboard SHALL be a Single Page Application (SPA) using React + Vite. Navigation SHALL not trigger full page reloads.
- **UI-004:** The customer storefront SHALL be Server-Side Rendered (SSR) using Next.js for SEO indexability of product pages.
- **UI-005:** All interactive elements SHALL have minimum touch target size of 44x44px on mobile to support mid-range Android devices.
- **UI-006:** Color contrast ratios SHALL meet WCAG 2.1 AA standards: 4.5:1 for normal text, 3:1 for large text.
- **UI-007:** The system SHALL use Cairo and Tajawal fonts for Arabic text, served as self-hosted subsets to minimize load time.

6.2 External API Interfaces

| System | Protocol | Interface Description |
| :--- | :--- | :--- |
| **Cloudflare R2** | HTTPS | `POST /upload` — multipart file upload; `GET` via CDN URL. Auth: R2 API token in Authorization header. |
| **InstaPay (CBE)** | HTTPS | Manual reference confirmation MVP. Phase 2: CBE Open Banking API with OAuth 2.0. |
| **Fawry Accept** | HTTPS / Webhook | `POST /fawry/charge` — generate reference; `POST /webhook/fawry` — receive payment confirmation. HMAC signature verification required. |
| **Bosta** | HTTPS / REST | `POST /shipments` — create shipment; `GET /rates` — calculate rates; Webhook for status updates. Phase 2 only. |
| **WhatsApp Business API** | HTTPS / Meta Graph API | `POST /messages` — send template messages; Webhook for delivery receipts. Phase 2 only. |
| **BullMQ / Redis** | TCP | Internal queue for async jobs: notification dispatch, analytics aggregation, image processing. |

7. Data Validation Requirements

7.1 Input Validation Rules

| ID | Field | Rule |
| :--- | :--- | :--- |
| **VAL-001** | Egyptian phone number | Must match regex: `/^(\+20\|0020\|0)?1[0-2,5][0-9]{8}$/` — validates Vodafone, Etisalat, Orange, WE numbers. |
| **VAL-002** | Store slug | Lowercase alphanumeric and hyphens only. 3–50 characters. Must be globally unique. Reserved words blocked: admin, api, www, support, login. |
| **VAL-003** | Product price | Numeric, minimum 0.01, maximum 999999.99, precision 2 decimal places. EGP assumed. |
| **VAL-004** | Order items | At least 1 item required per order. Quantity must be positive integer. Custom price override must not be negative. |
| **VAL-005** | Customer phone | Egyptian mobile format required (see VAL-001). Used as unique customer identifier per vendor. |
| **VAL-006** | Credit balance | Cannot go below 0 when recording payments (prevent overpayment errors). Server-side check required. |
| **VAL-007** | Image upload | Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`. Max 5MB per file. Max 10 images per product. |
| **VAL-008** | Delivery fee | Non-negative numeric. Per-governorate configuration. Cannot exceed 10x the order subtotal (anti-fraud). |

8. Subscription Plan Constraints

8.1 Plan Feature Limits (Egypt Pricing)

| Feature | Starter (EGP 199/mo) | Growth (EGP 499/mo) | Pro (EGP 999/mo) | Enterprise (EGP 1,999+/mo) |
| :--- | :--- | :--- | :--- | :--- |
| **Products** | 30 | Unlimited | Unlimited | Unlimited |
| **Orders/month** | 150 | Unlimited | Unlimited | Unlimited |
| **Staff accounts** | 1 (owner) | 3 | 10 + drivers | Unlimited |
| **Analytics** | 7-day basic | Full + export | Advanced + AI | Custom |
| **Custom domain** | No | 100 | Yes | Yes |
| **WhatsApp msgs/mo** | None | Yes | Unlimited | Unlimited + bot |
| **Delivery batching** | No | Yes | Full + map | Full + driver app |
| **Customer CRM** | Basic | Full | Full + loyalty | Full + API |
| **Made-to-order** | No | Yes | Yes | Yes |
| **Egypt zone matrix** | No | Yes | Yes | Yes |
| **COD tracking** | Yes | Yes | Yes | Yes |
| **Support** | Email | WhatsApp | Dedicated AM | Dedicated AM |

8.2 Plan Enforcement Rules

- When a Starter vendor reaches 150 orders, the system SHALL display an upgrade prompt in the dashboard. Orders SHALL continue to be received but a banner shall warn the vendor.
- When a Starter vendor attempts to add a 31st product, the system SHALL reject the request with HTTP 402 and display an upgrade prompt.
- Feature flags SHALL be checked server-side on every request — client-side feature hiding is supplementary only and SHALL NOT be treated as a security control.
- Plan downgrades SHALL be delayed to end of billing period. No data is deleted on downgrade — features are locked but data remains accessible.
- Free trial period: 14 days. Credit card not required for trial activation. After 14 days, account is read-only until subscription is activated.

9. Compliance & Legal Requirements

9.1 Egypt PDPL Compliance (Law No. 151 of 2020)

- **COMP-001:** All personal data of Egyptian citizens MUST be stored on servers physically located in Egypt or in a country with an adequate data protection level recognized by the Egyptian Data Protection Authority (EDPA). AWS `me-south-1` (Bahrain) is an acceptable interim option.
- **COMP-002:** The customer order form MUST include a clearly labeled Arabic-language consent checkbox: 'أوافق على سياسة الخصوصية ومعالجة البيانات'. Unchecked = order blocked.
- **COMP-003:** The platform MUST provide vendors with a GDPR/PDPL-style Data Processing Agreement (DPA) on signup.
- **COMP-004:** Customer data MUST be exportable by vendors in JSON or CSV format on request.
- **COMP-005:** All customer data MUST be permanently deleted within 30 days of vendor account termination — with confirmation email to vendor.
- **COMP-006:** Platform privacy policy MUST be accessible in Arabic from every page footer with no more than 2 clicks.

9.2 Payment Compliance

- **PAY-COMP-001:** Fawry integration MUST use Accept by Fawry's CBE-licensed payment gateway. Integration requires formal merchant registration with Fawry.
- **PAY-COMP-002:** InstaPay operations MUST comply with CBE Regulation No. 10 of 2022 for instant payment systems.
- **PAY-COMP-003:** All payment transaction references MUST be stored with timestamp, amount, and vendor association for 7-year audit retention.
- **PAY-COMP-004:** The platform SHALL NOT store raw card numbers. PCI-DSS compliance is handled by the payment gateway (Paymob/Accept).

10. Requirements Traceability Matrix

| Req IDs | Feature Area | Module | Test Cases | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-001–006** | Vendor login/registration | AuthModule | TC-AUTH-001–006 | P0/P1 |
| **PROD-001–010** | Product management | ProductModule | TC-PROD-001–010 | P0/P1 |
| **ORD-001–012** | Order lifecycle | OrderModule | TC-ORD-001–012 | P0/P1/P2 |
| **CRM-001–007** | Customer management | CustomerModule | TC-CRM-001–007 | P0/P1 |
| **EGY-001–008** | Egypt market specifics | Multiple modules | TC-EGY-001–008 | P0/P1/P2 |
| **NFR-P01–06** | Performance budgets | Frontend + API | TC-PERF-001–006 | P0 |
| **NFR-S01–06** | Security controls | All modules + TenantInterceptor | TC-SEC-001–006 | P0 |
| **COMP-001–006** | PDPL compliance | DataModule + Auth | TC-COMP-001–006 | P0 |
| **VAL-001–008** | Input validation | All input endpoints | TC-VAL-001–008 | P0 |
| **UI-001–007** | UI standards | Frontend | TC-UI-001–007 | P0/P1 |

**Document Status**
This SRS v1.0 is the baseline for the Local Commerce Management SaaS MVP development targeting Egypt's social commerce market. All requirements marked P0 MUST be implemented before production launch. P1 requirements MUST be implemented before Growth plan availability. P2 requirements target Phase 2 and Phase 3 milestones.

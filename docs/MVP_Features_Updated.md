# Local Commerce Management SaaS — MVP Features (Updated)
## Aligned with PRD v1.0 & SRS v1.0 | Egypt Market

> **Changelog from previous version:**
> - Corrected InstaPay flow from P0 → P1 (matches SRS ORD-008 & PRD FR-O09)
> - Removed Fawry from MVP (confirmed P2 in SRS ORD-013)
> - Clarified Governorate Matrix as P0 per SRS EGY-001 (overrides PRD Phase 2 placement — resolved)
> - Staff sub-accounts correctly marked P1 (not in MVP)
> - Added Vendor Subscription Billing to Super Admin (missing from original)
> - Added RFQ Module as Phase 2 differentiator
> - Delivery Man accounts explicitly deferred to Phase 2

---

## PHASE 1 — MVP (Weeks 1–10) | P0 Only

### Module 1 — Authentication & Multi-Tenancy

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| AUTH-001 | Vendor registration: business name (AR+EN), email, Egyptian mobile (+20), password, store slug (unique, validated, reserved words blocked) | P0 | AUTH-001 |
| AUTH-002 | JWT login: access token (15min) + refresh token (30 days, httpOnly cookie) | P0 | AUTH-002 |
| AUTH-003 | Token refresh endpoint `/auth/refresh` — silent re-auth without re-login | P0 | AUTH-003 |
| AUTH-006 | Session invalidation on explicit logout — all tokens revoked | P0 | AUTH-006 |
| AUTH-M01 | Complete tenant isolation: global `TenantInterceptor` enforcing `vendor_id` on every request | P0 | NFR-S01 |
| AUTH-M02 | Store profile management: logo, banner, business name (AR/EN), working hours | P0 | FR-A03 |

**Out of MVP:** Staff sub-accounts (P1), SMS password reset (P1), 2FA (P2)

---

### Module 2 — Product Management

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| PROD-001 | Bilingual product creation: `name_ar` (required), `name_en` (optional), `description_ar`, `description_en` | P0 | PROD-001 |
| PROD-002 | Product types: Standard, Made-to-Order, Perishable, Digital — with type-specific behavior flags | P0 | PROD-002 |
| PROD-003 | Dynamic Variant Builder: unlimited dimensions + combinations, each with independent price override and stock | P0 | PROD-003 |
| PROD-004 | Custom dynamic fields per product: text, number, single-select, multi-select, image picker | P0 | PROD-004 |
| PROD-008 | Image upload to Cloudflare R2: max 10 images/product, WebP conversion, CDN URL response, max 5MB/image | P0 | PROD-008 |
| PROD-009 | Plan enforcement: Starter capped at 30 products (HTTP 402 on 31st), Growth/Pro/Enterprise unlimited | P0 | PROD-009 |

**Out of MVP:** Perishable cutoff times (P1), Order badges (P1), Auto-expire (P1), Categories (P1), Inventory alerts (P2)

---

### Module 3 — Order Management

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| ORD-001 | Manual Order Entry: seller creates orders on behalf of WhatsApp/IG customers — product selection, variants, quantities, price override, notes | P0 | ORD-001 |
| ORD-002 | Order State Machine: `Pending → Confirmed → Preparing → Out for Delivery → Delivered / Cancelled` — no state skipping | P0 | ORD-002 |
| ORD-003 | Immutable Audit Log: every status transition logged with `{status, changed_by, timestamp, note}` | P0 | ORD-003 |
| ORD-004 | Item Snapshot: order items stored as JSON at creation time — product name, price, variant (immutable) | P0 | ORD-004 |
| ORD-005 | COD Confirmation: "Cash collected?" prompt on Delivered → enters "Pending COD Collection" if No | P0 | ORD-005 |
| ORD-006 | Delivery Promise field: free-text (max 100 chars) or time-slot ("After Maghrib today") per order | P0 | ORD-006 |
| ORD-007 | Sequential human-readable order numbers per vendor (e.g., #1042) | P0 | ORD-007 |
| ORD-012 | Plan enforcement: Starter capped at 150 orders/month — dashboard warning at 120, banner at 150 | P0 | ORD-012 |

**Out of MVP:** InstaPay confirmation flow (P1), Pay Later/Hesabi (P1), Issue flagging (P1), Delivery batching (P2), Fawry (P2)

---

### Module 4 — Customer CRM

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| CRM-001 | Guest Customer Profile: seller creates profiles with name, phone (+20), addresses, notes, source (WhatsApp/IG/etc.) — no customer account | P0 | CRM-001 |
| CRM-002 | Order Linking: all orders auto-linked to customer via phone number; full history view | P0 | CRM-002 |
| CRM-007 | Soft Delete: preserves historical order integrity on profile deletion | P0 | CRM-007 |

**Out of MVP:** Tags (P1), Credit balances (P1), Multiple addresses (P1), Aggregates (P1), Merge duplicates (P2)

---

### Module 5 — Egypt-Specific (Moat)

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| EGY-001 | 27-Governorate Delivery Zone Matrix: pre-loaded, customizable per-zone pricing + free delivery thresholds per vendor | P0 | EGY-001 |
| EGY-002 | Mobile-First Performance: <3s on Slow 3G, <200KB initial load, Cloudflare Cairo PoP | P0 | EGY-002 |
| EGY-003 | PWA: service worker caching + "Add to Home Screen" on Android | P0 | EGY-003 |
| EGY-L01 | Arabic privacy consent checkbox on all order forms (PDPL Law No. 151 of 2020 — order blocked without it) | P0 | COMP-002 |
| EGY-L02 | Egyptian phone validation regex on all phone inputs (Vodafone, Etisalat, Orange, WE) | P0 | VAL-001 |

**Out of MVP:** Seasonal calendar (P1), Ramadan mode (P1), Masri dialect toggle (P1), Bosta API (P2)

---

### Module 6 — Basic Analytics

| ID | Feature | Priority | SRS Ref |
|:---|:--------|:--------:|:-------:|
| AN-001 | Revenue totals: daily, weekly, monthly in EGP | P0 | FR-AN01 |
| AN-002 | Order count per day with status breakdown chart | P0 | FR-AN02 |

**Out of MVP:** Best-sellers (P1), COD report (P1), Returning customer rate (P1), Governorate heatmap (P2)

---

### Module 7 — Vendor Subscription & Billing (Super Admin)

| ID | Feature | Priority | Notes |
|:---|:--------|:--------:|:------|
| BILL-001 | 14-day free trial activation — no credit card required | P0 | PRD 8.2 |
| BILL-002 | Account goes read-only after trial expires (no new products/orders) | P0 | PRD 8.2 |
| BILL-003 | Super Admin panel: manually activate/deactivate vendor subscriptions (V1 = manual collection via bank transfer/InstaPay) | P0 | Derived |
| BILL-004 | Plan feature gates enforced server-side (product limits, order limits) — client hiding is supplementary only | P0 | SRS 8.2 |
| BILL-005 | Plan downgrade delayed to end of billing period — data preserved, features locked | P0 | SRS 8.2 |

---

### Non-Functional Requirements (P0 — All Must Pass Before Launch)

| Category | Requirement | Target | Ref |
|:---------|:-----------|:------:|:---:|
| Performance | Storefront page load (Slow 3G) | < 3 seconds | NFR-P01 |
| Performance | Order creation API response | < 500ms p95 | NFR-P02 |
| Performance | Product listing API | < 300ms p95 | NFR-P03 |
| Performance | Dashboard initial load (4G) | < 2 seconds | NFR-P04 |
| Security | Cross-tenant isolation | Zero leakage — pen tested | NFR-S01 |
| Security | Password hashing | bcrypt cost 12+, RS256 JWT | NFR-S02 |
| Security | Rate limiting — Auth | 5/min per IP | NFR-S05 |
| Security | Rate limiting — Orders | 60/min per vendor | NFR-S05 |
| Availability | Uptime SLA | 99.5% | NFR-R01 |
| Data Privacy | PDPL compliance | Data in Egypt or me-south-1 | COMP-001 |
| Mobile | Lighthouse score | > 80 mobile | NFR-10 |
| Accessibility | Touch targets | Min 44×44px | UI-005 |
| Backup | DB snapshots | Daily, 30-day retention | NFR-R02 |

### MVP Launch Acceptance Criteria

1. Seller creates a WhatsApp-sourced order in < 2 minutes from dashboard
2. A vendor cannot view orders or products of another vendor via any API endpoint (pen test verified)
3. Storefront provides "Add to Home Screen" prompt on Android
4. System distinguishes "Delivered" vs "Cash Collected" for revenue reporting
5. Storefront remains interactive on Chrome Slow 3G simulation
6. Arabic privacy checkbox blocks order submission when unchecked
7. Seller cannot add a 31st product on Starter plan without upgrade prompt

---

## PHASE 2 — Growth (Months 3–6) | P1

### Module 8 — Advanced Payments

| ID | Feature | Priority |
|:---|:--------|:--------:|
| PAY-001 | InstaPay confirmation flow: reference entry → "Payment Under Review" → seller confirms/rejects | P1 |
| PAY-002 | Pay Later / Hesabi: credit balance tracking per customer, manual payment recording | P1 |
| PAY-003 | Payment method field on orders: COD, Bank Transfer, InstaPay, Credit | P1 |

### Module 9 — Staff & Delivery Accounts

| ID | Feature | Priority |
|:---|:--------|:--------:|
| STAFF-001 | Staff sub-accounts for Growth+ plans: Owner, Manager, Staff, Driver roles | P1 |
| STAFF-002 | Driver account: simplified mobile view — assigned orders only, can mark Delivered | P1 |
| STAFF-003 | Driver verification: document upload + Super Admin approval before activation | P1 |
| STAFF-004 | Granular permission toggles per staff member | P1 |
| STAFF-005 | SMS-based OTP password reset for all account types | P1 |

### Module 10 — Enhanced Order Management

| ID | Feature | Priority |
|:---|:--------|:--------:|
| ORD-P1-001 | Issue Flag system: complaint logging with resolution (Replaced, Refunded, Discount) | P1 |
| ORD-P1-002 | Order search and filters: by status, date range, customer, payment method | P1 |
| ORD-P1-003 | Perishable product cutoff: orders blocked after daily cutoff time | P1 |
| ORD-P1-004 | Made-to-Order auto-status + estimated production time display | P1 |

### Module 11 — Enhanced CRM

| ID | Feature | Priority |
|:---|:--------|:--------:|
| CRM-P1-001 | Customer tags: VIP, Wholesale, Blocked, Friend + auto-discount rules | P1 |
| CRM-P1-002 | Multiple addresses per customer with labels (Home, Work) + recipient name override | P1 |
| CRM-P1-003 | Customer source tracking: WhatsApp, Instagram, Direct, Walk-in | P1 |
| CRM-P1-004 | Denormalized `order_count` and `total_spent` aggregates for fast display | P1 |

### Module 12 — Enhanced Analytics

| ID | Feature | Priority |
|:---|:--------|:--------:|
| AN-P1-001 | Best-selling products by order count and revenue | P1 |
| AN-P1-002 | Uncollected COD daily report | P1 |
| AN-P1-003 | Returning vs. new customer rate | P1 |

### Module 13 — Egypt Operational Tools

| ID | Feature | Priority |
|:---|:--------|:--------:|
| EGY-P1-001 | Egypt Seasonal Calendar: Islamic + Coptic holidays with Operational Profile suggestions 72h before | P1 |
| EGY-P1-002 | Operational Profiles: Ramadan Night Mode, Eid Mode, Coptic Holiday Mode | P1 |
| EGY-P1-003 | Masri dialect toggle: all UI strings in Egyptian colloquial Arabic | P1 |
| EGY-P1-004 | WhatsApp Business API: automated order status notifications (pending Meta verification) | P1 |

### Module 14 — RFQ (Request for Quotation) 🆕 Differentiator

> This module makes the platform fundamentally different from Salla, Zid, or any standard e-commerce tool. It digitizes the WhatsApp negotiation loop that Egyptian sellers actually use.

| ID | Feature | Priority |
|:---|:--------|:--------:|
| RFQ-001 | Customer submits RFQ from storefront: describes what they want, quantity, budget (no fixed price needed) | P1 |
| RFQ-002 | Seller receives RFQ in dashboard, can respond with a custom quote (price, delivery date, notes) | P1 |
| RFQ-003 | Customer receives quote notification (SMS/WhatsApp link) and can Accept or Negotiate | P1 |
| RFQ-004 | On Accept: RFQ auto-converts to a confirmed Order — no double entry | P1 |
| RFQ-005 | RFQ status machine: `Submitted → Quoted → Negotiating → Accepted → Converted to Order / Rejected` | P1 |
| RFQ-006 | Seller can create manual RFQ on behalf of a customer who negotiated via WhatsApp | P1 |
| RFQ-007 | Quote thread: multiple rounds of negotiation logged per RFQ | P1 |

---

## PHASE 3 — Scale (Months 6–18) | P2

| ID | Feature | Priority |
|:---|:--------|:--------:|
| P2-001 | Online payment gateway: Paymob / Accept integration | P2 |
| P2-002 | Fawry reference generation + webhook confirmation | P2 |
| P2-003 | Bosta Courier API: rate lookup, label generation, status tracking | P2 |
| P2-004 | Delivery batching: group orders by governorate/district into named delivery runs | P2 |
| P2-005 | Advanced analytics with AI insights and CSV/Excel export | P2 |
| P2-006 | Loyalty and rewards system | P2 |
| P2-007 | Custom domain for Pro plan | P2 |
| P2-008 | Marketplace mode (optional — aggregated discovery) | P2 |
| P2-009 | Governorate heatmap: order density by zone | P2 |
| P2-010 | RFQ public marketplace: buyers post RFQs visible to multiple sellers (opt-in) | P2 |
| P2-011 | GCC market expansion preparation | P2 |

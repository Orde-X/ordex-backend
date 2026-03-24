# Egypt Local Commerce Initiative: Social Commerce Management Platform
## Product Requirements Document (PRD)

**Version:** 1.0  
**Market:** Egypt — Cairo, Alexandria, Mansoura and all governorates  

---

## Table of Contents
1. [Product Overview & Vision](#1-product-overview--vision)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users & Personas](#3-target-users--personas)
4. [Feature Requirements](#4-feature-requirements)
5. [User Stories](#5-user-stories)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Constraints & Assumptions](#7-system-constraints--assumptions)
8. [Acceptance Criteria](#8-acceptance-criteria)
9. [Release Milestones](#9-release-milestones)
10. [Open Questions & Risks](#10-open-questions--risks)

---

1. Product Overview & Vision

1.1 Product Name & Concept

The Local Commerce Management SaaS is a multi-tenant, subscription-based platform designed to replace the chaotic social-media-based order management that Egyptian micro and small businesses currently rely on. The platform provides each business with a dedicated digital storefront, a centralized order management system, a customer CRM, and operational tools — all built for Egyptian sellers, in Egyptian Arabic, at Egyptian-market pricing.

Vision Statement

Become the digital back-office for every Egyptian local seller — giving them the professional infrastructure to grow without losing the personal touch that made them successful on WhatsApp and Instagram.

1.2 Problem Statement

Egyptian micro-sellers — operating across Cairo, Alexandria, Mansoura, and all 27 governorates — manage their entire commerce operation through WhatsApp messages, Instagram DMs, and Facebook posts. This results in:

- Orders scattered across 3–5 messaging platforms simultaneously, with no single source of truth
- Lost or forgotten orders — a direct revenue loss estimated at 10–20% of potential transactions
- No customer database — repeat buyers must re-send their name, address, and preferences every order
- No structured order statuses — customers cannot track their orders and call repeatedly for updates
- No revenue analytics — sellers cannot identify best-selling products or peak demand periods
- No professional storefront — potential customers cannot browse products without DMing the seller first
- Time wasted answering repetitive questions about price, availability, and delivery fees
- InstaPay and Fawry payment confirmation done manually via WhatsApp screenshot — error-prone and untracked
- Governorate-based delivery pricing managed in the seller's head, causing disputes and errors

### 1.3 Solution Overview

The platform delivers a focused, Arabic-first solution with the following core modules:

| Module | Description |
| :--- | :--- |
| **Vendor Registration & Storefront** | Each seller gets `yourapp.com/store-name` with their products, pricing, and ordering — shareable via WhatsApp bio link. |
| **Product Management** | Full product catalog with dynamic variants, custom fields, perishable/made-to-order types, and bilingual Arabic/English support. |
| **Order Dashboard** | Centralized view of all orders across statuses: Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered / Cancelled. |
| **Customer CRM** | Seller-managed customer profiles with order history, addresses, credit balances, and tags — no customer account required. |
| **Egypt-Specific Payments** | InstaPay confirmation flow, Fawry reference generation, and COD collection tracking. |
| **Delivery Management** | 27-governorate zone pricing, promise-based delivery scheduling, and neighborhood delivery batching. |
| **Analytics Dashboard** | Revenue totals, daily order counts, best-selling products, returning customer rates. |
| **Notifications** | WhatsApp Business API integration for automated order status updates (Phase 2). |

1.4 Market Context — Egypt

Egypt presents a uniquely large and underserved opportunity for this platform:

| Market Segment | Estimate |
| :--- | :--- |
| **Total informal social commerce sellers (Egypt)** | ~1.5M–2.5M active accounts |
| **Sellers receiving 5–100 orders/day (TAM)** | ~350,000 businesses |
| **Serviceable market — willing to pay (SAM)** | ~60,000–100,000 businesses |
| **Realistic Year 1 target (SOM)** | 1,000–3,000 subscribers |
| **Avg revenue at EGP 499/mo (Growth plan)** | EGP 249,500–998,000/month |
| **Annual potential at 3,000 subscribers** | ~EGP 12M/year |
| **COD dominance** | 70%+ of small business e-commerce transactions in Egypt |
| **Mobile traffic share** | 95%+ of Egyptian users are mobile-only |

2. Goals & Success Metrics

2.1 Product Goals

| ID | Goal | Measurable Target |
| :--- | :--- | :--- |
| **G1** | Reduce order loss rate | Eliminate lost/forgotten orders for active platform users to <1% |
| **G2** | Centralize order management | 100% of orders for active sellers managed through the platform dashboard |
| **G3** | Enable customer retention | Give sellers a searchable customer database with full order history |
| **G4** | Streamline Egyptian payments | InstaPay and Fawry confirmations tracked in-system, eliminating WhatsApp screenshot verification |
| **G5** | Support mobile-first Egypt | Storefront page loads in under 3 seconds on 3G in Cairo on Android |
| **G6** | Achieve product-market fit | 25–35% free-trial-to-paid conversion rate within 6 months of launch |

| KPI | Definition | Target |
| :--- | :--- | :--- |
| **Activation Rate** | % of registered vendors who create at least 1 product and receive 1 order | >70% within 7 days of signup |
| **Trial-to-Paid Conversion** | % of free trial users who upgrade to a paid plan | 25–35% |
| **Monthly Active Vendors (MAV)** | Vendors who process at least 1 order per month | 80% of paid subscribers |
| **Order Volume per Vendor** | Average orders processed per vendor per month | >50 orders/month by month 3 |
| **Churn Rate** | % of paid subscribers who cancel per month | <5% monthly |
| **Net Promoter Score (NPS)** | Seller satisfaction rating | NPS >50 |
| **Page Load Time** | Storefront page load on 3G mobile (Egypt) | <3 seconds |
| **Support Ticket Volume** | Tickets per 100 active vendors per month | <15 tickets |

3. Target Users & Personas

**Nour — The Cairo Flower Seller**
26-year-old female. Sells flower arrangements and bouquets via Instagram. Receives 15–40 orders/day. Uses WhatsApp to confirm orders and COD for payment. Core pain: orders get lost during peak seasons (Valentine's, Eid). Needs: time-based product cutoff, perishable product management, COD confirmation tracking.

**Ahmed — The Mansoura Baker**
34-year-old male. Makes custom cakes and pastries. Takes orders 48 hours in advance. Delivers in his own car. Core pain: customers don't respect the advance order window, delivery scheduling is chaotic. Needs: made-to-order product type, delivery promise system, lead time enforcement.

**Fatima — The Alexandria Accessories Seller**
29-year-old female. Sells handmade jewelry and accessories. Ships to all 27 governorates via Bosta. Core pain: delivery pricing disputes, customer keeps asking 'where is my order?'. Needs: Egypt 27-governorate delivery zone matrix, COD and InstaPay tracking, order status notifications.

**Khaled — The Cairo Home Goods Seller**
41-year-old male. Sells home decor and candles. Has 3 staff handling orders. Receives 60–100 orders/day. Core pain: staff miss orders, no unified view of all incoming orders. Needs: staff accounts, order dashboard, customer CRM, analytics.

4. Feature Requirements

4.1 Vendor Onboarding & Authentication

Priority: P0 — Must Have for MVP

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-A01** | P0 | Vendor registration with business name, email, phone, and store slug (`yourapp.com/store-name`) |
| **FR-A02** | P0 | Secure JWT-based authentication with refresh token rotation |
| **FR-A03** | P0 | Store profile management: logo, banner, Arabic/English business name, working hours |
| **FR-A04** | P1 | Staff sub-account creation with role-based permissions (Owner, Manager, Staff, Driver) |
| **FR-A05** | P1 | Forgot password / OTP reset via SMS (Egyptian mobile number format) |
| **FR-A06** | P2 | Two-factor authentication option for Pro plan vendors |

4.2 Product Management

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-P01** | P0 | Create, edit, delete, and toggle products with Arabic and English name/description |
| **FR-P02** | P0 | Product image upload (multiple images per product) with Cloudflare R2 CDN storage |
| **FR-P03** | P0 | Dynamic Variant Builder: seller-defined option names, values, per-combination pricing — no cap on variants |
| **FR-P04** | P0 | Product types: Standard, Made-to-Order, Perishable, Digital |
| **FR-P05** | P0 | Custom dynamic fields per product: text, number, select, multi-select, image picker |
| **FR-P06** | P1 | Perishable product settings: Order Cutoff Time, Available Days of Week, Lead Time Required (hours) |
| **FR-P07** | P1 | Auto-Expire Listing: product deactivates automatically after a specified date |
| **FR-P08** | P1 | Order Badges: auto-generated social proof from order data ('Ordered 240 times this month') |
| **FR-P09** | P1 | Product categories and manual sort ordering |
| **FR-P10** | P2 | Inventory tracking per variant with low-stock alerts |

4.3 Order Management

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-O01** | P0 | Customer-facing order form at `yourapp.com/store-name` with product selection and address input |
| **FR-O02** | P0 | Manual Order Entry by seller: create order on behalf of customer with custom notes and price override |
| **FR-O03** | P0 | Order status state machine: Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered / Cancelled |
| **FR-O04** | P0 | Full status history log per order: {status, changed_by, timestamp, note} |
| **FR-O05** | P0 | Order items stored as snapshot (product name, price, variant at time of order — immutable) |
| **FR-O06** | P0 | COD Confirmation step: 'Cash collected?' prompt when marking Delivered -> 'Pending Collection' state if uncollected |
| **FR-O07** | P0 | Delivery Promise field: free-text or time-slot picker ('After Maghrib today', 'Tomorrow morning') |
| **FR-O08** | P1 | Payment method support: COD, Bank Transfer, InstaPay, Fawry, Credit (Pay Later) |
| **FR-O09** | P1 | InstaPay confirmation flow: seller uploads transaction reference, order moves to 'Payment Under Review' -> 'Confirmed' |
| **FR-O10** | P1 | Issue Flag system: seller logs complaint and resolution (Replaced, Refunded, Discount) tied to customer profile |
| **FR-O11** | P1 | Order search, filter by status, date range, customer, payment method |
| **FR-O12** | P2 | Delivery batching: group orders by governorate/district for same-day delivery run planning |
| **FR-O13** | P2 | Fawry reference code generation per order with automated confirmation webhook |

4.4 Customer CRM

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-C01** | P0 | Guest Customer Profile creation by seller: name, phone, addresses, notes — no customer account required |
| **FR-C02** | P0 | Customer order history: all orders tied to phone number |
| **FR-C03** | P1 | Customer tags: VIP, Wholesale, Blocked, Friend — with auto-discount rule application |
| **FR-C04** | P1 | Credit balance (Pay Later / Hesabi): track outstanding amounts, record manual payments |
| **FR-C05** | P1 | Multiple addresses per customer with labels (Home, Work, etc.) and 'Order For' recipient override |
| **FR-C06** | P1 | Customer source tracking: WhatsApp, Instagram, Direct, Walk-in |
| **FR-C07** | P2 | Customer search and filtering by tag, total spent, last order date |
| **FR-C08** | P2 | Merge duplicate customer profiles (same phone number, different names) |

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-EG01** | P0 | Egypt 27-Governorate Delivery Zone Matrix: pre-loaded governorates with customizable per-zone pricing and free delivery thresholds |
| **FR-EG02** | P0 | Mobile-first performance: max 200KB initial load, lazy-loaded images via Cloudflare Cairo PoP, single-tap order confirmation |
| **FR-EG03** | P0 | Progressive Web App (PWA): customers can install seller's store to home screen on Android without app store |
| **FR-EG04** | P1 | Egypt Seasonal Calendar: pre-loaded national holidays (Islamic + Coptic) with automatic Operational Profile switching suggestions 72h before each event |
| **FR-EG05** | P1 | Operational Profiles: Ramadan Night Mode (8pm–2am), Eid Mode (surge pricing, gift wrapping), Coptic Holiday Mode, Sham el-Nessim Mode |
| **FR-EG06** | P1 | Masri (Egyptian Arabic) UI localization: all interface strings, notifications, and onboarding in conversational Egyptian dialect — MSA toggle for formal documents |
| **FR-EG07** | P2 | Bosta API integration: real-time rate lookup and automated label generation for inter-governorate shipments |
| **FR-EG08** | P2 | Arabic font optimization: Cairo and Tajawal fonts optimized for mid-range Android devices common in Egypt |

4.6 Analytics Dashboard

| ID | Priority | Requirement |
| :--- | :--- | :--- |
| **FR-AN01** | P0 | Total revenue (daily, weekly, monthly) with EGP formatting |
| **FR-AN02** | P0 | Orders per day chart with status breakdown |
| **FR-AN03** | P1 | Best-selling products by order count and revenue |
| **FR-AN04** | P1 | Returning vs. new customer rate |
| **FR-AN05** | P1 | Uncollected COD amounts per day report |
| **FR-AN06** | P2 | Governorate heatmap: which zones generate most orders |
| **FR-AN07** | P2 | Analytics export to CSV/Excel |

5. User Stories

5.1 Core Seller Flows

| ID | User Story | Rationale / Priority |
| :--- | :--- | :--- |
| **US-001** | As a seller, I want to create a manual order on behalf of a customer who messaged me on WhatsApp | So that all my orders are centralized in one system regardless of how they came in [P0] |
| **US-002** | As a seller, I want to mark an order as 'Delivered' and confirm cash was collected | So that I can track my daily COD revenue accurately without paper notes [P0] |
| **US-003** | As a seller, I want to set an order cutoff time for my baked goods | So that customers cannot place same-day orders when I need 48 hours advance notice [P0] |
| **US-004** | As a seller, I want to create a customer profile with their name, phone, address, and preferences | So that repeat customers don't have to re-send their details every time they order [P0] |
| **US-005** | As a seller, I want to put a loyal customer on a 'Pay Later' tab with a credit balance | So that I can support the cultural norm of deferred payment (hesabi) without losing track of what's owed [P1] |
| **US-006** | As a seller, I want to receive an InstaPay transfer confirmation with a transaction reference | So that I can verify payment without asking customers to resend screenshots on WhatsApp [P1] |
| **US-007** | As a seller, I want to set different delivery prices for each of Egypt's 27 governorates | So that my delivery fee is automatically applied based on the customer's location with no manual calculation [P1] |
| **US-008** | As a seller, I want to activate 'Ramadan Night Mode' to shift my working hours to 8pm–2am | So that my store reflects my actual availability during Ramadan without daily manual updates [P1] |
| **US-009** | As a seller, I want to batch all orders going to Dokki district today into one delivery run | So that I can plan my delivery route efficiently and reduce trips [P2] |
| **US-010** | As a seller, I want to view my best-selling products and peak order days | So that I can make informed decisions about stock and production planning [P1] |

5.2 Customer-Facing Flows

| ID | User Story | Priority |
| :--- | :--- | :--- |
| **UC-001** | As a customer, I want to open a seller's store link from their WhatsApp bio, browse products, and place an order in under 2 minutes | P0 |
| **UC-002** | As a customer, I want to see the store page in Arabic and switch to English if needed | P0 |
| **UC-003** | As a customer, I want the store to load quickly on my mid-range Android phone on 4G in Cairo | P0 |
| **UC-004** | As a customer, I want to see how many times a product has been ordered this month as a trust signal | P1 |
| **UC-005** | As a customer, I want to install the seller's store as a PWA on my Android home screen for fast repeat access | P2 |

6. Non-Functional Requirements

| ID | Category | Requirement |
| :--- | :--- | :--- |
| **NFR-01** | Performance | Storefront pages must load in <3 seconds on 3G mobile connections in Egypt |
| **NFR-02** | Performance | API response time for order creation must be <500ms under normal load |
| **NFR-03** | Scalability | Architecture must support 10,000 concurrent vendors without schema changes |
| **NFR-04** | Security | All vendor data isolated via `vendor_id` row-level security — zero cross-tenant data leakage |
| **NFR-05** | Security | JWT tokens expire in 15 minutes; refresh tokens expire in 30 days |
| **NFR-06** | Availability | 99.5% uptime SLA for all production services |
| **NFR-07** | Data Privacy | Compliance with Egypt's Personal Data Protection Law No. 151 of 2020 |
| **NFR-08** | Data Residency | All Egyptian customer data stored on servers within Egypt or AWS me-south-1 (Bahrain) |
| **NFR-09** | Localization | Full RTL Arabic support across all interfaces — Masri dialect primary, MSA formal toggle |
| **NFR-10** | Mobile | All pages must pass Lighthouse Mobile score >80 with max 200KB initial page weight |
| **NFR-11** | Accessibility | WCAG 2.1 AA compliance for all customer-facing pages |
| **NFR-12** | Backup | Database automated daily backups with 30-day retention |

7. System Constraints & Assumptions

7.1 Technical Constraints

- **Network infrastructure:** Egypt's 3G/4G reliability varies significantly between Cairo and Upper Egypt governorates — all features must be functional on 3G with graceful degradation.
- **Payment gateway constraints:** Paymob, Fawry, and Accept require CBE (Central Bank of Egypt) compliance documentation before live integration — InstaPay manual confirmation flow is the MVP workaround.
- **WhatsApp Business API:** Meta requires formal business verification; must launch without WA API and use in-platform notifications first.
- **Android dominance:** 90%+ of Egyptian mobile users use Android — iOS support is secondary priority.
- **Multi-tenancy:** Row-level isolation approach means every query MUST include `vendor_id` filter — missing this is a critical security vulnerability.

7.2 Business Assumptions

- Sellers are willing to share their WhatsApp store link (`yourapp.com/store-name`) with existing customers to redirect them to the platform.
- EGP pricing (Starter: 199, Growth: 499, Pro: 999) is within budget for sellers generating 5+ orders/day.
- COD remains the dominant payment method for Egyptian micro-sellers for at least 24 months post-launch.
- The Egyptian market will be the exclusive geographic focus for the first 18 months before GCC expansion.
- WhatsApp Business API will be integrated in Phase 2 (months 4–6) once the platform has CBE and Meta verification.

7.3 Out of Scope (MVP)

- Multi-language support beyond Arabic and English.
- Marketplace mode (aggregated discovery across multiple vendors).
- Native iOS or Android mobile apps (PWA is the mobile strategy for MVP).
- Online payment gateway integration (Phase 3).
- Delivery partner API integration — Bosta, J&T Egypt (Phase 2).
- AI-powered demand forecasting or chatbot (Phase 3).
- Loyalty and rewards system (Phase 3).

8. Acceptance Criteria

| ID | Feature | Acceptance Criterion |
| :--- | :--- | :--- |
| **AC-01** | Order Creation | A seller can create a manual order in <2 minutes from the dashboard; order appears immediately in the order list with 'Pending' status |
| **AC-02** | Order Status Transitions | Each status transition is logged with timestamp and actor; status cannot skip states (e.g., cannot go from Pending to Delivered without intermediate statuses) |
| **AC-03** | COD Confirmation | When order is marked 'Delivered' without confirming cash, it enters 'Pending Collection' state and appears in daily uncollected COD report |
| **AC-04** | Customer CRM | Seller can create a guest customer profile with name and phone; all future orders linked to that phone number appear in customer history |
| **AC-05** | Product Variants | Seller can create a product with 5 custom variant dimensions and 50+ combinations, each with individual pricing and stock |
| **AC-06** | Perishable Cutoff | Orders cannot be placed for a perishable product after its daily cutoff time; the product shows as 'Unavailable for Today' to the customer |
| **AC-07** | Egypt Zone Pricing | When customer enters delivery address in Aswan, the system applies the seller's configured Aswan delivery fee automatically |
| **AC-08** | InstaPay Flow | Seller can enter a transaction reference number; order status changes to 'Payment Under Review'; seller can confirm or reject the payment |
| **AC-09** | Mobile Performance | The storefront page for any vendor loads in <3 seconds when tested on Chrome DevTools 'Slow 3G' simulation |
| **AC-10** | Multi-Tenancy Isolation | A vendor cannot access, view, or modify any data belonging to another vendor — confirmed by penetration test of API endpoints |

## 9. Release Milestones

### Phase 1 — MVP (Weeks 1–10)
*Priority: P0*
Vendor registration & auth, Product CRUD with dynamic variants, Customer-facing order form, Manual order entry, Order status management, COD confirmation flow, Basic customer profiles, Store page (`yourapp.com/store-name`), Mobile-responsive UI, Basic analytics, Beta launch with 5 real sellers in Cairo.

### Phase 2 — Growth (Months 3–6)
*Priority: P1*
WhatsApp Business API notifications, Staff sub-accounts with permissions, Egypt 27-governorate delivery zone matrix, InstaPay and Fawry integration, Delivery batching by neighborhood, Full customer CRM (tags, credit, merge), Operational Profiles (Ramadan, Eid, Coptic holidays), Custom domain for Pro plan.

### Phase 3 — Scale (Months 6–18)
*Priority: P2*
Online payment gateway (Paymob/Accept), Bosta API for inter-governorate shipping, Advanced analytics with AI insights, Loyalty and rewards system, Marketplace mode (optional), Driver app for delivery staff, GCC market expansion preparation.

---

## 10. Open Questions & Risks

### 10.1 Open Questions

| ID | Question | Action Required |
| :--- | :--- | :--- |
| **OQ-01** | What is the minimum viable analytics for MVP? Basic counters only or do we need charts? | Product decision needed before Week 7 |
| **OQ-02** | Should the Starter plan support COD confirmation workflow or is it a Growth feature? | Pricing strategy alignment needed |
| **OQ-03** | Which Egyptian governorates should be pre-loaded in the delivery zone matrix at launch? | All 27 or Cairo + Alexandria first? |
| **OQ-04** | What is the WhatsApp API fallback for Phase 1 before Meta verification completes? | In-app notification only or SMS? |
| **OQ-05** | Should the platform support Fawry Accept API at MVP or manual reference confirmation only? | Technical scope for Phase 1 vs Phase 2 |

### 10.2 Risk Register

| ID | Level | Risk | Mitigation |
| :--- | :--- | :--- | :--- |
| **R-01** | HIGH | Seller adoption resistance — WhatsApp behavioral inertia | Launch with WhatsApp-friendly shareable order links; position as backend, not replacement; offer import tool |
| **R-02** | HIGH | Trial churn — no value realized in 14 days | Mandate onboarding call for all trials; target 'first order through the platform' as Day 1 activation metric |
| **R-03** | MED | CBE compliance blocking Paymob/Fawry | Launch MVP with manual InstaPay flow; begin CBE documentation process in parallel with development |
| **R-04** | MED | Performance on 3G in Upper Egypt governorates | Enforce 200KB budget; use Cloudflare Cairo PoP; test on real devices not just DevTools emulation |
| **R-05** | MED | Competitor entry from Salla or Zid expanding to Egypt | Accelerate Egypt-specific moat features (Masri UI, Governorate matrix, Fawry, InstaPay) that GCC platforms cannot replicate quickly |
| **R-06** | LOW | Egypt PDPL Law No. 151 of 2020 compliance gap | Legal review before launch; data stored in Egypt or Bahrain; explicit consent flow in order form |

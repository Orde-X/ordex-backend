# Local Commerce Management SaaS — MVP Features (Phase 1)

This document extracts all **Priority 0 (P0)** features and requirements from the PRD and SRS, defining the minimum scope for the initial platform launch in Egypt.

---

## 1. Core System Modules (MVP Scope)

### 1.1 Authentication & Multi-Tenancy
- **Vendor Registration:** Onboarding with business name (AR/EN), email, Egyptian mobile number, and unique store slug (`yourapp.com/store-name`).
- **JWT-Based Auth:** Secure login returning access and refresh tokens.
- **Complete Tenant Isolation:** Row-level security ensuring vendors can only access their own data via `vendor_id`.
- **Store Profile:** Dashboard to manage logo, banner, and store settings.

### 1.2 Product Management
- **Catalog CRUD:** Full management of products with bilingual (AR/EN) names and descriptions.
- **Dynamic Variant Builder:** Support for custom variant dimensions (size, color, etc.) with independent pricing and stock overrides.
- **Product Types:** Support for Standard, Made-to-Order, Perishable, and Digital items.
- **Image Management:** Multi-image upload integrated with Cloudflare R2 CDN for fast local delivery.
- **Custom Fields:** Dynamic text, number, and selection fields per product.

### 1.3 Order Management
- **Customer Storefront:** Public-facing, mobile-optimized ordering page at store slug URL.
- **Manual Order Entry:** Ability for sellers to create orders on behalf of WhatsApp/IG customers.
- **Order State Machine:** Automated workflow: `Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered / Cancelled`.
- **COD Confirmation:** Specific flow to confirm cash collection upon delivery (tracks "Pending Collection").
- **Audit Logging:** Immutable history of all status changes with timestamps and actors.
- **Delivery Promise:** Captured as free-text or time-slot on the order form.

### 1.4 Customer CRM
- **Guest Profiles:** Automatic creation of customer records (name, phone, address) upon first order.
- **Order Linking:** All orders automatically linked to phone numbers for historical tracking.
- **Soft Delete:** Preservation of order integrity while allowing profile management.

### 1.5 Egypt-Specific Moat
- **Governorate Matrix:** Pre-configured 27-governorate delivery zones with individual fee settings.
- **Mobile-First (3G Optimized):** 200KB initial load budget, lazy-loading, and Cairo-based PoP for low latency.
- **Progressive Web App (PWA):** Installable store shortcuts for customers on Android/iOS home screens.

### 1.6 Basic Analytics
- **Revenue Tracking:** Daily, weekly, and monthly totals in EGP.
- **Order volume:** Daily order counts with status breakdowns.

---

## 2. Mandatory Non-Functional Requirements (P0)

| Category | Requirement | Target |
| :--- | :--- | :--- |
| **Performance** | Storefront Page Load | <3 seconds on Egyptian 3G (Chrome 'Slow 3G') |
| **Security** | Data Isolation | Zero cross-tenant data leakage (Manual Penetration Tested) |
| **Data Privacy** | PDPL Compliance | All Egyptian personal data stored in Bahrain (me-south-1) or Egypt |
| **Privacy** | Explicit Consent | Arabic privacy checkbox on all order forms |
| **Reliability** | Uptime SLA | 99.5% for core storefront and order paths |

---

## 3. Core Acceptance Criteria for MVP Launch

1. **Manual Order Creation:** Seller can create a WhatsApp-sourced order in <2 minutes.
2. **Multi-Tenancy:** A vendor cannot view orders or products of another vendor via any API endpoint.
3. **PWA Installable:** Storefront provides a "Add to Home Screen" prompt on Android devices.
4. **COD Tracking:** The system distinguishes between "Delivered" and "Cash Collected" for revenue reporting.
5. **Slow-Network Loading:** Storefront remains interactive even on degraded mobile network signals.
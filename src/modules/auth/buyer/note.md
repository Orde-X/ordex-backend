# Buyer / Supplier Auth Module (Legacy/B2B)

**Important Note regarding this module:**

This module contains the authentication flow for the **B2B / Platform** operations specific to `BUYER` and `SUPPLIER` roles.

*   The end **Customers** (the users buying dynamically off the storefront via generic interfaces) are intentionally designed as **Guests** and they do NOT require an authentication system linked to this module.
*   This module is completely decoupled from the SaaS `Vendor` Auth.
*   This logic will serve as the foundation for the upcoming **V2 RFQ (Request For Quotation) Update**, where verified `BUYER` accounts will initiate the RFQ process towards suppliers.

DO NOT merge with `Vendor` Auth. DO NOT try to force typical storefront retail customers into this system!


# System Roles & Authentication Architecture Report

Based on a deep dive into the current Prisma database schema (`prisma/schema.prisma`), this report outlines the explicit mapping of identities within the Orde-X system, our recommendations for the legacy authentication logic, and how the newly built Vendor Auth module ties directly into the frontend infrastructure.

## 1. Existing System Identities and Roles
The system is currently structured as a hybrid platform that services two completely different ecosystems: a legacy **B2B ecosystem** and a new **SaaS Storefront ecosystem**.

### Ecosystem A: Platform & B2B (Legacy Auth)
These operations are governed by the `User` table, which strictly enforces access through three enum roles:
*   **`BUYER`**: A registered B2B corporate shopper.
*   **`SUPPLIER`**: A registered B2B corporate supplier with a formalized `registrationNumber`.
*   **`ADMIN`**: A platform-level administrator who manages the entire infrastructure.

### Ecosystem B: SaaS Storefront (New Architecture)
These operations are governed by two distinct relational tables tailored exclusively for an e-commerce ecosystem:
*   **`Vendor`**: A Merchant who creates a storefront (bound by a unique `storeSlug`), subscribes to billing plans, configures delivery zones, and manages products.
*   **`Customer`**: End-consumers who buy products from a specific Vendor's storefront. **Customers are explicitly scoped by `phone` and `vendorId`** to prevent data mingling across different storefronts.

> [!WARNING] 
> Crucially, `Customer` rows in the database do **not** have passwords or authentication hashes. A `Customer` is functionally a guest shopper, tracked purely by their phone number and the specific storefront they ordered from.

---

## 2. Legacy Authentication: What to do with it?
Because `User` (B2B/Admin) and `Vendor` (SaaS Merchant) operate with completely different security lifecycles, database structures, and JWT topologies:
*   **Recommendation:** Keep the legacy `User` authentication logic completely sequestered from our newly implemented `Vendor` auth module. 
*   **Justification:** Attempting to force a single login endpoint to juggle B2B Users, Platform Admins, and SaaS Vendors will compromise tenant isolation resulting in spaghetti code. Leaving them isolated allows the new Vendor logic to scale purely for the SaaS platform securely.
*   **Next Steps:** If the B2B side (Buyer/Supplier) is a deprecated concept because the business pivoted strictly to Storefronts, then we can drop the B2B tables entirely in the future. Until then, keep them parallel.

---

## 3. Frontend Mapping: Vendor Dashboard vs. Storefront
To answer your specific architectural questions directly:

### The Vendor Auth Module (For the Dashboard)
Yes! The **Vendor Auth Module** we just finished building (`/api/v1/auth/login`, `/api/v1/auth/register`, etc.) is **exclusively for the Vendor Dashboard (Web/Admin Panel)**. 
*   Merchants will use the portal to log in dynamically via RS256 JWTs.
*   The middleware (`tenantMiddleware`) will attach their unique `vendorId` to all subsequent payload requests, restricting them from seeing any products or orders other than their own.

### The Storefront APIs (For the Customer)
Yes, the Storefront APIs (which we will build soon underneath `/api/v1/storefront/...`) will serve the end customers interacting directly with the e-commerce views.
*   Because Customers do not have passwords, they will interact initially as **guests**.
*   We will likely secure their interaction using OTP (One Time Passwords) sent to their WhatsApp or SMS when they track an order or try to view previously saved addresses. 
*   Customers will NEVER touch the `/api/v1/auth/` routes we just created for Vendors.

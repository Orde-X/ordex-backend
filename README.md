# Orde-X Backend 

Orde-X is a dual-sided enterprise platform serving both as a **SaaS e-commerce builder** for merchants (Vendors) to host storefronts, and a **B2B marketplace** for bulk wholesale purchasing (Buyers/Suppliers). 

This repository contains the monolithic backend architecture that powers the platform, strictly separating domain logic, multi-tenant data, and differing authentication flows.

##  Tech Stack

*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** Asymmetric RS256 JWTs with rolling refresh tokens
*   **Validation:** Zod
*   **Caching & Queues:** Redis (via `ioredis`) / BullMQ
*   **Documentation:** Swagger / OpenAPI

##  Architecture & Domains

The platform securely hosts two completely isolated ecosystems:

### 1. SaaS Storefront (The "Vendor" Side)
*   **Vendors:** Merchants who subscribe to plans to create stores matching a specific `slug`. 
*   **Customers:** Retail shoppers interacting with a singular vendor's storefront. They do **not** use the authentication system and exist basically as guests tied uniquely to the specific vendor's ID.
*   **Authentication Location:** `/api/v1/auth/vendor/` 
*   **Security Principle:** Strictly isolated via Custom Tenant Middlewares enforcing `req.vendorId`.

### 2. B2B Wholesale (The "Legacy" Side)
*   **Buyers & Suppliers:** Verified corporate entities handling bulk purchases.
*   **Future Development:** This forms the core logic for the V2 features like **RFQ (Request for Quotation)** generation.
*   **Authentication Location:** `/api/v1/auth/buyer/`

> **Note:** The core principle of Orde-X is that the SaaS users and B2B users must never share state, logic, or scopes. Their respective modules are functionally distinct.

##  Getting Started

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   Redis server (Running on default port `6379`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and populate it according to `.env.example`. 

You also must generate the secure RSA 2048 keys for the JWT signatures:
```bash
node scripts/generate_keys.js
```
*This will automatically append `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in base64 format into your `.env` file.*

### 3. Database Setup
Ensure PostgreSQL is running locally, apply the Prisma schema migrations, and generate the client footprint.
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Running the Project

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

## API Documentation (Swagger)

A fully structured OpenAPI endpoint is available upon successful deployment.

Visit `http://localhost:5000/api-docs` to access the interactive **Swagger UI** containing all available schemas, JWT interactions, and endpoints for both Vendor and Buyer workflows.

You can also utilize the highly comprehensive `postman-collection.json` located at the root of the repository for quick team onboarding!

---
*Built for scale. Maintained with ❤️ by the Orde-X Team.*

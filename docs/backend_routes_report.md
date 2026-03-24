# Backend Routes Report: Orde-X B2B Marketplace

Based on the frontend application structure, here is a detailed breakdown of the required backend architecture and API routes to support the B2B marketplace features (Buyers, Suppliers, RFQs, Products, and Quotes).

## 1. Authentication & Authorization (`/api/auth`)
The platform has two primary user roles: **Buyer** and **Supplier**. It is recommended to use JWT for stateless authentication.

*   `POST /api/auth/register`
    *   **Body**: `{ email, password, role: "BUYER" | "SUPPLIER", name, companyName }`
    *   **Description**: Registers a new user.
*   `POST /api/auth/login`
    *   **Body**: `{ email, password }`
    *   **Response**: `{ token, user: { id, role, name, ... } }`
    *   **Description**: Authenticates user and returns JWT.
*   `GET /api/auth/me`
    *   **Header**: `Authorization: Bearer <token>`
    *   **Description**: Returns the current authenticated user's profile.

## 2. Request for Quotation (RFQ) Module (`/api/rfqs`)
This is the core feature for buyers to source products globally and locally.

*   `POST /api/rfqs`
    *   **Auth**: Required (Buyer only)
    *   **Body**: `{ productName, category, quantity, unit, specifications, timeline, budget, deliveryLocation, requireCertifications, preferredCountries, additionalRequirements, contactDetails }`
    *   **Description**: Creates a new RFQ.
*   `GET /api/rfqs`
    *   **Auth**: Required
    *   **Query**: `?status=active&page=1`
    *   **Description**: For Buyers: lists their own RFQs. For Suppliers: lists all public RFQs matching their categories.
*   `GET /api/rfqs/:id`
    *   **Description**: Gets details of a specific RFQ.
*   `PATCH /api/rfqs/:id/status`
    *   **Auth**: Required (Buyer only)
    *   **Body**: `{ status: "ACTIVE" | "IN_REVIEW" | "CLOSED" }`
    *   **Description**: Updates the status of an RFQ.

## 3. Quoting System (`/api/quotes`)
Suppliers respond to RFQs by submitting quotes.

*   `POST /api/rfqs/:id/quotes`
    *   **Auth**: Required (Supplier only)
    *   **Body**: `{ price, deliveryTime, terms, remarks, validityDate }`
    *   **Description**: Submits a quote bid for an active RFQ.
*   `GET /api/rfqs/:id/quotes`
    *   **Auth**: Required (Buyer owner only)
    *   **Description**: Lists all received quotes for a specific RFQ.
*   `PATCH /api/quotes/:id/accept`
    *   **Auth**: Required (Buyer only)
    *   **Description**: Accepts a specific quote and automatically closes the RFQ.

## 4. Product Catalog (`/api/products`)
For the marketplace browsing experience.

*   `GET /api/products`
    *   **Query**: `?category=electronics&search=pump&page=1`
    *   **Description**: Public route to browse active products in the marketplace.
*   `GET /api/products/:id`
    *   **Description**: Retrieves single product details.
*   `POST /api/products`
    *   **Auth**: Required (Supplier only)
    *   **Body**: `{ name, description, category, priceRange, minOrderQuantity, images[] }`
    *   **Description**: Allows a supplier to list a new product.
*   `GET /api/categories`
    *   **Description**: Returns the category tree for navigation and filtering.

## 5. Supplier Directory & Networking (`/api/suppliers`)
 Buyers need to discover, evaluate, and save suppliers.

*   `GET /api/suppliers`
    *   **Description**: Public directory of active, verified suppliers.
*   `GET /api/suppliers/:id`
    *   **Description**: Supplier public profile (matches `/supplier/[id]` on frontend).
*   `POST /api/buyers/saved-suppliers/:supplierId`
    *   **Auth**: Required (Buyer only)
    *   **Description**: Toggles saving/favoriting a supplier to the buyer's dashboard.

## Suggested Tech Stack & Next Steps
*   **Framework**: NestJS or Express (Node.js) / FastAPI (Python). Since your frontend is Next.js, deploying a NestJS backend provides high type-safety across the monorepo via tRPC or shared TS interfaces.
*   **Database**: PostgreSQL via Prisma ORM (ideal for relational entities like RFQ -> Quotes -> Suppliers).
*   **Storage**: AWS S3 or Cloudflare R2 for Product Images and RFQ specification document attachments.

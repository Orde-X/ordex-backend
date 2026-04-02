/**
 * @swagger
 * tags:
 *   name: Auth (Vendor)
 *   description: Vendor Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth (Vendor)]
 *     summary: Register a new vendor and automatically seed their initial delivery zones
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_name_ar
 *               - email
 *               - phone
 *               - password
 *               - store_slug
 *             properties:
 *               business_name_ar:
 *                 type: string
 *                 example: متجر أوركس
 *               business_name_en:
 *                 type: string
 *                 example: Ordex Store
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ordex.com
 *               phone:
 *                 type: string
 *                 description: Egyptian phone number format
 *                 example: "01012345678"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *               store_slug:
 *                 type: string
 *                 description: Unique, lowercase alphanumeric and hyphens, 3-50 chars
 *                 example: my-super-store
 *     responses:
 *       201:
 *         description: Successfully created, returns vendor and access token
 *       400:
 *         description: Validation or unique constraint errors (e.g. store_slug/email in use)
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth (Vendor)]
 *     summary: Vendor Login
 *     security: []
 *     description: Authenticates the vendor and sets a refresh_token in an httpOnly cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ordex.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth (Vendor)]
 *     summary: Rotate refresh token
 *     security: []
 *     description: Reads refresh_token from cookies, validates against DB hash, issues new pair
 *     responses:
 *       200:
 *         description: Returned new access token
 *       401:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid/reused refresh session
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth (Vendor)]
 *     summary: Logout vendor and invalidate session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth (Vendor)]
 *     summary: Get current authenticated vendor's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile data
 */

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     tags: [Auth (Vendor)]
 *     summary: Update vendor profile properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_name_ar:
 *                 type: string
 *               business_name_en:
 *                 type: string
 *               logo_url:
 *                 type: string
 *                 format: uri
 *               banner_url:
 *                 type: string
 *                 format: uri
 *               settings:
 *                 type: object
 *                 description: JSONB settings object
 *     responses:
 *       200:
 *         description: Profile updated
 */

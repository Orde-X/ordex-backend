/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - nameAr
 *         - basePrice
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         nameAr:
 *           type: string
 *           maxLength: 300
 *         nameEn:
 *           type: string
 *           maxLength: 300
 *         descriptionAr:
 *           type: string
 *         descriptionEn:
 *           type: string
 *         productType:
 *           type: string
 *           enum: [standard, made_to_order, perishable, digital]
 *         basePrice:
 *           type: string
 *         isActive:
 *           type: boolean
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: url
 *         customFields:
 *           type: object
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         combination:
 *           type: object
 *           description: Generic JSON object mapping variation names to values (e.g., size: L)
 *         priceOverride:
 *           type: string
 *         stock:
 *           type: integer
 *         sku:
 *           type: string
 * 
 * /api/v1/products:
 *   get:
 *     summary: List vendor products (Paginated)
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create a new product
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *       402:
 *         description: Plan limit reached
 *
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product detail
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product data
 *   patch:
 *     summary: Update product
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *   delete:
 *     summary: Soft delete product
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product soft-deleted
 *
 * /api/v1/products/{id}/variants:
 *   post:
 *     summary: Upsert variant matrix
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variants:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       200:
 *         description: Variants updated
 *
 * /api/v1/products/upload-image/{productId}:
 *   post:
 *     summary: Upload product image to Cloudinary
 *     tags: [Vendor Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 */

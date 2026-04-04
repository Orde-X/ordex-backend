/**
 * @swagger
 * /api/v1/storefront/{slug}/products:
 *   get:
 *     summary: Public storefront product listing (Cached)
 *     tags: [Storefront]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of products for the storefront
 */

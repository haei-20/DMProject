const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, isAdmin, optionalAuth, isUser } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách sản phẩm
 *   post:
 *     tags: [Products, Admin]
 *     summary: Tạo sản phẩm mới
 *     security:
 *       - BearerAuth: []
 * /api/products/featured:
 *   get:
 *     tags: [Products, Recommendations]
 *     summary: Lấy sản phẩm nổi bật
 * /api/products/counts-by-category:
 *   get:
 *     tags: [Products]
 *     summary: Đếm sản phẩm theo danh mục
 * /api/products/deal-hot:
 *   get:
 *     tags: [Products]
 *     summary: Lấy sản phẩm Deal Hot
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi hệ thống
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy chi tiết sản phẩm
 *   put:
 *     tags: [Products, Admin]
 *     summary: Cập nhật sản phẩm
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Products, Admin]
 *     summary: Xóa sản phẩm
 *     security:
 *       - BearerAuth: []
 * /api/products/{id}/reviews:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách review sản phẩm
 *   post:
 *     tags: [Products]
 *     summary: Thêm review sản phẩm
 *     security:
 *       - BearerAuth: []
 * /api/products/{id}/related:
 *   get:
 *     tags: [Products, Recommendations]
 *     summary: Lấy sản phẩm liên quan
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi hệ thống
 * /api/products/{productId}/reviews/{reviewId}:
 *   delete:
 *     tags: [Products]
 *     summary: Xóa review sản phẩm
 *     security:
 *       - BearerAuth: []
 */

// Public routes
router.get("/", productController.getProducts);
router.get("/featured", optionalAuth, productController.getFeaturedProducts);
router.get("/counts-by-category", productController.getProductCountsByCategory);
router.get("/deal-hot", productController.getDealHot);
router.get("/:id", productController.getProductById);
router.get("/:id/reviews", productController.getProductReviews);
router.get("/:id/related", productController.getRelatedProducts);

// Protected routes - Authentication required
router.post("/:id/reviews", protect, productController.addProductReview);
router.delete("/:productId/reviews/:reviewId", protect, productController.deleteProductReview);

// Admin routes
router.post("/", protect, isAdmin, productController.createProduct);
router.put("/:id", protect, isAdmin, productController.updateProduct);
router.delete("/:id", protect, isAdmin, productController.deleteProduct);

module.exports = router;

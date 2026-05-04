const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/metrics/track/impression:
 *   post:
 *     tags: [Metrics]
 *     summary: Ghi nhận lượt hiển thị recommendation
 * /api/metrics/track/click:
 *   post:
 *     tags: [Metrics]
 *     summary: Ghi nhận lượt click recommendation
 * /api/metrics/track/add-to-cart:
 *   post:
 *     tags: [Metrics]
 *     summary: Ghi nhận thêm vào giỏ từ recommendation
 * /api/metrics/track/purchase:
 *   post:
 *     tags: [Metrics]
 *     summary: Ghi nhận mua hàng từ recommendation
 * /api/metrics/ctr:
 *   get:
 *     tags: [Metrics, Admin]
 *     summary: Lấy CTR của recommendation
 *     security:
 *       - BearerAuth: []
 * /api/metrics/cart-rate:
 *   get:
 *     tags: [Metrics, Admin]
 *     summary: Lấy tỷ lệ thêm giỏ
 *     security:
 *       - BearerAuth: []
 * /api/metrics/conversion-rate:
 *   get:
 *     tags: [Metrics, Admin]
 *     summary: Lấy tỷ lệ chuyển đổi
 *     security:
 *       - BearerAuth: []
 * /api/metrics/cart-growth:
 *   get:
 *     tags: [Metrics, Admin]
 *     summary: Lấy tăng trưởng giỏ hàng
 *     security:
 *       - BearerAuth: []
 * /api/metrics/all:
 *   get:
 *     tags: [Metrics, Admin]
 *     summary: Lấy toàn bộ metrics recommendation
 *     security:
 *       - BearerAuth: []
 */

// Tracking routes (public for client-side tracking)
router.post("/track/impression", metricsController.trackImpression);
router.post("/track/click", metricsController.trackClick);
router.post("/track/add-to-cart", metricsController.trackAddToCart);
router.post("/track/purchase", metricsController.trackPurchase);

// Metrics routes (admin only)
router.get("/ctr", protect, isAdmin, metricsController.getClickThroughRate);
router.get("/cart-rate", protect, isAdmin, metricsController.getCartAdditionRate);
router.get("/conversion-rate", protect, isAdmin, metricsController.getConversionRate);
router.get("/cart-growth", protect, isAdmin, metricsController.getAverageCartGrowth);
router.get("/all", protect, isAdmin, metricsController.getAllMetrics);

module.exports = router; 
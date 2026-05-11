const express = require("express");
const {
  trackUserBehavior,
  getRecommendations,
  getPopularProducts,
  getRelatedProducts,
  getCartSuggestions,
  getProductAnalytics,
  getUserAnalytics,
  getOrderAnalytics
} = require("../controllers/analyticsController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/analytics/track:
 *   post:
 *     tags: [Analytics]
 *     summary: Ghi nhận hành vi người dùng
 *     security:
 *       - BearerAuth: []
 * /api/analytics/recommendations:
 *   get:
 *     tags: [Analytics]
 *     summary: Lấy gợi ý sản phẩm theo hành vi
 *     security:
 *       - BearerAuth: []
 * /api/analytics/popular:
 *   get:
 *     tags: [Analytics]
 *     summary: Lấy sản phẩm phổ biến
 * /api/analytics/related/{productId}:
 *   get:
 *     tags: [Analytics]
 *     summary: Lấy sản phẩm liên quan theo productId
 * /api/analytics/products:
 *   get:
 *     tags: [Analytics, Admin]
 *     summary: Phân tích sản phẩm cho dashboard admin
 *     security:
 *       - BearerAuth: []
 * /api/analytics/users:
 *   get:
 *     tags: [Analytics, Admin]
 *     summary: Phân tích người dùng cho dashboard admin
 *     security:
 *       - BearerAuth: []
 * /api/analytics/orders:
 *   get:
 *     tags: [Analytics, Admin]
 *     summary: Phân tích đơn hàng cho dashboard admin
 *     security:
 *       - BearerAuth: []
 */

// @desc    Ghi nhận hành vi người dùng
// @route   POST /api/analytics/track
// @access  Private
router.post("/track", protect, trackUserBehavior);

// @desc    Lấy sản phẩm đề xuất cho người dùng
// @route   GET /api/analytics/recommendations
// @access  Private
router.get("/recommendations", protect, getRecommendations);

// @desc    Lấy sản phẩm phổ biến
// @route   GET /api/analytics/popular
// @access  Public
router.get("/popular", getPopularProducts);

// @desc    Lấy sản phẩm liên quan
// @route   GET /api/analytics/related/:productId
// @access  Public
router.get("/related/:productId", getRelatedProducts);

// @desc    Gợi ý sản phẩm theo id trong giỏ (pair rules + FP-Growth cache)
// @route   GET /api/analytics/cart-suggestions
// @access  Public
router.get("/cart-suggestions", getCartSuggestions);

// @desc    Lấy phân tích sản phẩm cho admin dashboard
// @route   GET /api/analytics/products
// @access  Private/Admin
router.get("/products", protect, isAdmin, getProductAnalytics);

// @desc    Lấy phân tích người dùng cho admin dashboard
// @route   GET /api/analytics/users
// @access  Private/Admin
router.get("/users", protect, isAdmin, getUserAnalytics);

// @desc    Lấy phân tích đơn hàng cho admin dashboard
// @route   GET /api/analytics/orders
// @access  Private/Admin
router.get("/orders", protect, isAdmin, getOrderAnalytics);

module.exports = router; 
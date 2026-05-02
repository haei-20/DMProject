const express = require("express");
const {
  trackUserBehavior,
  getRecommendations,
  getPopularProducts,
  getRelatedProducts,
  getProductAnalytics,
  getUserAnalytics,
  getOrderAnalytics
} = require("../controllers/analyticsController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

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
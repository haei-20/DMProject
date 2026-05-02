const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metricsController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

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
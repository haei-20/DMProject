const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { protect, isAdmin, optionalAuth } = require("../middlewares/authMiddleware");

// Public routes
router.get("/public", couponController.getPublicCoupons);
router.get("/code/:code", couponController.getCouponByCode);
router.post("/validate", couponController.validateCoupon);

// Admin routes
router.get("/", protect, isAdmin, couponController.getAllCoupons);
router.post("/", protect, isAdmin, couponController.createCoupon);
router.put("/:id", protect, isAdmin, couponController.updateCoupon);
router.delete("/:id", protect, isAdmin, couponController.deleteCoupon);

module.exports = router; 
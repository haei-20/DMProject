const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { protect, isAdmin, optionalAuth } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/coupons/public:
 *   get:
 *     tags: [Coupons]
 *     summary: Lấy danh sách coupon công khai
 * /api/coupons/code/{code}:
 *   get:
 *     tags: [Coupons]
 *     summary: Lấy coupon theo mã
 * /api/coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Kiểm tra coupon hợp lệ
 * /api/coupons:
 *   get:
 *     tags: [Coupons, Admin]
 *     summary: Lấy tất cả coupon (admin)
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Coupons, Admin]
 *     summary: Tạo coupon mới (admin)
 *     security:
 *       - BearerAuth: []
 * /api/coupons/{id}:
 *   put:
 *     tags: [Coupons, Admin]
 *     summary: Cập nhật coupon (admin)
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Coupons, Admin]
 *     summary: Xóa coupon (admin)
 *     security:
 *       - BearerAuth: []
 */

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
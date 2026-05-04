const express = require("express");
const router = express.Router();
const newsletterController = require("../controllers/newsletterController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     tags: [Newsletter]
 *     summary: Đăng ký nhận bản tin
 * /api/newsletter/unsubscribe/{token}:
 *   get:
 *     tags: [Newsletter]
 *     summary: Hủy đăng ký bản tin
 * /api/newsletter/preferences/{token}:
 *   post:
 *     tags: [Newsletter]
 *     summary: Cập nhật tùy chọn nhận bản tin
 * /api/newsletter:
 *   get:
 *     tags: [Newsletter, Admin]
 *     summary: Lấy danh sách subscriber
 *     security:
 *       - BearerAuth: []
 * /api/newsletter/active:
 *   get:
 *     tags: [Newsletter, Admin]
 *     summary: Lấy danh sách subscriber đang hoạt động
 *     security:
 *       - BearerAuth: []
 * /api/newsletter/{id}:
 *   delete:
 *     tags: [Newsletter, Admin]
 *     summary: Xóa subscriber
 *     security:
 *       - BearerAuth: []
 */

// Public routes
router.post("/subscribe", newsletterController.subscribe);
router.get("/unsubscribe/:token", newsletterController.unsubscribe);
router.post("/preferences/:token", newsletterController.updatePreferences);

// Admin routes
router.get("/", protect, isAdmin, newsletterController.getAllSubscribers);
router.get("/active", protect, isAdmin, newsletterController.getActiveSubscribers);
router.delete("/:id", protect, isAdmin, newsletterController.deleteSubscriber);

module.exports = router; 
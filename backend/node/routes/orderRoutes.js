const express = require("express");
const { 
  createOrder, 
  getOrderById, 
  getMyOrders, 
  getAllOrders, 
  updateOrderStatus,
  getGuestOrder
} = require("../controllers/orderController");

const { protect, isAdmin, optionalAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn hàng (user hoặc guest)
 *   get:
 *     tags: [Orders, Admin]
 *     summary: Lấy tất cả đơn hàng (admin)
 *     security:
 *       - BearerAuth: []
 * /api/orders/myorders:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy đơn hàng của người dùng hiện tại
 *     security:
 *       - BearerAuth: []
 * /api/orders/guest/{id}/{email}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy đơn hàng của khách
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Lấy chi tiết đơn hàng theo ID
 *     security:
 *       - BearerAuth: []
 * /api/orders/{id}/status:
 *   put:
 *     tags: [Orders, Admin]
 *     summary: Cập nhật trạng thái đơn hàng
 *     security:
 *       - BearerAuth: []
 */

// Tạo đơn hàng - cập nhật để cho phép khách đặt hàng
router.post("/", optionalAuth, createOrder);

// Lấy danh sách đơn hàng của người dùng (lịch sử mua hàng)
router.get("/myorders", protect, getMyOrders);

// Lấy đơn hàng của khách (không cần đăng nhập) - Route này phải đặt trước route "/:id"
router.get("/guest/:id/:email", getGuestOrder);

// Lấy đơn hàng theo ID
router.get("/:id", protect, getOrderById);

// Lấy tất cả đơn hàng (chỉ Admin mới có quyền)
router.get("/", protect, isAdmin, getAllOrders);

// Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

module.exports = router;

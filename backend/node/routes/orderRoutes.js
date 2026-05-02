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

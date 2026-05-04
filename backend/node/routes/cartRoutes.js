const express = require("express");
const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    mergeGuestCart
} = require("../controllers/cartController");
const { protect, optionalAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Lấy giỏ hàng hiện tại
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi hệ thống
 * /api/cart/add:
 *   post:
 *     tags: [Cart]
 *     summary: Thêm sản phẩm vào giỏ
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 * /api/cart/remove:
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa sản phẩm khỏi giỏ
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 * /api/cart/update:
 *   put:
 *     tags: [Cart]
 *     summary: Cập nhật số lượng sản phẩm trong giỏ
 *     responses:
 *       200:
 *         description: Thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi hệ thống
 * /api/cart/clear:
 *   delete:
 *     tags: [Cart]
 *     summary: Xóa toàn bộ giỏ hàng
 *     responses:
 *       200:
 *         description: Thành công
 *       500:
 *         description: Lỗi hệ thống
 * /api/cart/merge:
 *   post:
 *     tags: [Cart]
 *     summary: Gộp giỏ khách vào tài khoản đăng nhập
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa đăng nhập
 *       500:
 *         description: Lỗi hệ thống
 */
  
router.post("/add", optionalAuth, addToCart);
router.get("/", optionalAuth, getCart);
router.delete("/remove", optionalAuth, removeFromCart);
router.put("/update", optionalAuth, updateCartItem);
router.delete("/clear", optionalAuth, clearCart);
router.post("/merge", protect, mergeGuestCart);
  
module.exports = router;
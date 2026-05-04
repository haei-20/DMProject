const express = require("express");
const {
  registerUser,
  verifyOTP,
  resendOTP,
  authUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  trackProductView
} = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: Đăng ký tài khoản
 * /api/users/verify-otp:
 *   post:
 *     tags: [Users]
 *     summary: Xác thực OTP
 * /api/users/resend-otp:
 *   post:
 *     tags: [Users]
 *     summary: Gửi lại OTP
 * /api/users/login:
 *   post:
 *     tags: [Users]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Lấy hồ sơ người dùng
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật hồ sơ người dùng
 *     security:
 *       - BearerAuth: []
 * /api/users/forgot-password:
 *   post:
 *     tags: [Users]
 *     summary: Gửi yêu cầu quên mật khẩu
 * /api/users/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Đặt lại mật khẩu
 * /api/users/wishlist:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách yêu thích
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Users]
 *     summary: Thêm sản phẩm vào yêu thích
 *     security:
 *       - BearerAuth: []
 * /api/users/wishlist/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Xóa sản phẩm khỏi yêu thích
 *     security:
 *       - BearerAuth: []
 * /api/users/track-view:
 *   post:
 *     tags: [Users]
 *     summary: Ghi nhận xem sản phẩm
 *     security:
 *       - BearerAuth: []
 */
// @desc    Đăng ký tài khoản + gửi OTP
// @route   POST /api/users/register
// @access  Public
router.post("/register", registerUser);

// @desc    Xác thực OTP
// @route   POST /api/users/verify-otp
// @access  Public
router.post("/verify-otp", verifyOTP);

// @desc    Gửi lại OTP
// @route   POST /api/users/resend-otp
// @access  Public
router.post("/resend-otp", resendOTP);

// @desc    Đăng nhập
// @route   POST /api/users/login
// @access  Public
router.post("/login", authUser);

// @desc    Lấy thông tin cá nhân
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, getUserProfile);

// @desc    Cập nhật hồ sơ cá nhân
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, updateUserProfile);

// @desc    Quên mật khẩu - Gửi OTP đặt lại mật khẩu
// @route   POST /api/users/forgot-password
// @access  Public
router.post("/forgot-password", forgotPassword);

// @desc    Đặt lại mật khẩu bằng OTP/token
// @route   POST /api/users/reset-password
// @access  Public
router.post("/reset-password", resetPassword);

// @desc    Thêm sản phẩm vào danh sách yêu thích
// @route   POST /api/users/wishlist
// @access  Private
router.post("/wishlist", protect, addToWishlist);

// @desc    Xóa sản phẩm khỏi danh sách yêu thích
// @route   DELETE /api/users/wishlist/:id
// @access  Private
router.delete("/wishlist/:id", protect, removeFromWishlist);

// @desc    Lấy danh sách yêu thích
// @route   GET /api/users/wishlist
// @access  Private
router.get("/wishlist", protect, getWishlist);

// @desc    Ghi nhận xem sản phẩm
// @route   POST /api/users/track-view
// @access  Private
router.post("/track-view", protect, trackProductView);

module.exports = router;


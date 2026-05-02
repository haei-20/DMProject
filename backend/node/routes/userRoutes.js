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


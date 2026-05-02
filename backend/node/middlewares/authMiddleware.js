const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware kiểm tra token JWT
 * Bắt buộc đăng nhập để truy cập route
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Lấy token từ header

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Giải mã token
      req.user = await User.findById(decoded.id).select("-password"); // Lưu thông tin user vào request

      if (!req.user) {
        return res.status(401).json({ message: "Không tìm thấy người dùng" });
      }

      next();
    } catch (error) {
      console.error("Token error:", error);
      res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  } else {
    res.status(401).json({ message: "Không có token, quyền truy cập bị từ chối" });
  }
};

/**
 * Middleware cho phép người dùng không đăng nhập (khách) truy cập route
 * Nếu đã đăng nhập, thêm thông tin người dùng vào req
 * Nếu chưa đăng nhập, tiếp tục xử lý mà không có thông tin người dùng
 */
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      
      // Nếu không tìm thấy người dùng, coi như khách
      if (!req.user) {
        console.log("Không tìm thấy người dùng, tiếp tục xử lý như khách");
      }
    } catch (error) {
      // Nếu token không hợp lệ, tiếp tục xử lý mà không có thông tin người dùng
      console.log("Token không hợp lệ, tiếp tục xử lý như khách:", error.message);
    }
  }
  
  next();
};

/**
 * Middleware kiểm tra vai trò admin
 * Phải sử dụng sau middleware protect
 */
exports.isAdmin = (req, res, next) => {
  // Add debugging to help troubleshoot
  console.log("User role check:", req.user ? req.user.role : "No user found");
  
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Không có quyền truy cập, yêu cầu quyền quản trị viên" });
  }
};

/**
 * Middleware cho phép cả admin và người dùng thông thường
 * Khách (chưa đăng nhập) không được truy cập
 */
exports.isUser = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(403).json({ message: "Yêu cầu đăng nhập" });
  }
};
  


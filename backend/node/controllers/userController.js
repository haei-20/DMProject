const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    
    // Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log("Creating new user with email:", email);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      verificationToken,
      otp,
      otpExpires,
      isVerified: false,
      role: "user"
    });

    console.log("User created successfully:", user._id);

    if (user) {
      const emailMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #333;">Chào mừng đến với 2NADH!</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; color: #666;">Xin chào ${name},</p>
            <p style="margin: 10px 0; color: #666;">Cảm ơn bạn đã đăng ký tài khoản tại 2NADH.</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: bold; color: #2e7d32;">Mã xác thực của bạn:</p>
            <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #2e7d32; text-align: center;">${otp}</p>
            <p style="margin: 0; font-size: 12px; color: #666; text-align: center;">(Mã này sẽ hết hạn sau 10 phút)</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <p style="margin: 0; color: #666;">Vui lòng sử dụng mã trên để hoàn tất quá trình đăng ký tài khoản của bạn.</p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0;">Đây là email tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `;
      
      try {
        console.log("Sending verification email to:", email);
        await sendEmail(email, "Xác thực tài khoản 2NADH", emailMessage);
        console.log("Verification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Không trả về lỗi, vẫn cho phép người dùng đăng ký thành công
        // Người dùng có thể yêu cầu gửi lại OTP sau
      }
      
      res.status(201).json({
        message: "Tài khoản được tạo. Kiểm tra email để nhận OTP.",
        userId: user._id,
      });
    } else {
      console.error("Failed to create user");
      res.status(400).json({ message: "Lỗi khi tạo tài khoản" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};

// @desc    Verify user account with OTP
// @route   POST /api/users/verify
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "Người dùng không tồn tại" });

    if (user.otp !== otp) {
      return res.status(400).json({ message: "OTP không hợp lệ" });
    }
    
    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    // Update verification status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.verificationToken = undefined;
    await user.save();

    res.json({
      message: "Xác thực thành công!",
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/users/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });
    
    if (user.isVerified) {
      return res.status(400).json({ message: "Tài khoản đã được xác thực" });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    await sendEmail(email, "Xác thực tài khoản", `Mã OTP xác thực tài khoản của bạn: ${otp}`);
    
    res.json({
      message: "OTP xác thực mới đã được gửi đến email của bạn",
      userId: user._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
exports.authUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Compare password
    const isPasswordCorrect = await user.matchPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Tài khoản chưa xác thực. Vui lòng kiểm tra email." });
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    address: req.user.address,
    isVerified: req.user.isVerified,
    avatar: req.user.avatar,
    createdAt: req.user.createdAt
  });
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.address) {
      user.address = {
        street: req.body.address.street || user.address?.street,
        city: req.body.address.city || user.address?.city,
        state: req.body.address.state || user.address?.state,
        zipCode: req.body.address.zipCode || user.address?.zipCode,
        country: req.body.address.country || user.address?.country || "Vietnam",
      };
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      address: updatedUser.address,
      isVerified: updatedUser.isVerified,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email không được để trống" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    // Generate simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log the generated OTP for debugging
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    // Store plaintext OTP in user document
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Clear previous reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetInProgress = true;
    
    await user.save();
    
    console.log(`User after saving OTP:`, {
      id: user._id,
      email: user.email,
      otp: user.otp,
      otpExpires: user.otpExpires
    });
    
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Đặt lại mật khẩu 2NADH</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #666;">Xin chào ${user.name},</p>
          <p style="margin: 10px 0; color: #666;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        </div>
        
        <div style="background-color: #ffeaea; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: #c62828;">Mã đặt lại mật khẩu của bạn:</p>
          <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #c62828; text-align: center;">${otp}</p>
          <p style="margin: 0; font-size: 12px; color: #666; text-align: center;">(Mã này sẽ hết hạn sau 10 phút)</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
          <p style="margin: 0; color: #666;">Vui lòng sử dụng mã trên để đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p style="margin: 10px 0; color: #666;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ.</p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `;
    
    await sendEmail(email, "Đặt lại mật khẩu 2NADH", emailMessage);

    res.json({ 
      message: "Mã OTP đặt lại mật khẩu đã được gửi qua email",
      email: email
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Log received data for debugging
    console.log("Password reset attempt:", { 
      email, 
      token: token,
      tokenLength: token?.length 
    });

    // Validate input
    if (!email || !token || !newPassword) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp đầy đủ thông tin",
        details: {
          email: email ? undefined : "Email không được để trống",
          token: token ? undefined : "Mã OTP không được để trống",
          newPassword: newPassword ? undefined : "Mật khẩu mới không được để trống"
        }
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    // Find user with matching email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    // Log data for debugging
    console.log("User data for reset:", {
      id: user._id,
      email: user.email,
      storedOTP: user.otp,
      otpExpires: user.otpExpires ? new Date(user.otpExpires).toLocaleString() : null,
      passwordResetInProgress: user.passwordResetInProgress,
      currentTime: new Date().toLocaleString()
    });

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({ message: "Chưa có mã OTP hoặc mã đã hết hạn" });
    }

    // Check if OTP has expired
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới" });
    }

    // Compare provided token with stored OTP (with debug logging)
    const providedToken = String(token).trim();
    const storedOTP = String(user.otp).trim();
    
    console.log("OTP comparison:", {
      provided: providedToken,
      stored: storedOTP,
      match: providedToken === storedOTP
    });

    if (providedToken !== storedOTP) {
      return res.status(400).json({ message: "Mã OTP không hợp lệ" });
    }

    // Set new password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetInProgress = undefined;

    await user.save();

    // Send confirmation email
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Mật khẩu đã được đặt lại</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #666;">Xin chào ${user.name},</p>
          <p style="margin: 10px 0; color: #666;">Mật khẩu của tài khoản 2NADH của bạn đã được đặt lại thành công.</p>
        </div>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px;">
          <p style="margin: 0; color: #2e7d32;">Bạn có thể đăng nhập với mật khẩu mới của bạn ngay bây giờ.</p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">Nếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
          <p style="margin: 5px 0;">Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    `;
    
    await sendEmail(email, "Mật khẩu đã được đặt lại - 2NADH", emailMessage);

    res.json({ 
      message: "Mật khẩu đã được đặt lại thành công",
      success: true
    });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/users/wishlist
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  
  // Check if product already in wishlist
  if (user.wishlist.includes(productId)) {
    return res.status(400).json({ message: "Sản phẩm đã có trong danh sách yêu thích" });
  }
  
  // Add to wishlist
  user.wishlist.push(productId);
  await user.save();
  
  res.json({
    message: "Đã thêm sản phẩm vào danh sách yêu thích",
    wishlist: user.wishlist
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  
  // Remove from wishlist
  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();
  
  res.json({
    message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
    wishlist: user.wishlist
  });
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  
  res.json(user.wishlist);
});

// @desc    Track product view
// @route   POST /api/users/track-view
// @access  Private
exports.trackProductView = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ message: "Không có quyền truy cập" });
  }
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }
  
  // Add product view or update view time if already viewed
  const existingView = user.viewedProducts.find(
    item => item.productId.toString() === productId
  );
  
  if (existingView) {
    // Update view time if already viewed
    existingView.viewedAt = Date.now();
  } else {
    // Add new product view
    user.viewedProducts.push({
      productId,
      viewedAt: Date.now()
    });
  }
  
  await user.save();
  
  res.json({ message: "Đã ghi nhận lượt xem sản phẩm" });
});
  
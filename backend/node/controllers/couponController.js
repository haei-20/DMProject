const Coupon = require("../models/Coupon");
const Order = require("../models/Order");

// Get all coupons (Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách mã giảm giá", 
      error: error.message 
    });
  }
};

// Get public coupons (All users)
exports.getPublicCoupons = async (req, res) => {
  try {
    const now = new Date();
    
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { usageLimit: { $gt: "$usedCount" } }
      ]
    }).select('code description discountType discountValue minOrderValue validUntil');
    
    res.json(coupons);
  } catch (error) {
    console.error("Error fetching public coupons:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách mã giảm giá", 
      error: error.message 
    });
  }
};

// Get coupon by code
exports.getCouponByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ 
        message: "Mã giảm giá không tồn tại", 
        success: false 
      });
    }
    
    if (!coupon.isValid()) {
      return res.status(400).json({ 
        message: "Mã giảm giá đã hết hạn hoặc không còn hiệu lực", 
        success: false 
      });
    }
    
    res.json({
      coupon,
      success: true
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thông tin mã giảm giá", 
      error: error.message,
      success: false
    });
  }
};

// Validate coupon and calculate discount
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, items } = req.body;
    
    if (!code || !orderTotal) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp mã giảm giá và tổng giá trị đơn hàng", 
        success: false 
      });
    }
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({ 
        message: "Mã giảm giá không tồn tại", 
        success: false 
      });
    }
    
    if (!coupon.isValid()) {
      return res.status(400).json({ 
        message: "Mã giảm giá đã hết hạn hoặc không còn hiệu lực", 
        success: false 
      });
    }
    
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ 
        message: `Giá trị đơn hàng phải từ ${coupon.minOrderValue} để sử dụng mã này`, 
        success: false 
      });
    }
    
    // Calculate discount
    const discountAmount = coupon.calculateDiscount(orderTotal);
    
    res.json({
      valid: true,
      discountAmount,
      finalTotal: orderTotal - discountAmount,
      couponDetails: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      success: true
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ 
      message: "Lỗi khi xác thực mã giảm giá", 
      error: error.message,
      success: false
    });
  }
};

// Create new coupon (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      applicableProducts,
      applicableCategories
    } = req.body;
    
    // Validate required fields
    if (!code || !discountValue || !validUntil) {
      return res.status(400).json({ 
        message: "Vui lòng cung cấp mã, giá trị giảm giá và ngày hết hạn", 
        success: false 
      });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ 
        message: "Mã giảm giá này đã tồn tại", 
        success: false 
      });
    }
    
    // Create new coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType: discountType || 'percentage',
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxDiscountAmount,
      validFrom: validFrom || new Date(),
      validUntil: new Date(validUntil),
      usageLimit,
      applicableProducts,
      applicableCategories,
      createdBy: req.user._id
    });
    
    // Save coupon
    const createdCoupon = await coupon.save();
    
    res.status(201).json({
      message: "Mã giảm giá đã được tạo thành công",
      coupon: createdCoupon,
      success: true
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ 
      message: "Lỗi khi tạo mã giảm giá", 
      error: error.message,
      success: false
    });
  }
};

// Update coupon (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validate coupon exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ 
        message: "Mã giảm giá không tồn tại", 
        success: false 
      });
    }
    
    // If code is being updated, make sure it's unique
    if (updateData.code && updateData.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (existingCoupon) {
        return res.status(400).json({ 
          message: "Mã giảm giá này đã tồn tại", 
          success: false 
        });
      }
      
      updateData.code = updateData.code.toUpperCase();
    }
    
    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({
      message: "Mã giảm giá đã được cập nhật thành công",
      coupon: updatedCoupon,
      success: true
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ 
      message: "Lỗi khi cập nhật mã giảm giá", 
      error: error.message,
      success: false
    });
  }
};

// Delete coupon (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate coupon exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ 
        message: "Mã giảm giá không tồn tại", 
        success: false 
      });
    }
    
    // Delete coupon
    await coupon.deleteOne();
    
    res.json({
      message: "Mã giảm giá đã được xóa thành công",
      success: true
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ 
      message: "Lỗi khi xóa mã giảm giá", 
      error: error.message,
      success: false
    });
  }
}; 
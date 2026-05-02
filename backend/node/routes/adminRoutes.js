const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Basic middleware for testing
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// Import needed controller functions
const adminController = require("../controllers/adminController");
const { getFrequentlyBoughtTogether } = require("../services/recommendationService");

// Create a simplified debug route
router.get("/debug", (req, res) => {
  res.status(200).json({
    message: "Admin routes are working",
    time: new Date().toISOString()
  });
});

// Debug DB connection
router.get("/debug-db", async (req, res) => {
  try {
    const Order = require('../models/Order');
    const count = await Order.countDocuments();
    res.status(200).json({ message: 'Database connection working', orderCount: count });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Database connection error', error: error.toString() });
  }
});

// User management routes
router.get("/users", protect, isAdmin, async (req, res) => {
  try {
    const User = require("../models/User");
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.toString() });
  }
});

// Product management route
router.get("/products", protect, isAdmin, async (req, res) => {
  try {
    const Product = require("../models/Product");
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.toString() });
  }
});

// Category management routes
router.get("/categories", protect, isAdmin, adminController.getCategories);
router.get("/categories/:id", protect, isAdmin, adminController.getCategoryById);
router.post("/categories", protect, isAdmin, adminController.createCategory);
router.put("/categories/:id", protect, isAdmin, adminController.updateCategory);
router.delete("/categories/:id", protect, isAdmin, adminController.deleteCategory);

// Attribute management routes
router.get("/attributes", protect, isAdmin, adminController.getAttributes);
router.get("/attributes/:id", protect, isAdmin, adminController.getAttributeById);
router.post("/attributes", protect, isAdmin, adminController.createAttribute);
router.put("/attributes/:id", protect, isAdmin, adminController.updateAttribute);
router.delete("/attributes/:id", protect, isAdmin, adminController.deleteAttribute);

// Marketing routes
router.get("/marketing/banners", protect, isAdmin, adminController.getBanners);
router.post("/marketing/banners", protect, isAdmin, adminController.createBanner);
router.put("/marketing/banners/:id", protect, isAdmin, adminController.updateBanner);
router.delete("/marketing/banners/:id", protect, isAdmin, adminController.deleteBanner);

// Deal Hot routes
router.get("/marketing/deal-hot", protect, isAdmin, async (req, res) => {
  try {
    const Product = require("../models/Product");
    
    // Query for products that are marked as Deal Hot
    const dealHotProducts = await Product.find({
      $or: [
        { category: 'Deal hot' },
        { tags: 'deal-hot' }
      ]
    }).sort({ createdAt: -1 });
    
    if (!dealHotProducts || dealHotProducts.length === 0) {
      return res.status(200).json({ products: [] });
    }
    
    res.status(200).json({ products: dealHotProducts });
  } catch (error) {
    console.error("Error fetching deal hot products:", error);
    res.status(500).json({ message: "Error fetching deal hot products", error: error.toString() });
  }
});

// Add discount routes
router.get("/marketing/discounts", protect, isAdmin, adminController.getDiscounts);
router.post("/marketing/discounts", protect, isAdmin, adminController.createDiscount);
router.put("/marketing/discounts/:id", protect, isAdmin, adminController.updateDiscount);
router.delete("/marketing/discounts/:id", protect, isAdmin, adminController.deleteDiscount);

// Add coupon routes
router.get("/marketing/coupons", protect, isAdmin, adminController.getCoupons);
router.post("/marketing/coupons", protect, isAdmin, adminController.createCoupon);
router.put("/marketing/coupons/:id", protect, isAdmin, adminController.updateCoupon);
router.delete("/marketing/coupons/:id", protect, isAdmin, adminController.deleteCoupon);

// Order routes using alternative patterns to avoid conflicts
// The ORDER of these routes doesn't matter when using completely different paths
router.get("/all-orders", protect, isAdmin, async (req, res) => {
  try {
    const Order = require("../models/Order");
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.toString() });
  }
});

router.get("/order/:id", protect, isAdmin, async (req, res) => {
  try {
    const Order = require("../models/Order");
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product')
      .lean()
      .catch(err => {
        console.error("Error in order detail query:", err);
        throw new Error("Database query failed");
      });
    
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng", error: error.toString() });
  }
});

// Using clear paths for order status routes
router.get("/orders-pending", protect, isAdmin, async (req, res) => {
  try {
    const Order = require("../models/Order");
    
    // Check if Order model exists
    if (!Order) {
      return res.status(500).json({ message: "Order model not found" });
    }
    
    // Add more robust error handling
    const pendingOrders = await Order.find({ 
      status: { $in: ['pending', 'placed'] } 
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean()
    .catch(err => {
      console.error("Error in pending orders query:", err);
      throw new Error("Database query failed");
    });
    
    console.log(`Found ${pendingOrders?.length || 0} pending orders`);
    
    // Return empty array if no orders found
    res.status(200).json(pendingOrders || []);
  } catch (error) {
    console.error("Error fetching pending orders:", error.message);
    res.status(500).json({ message: "Error fetching pending orders", error: error.toString() });
  }
});

router.get("/orders-processing", protect, isAdmin, async (req, res) => {
  try {
    const Order = require("../models/Order");
    
    // Check if Order model exists
    if (!Order) {
      return res.status(500).json({ message: "Order model not found" });
    }
    
    // Add more robust error handling
    const processingOrders = await Order.find({ 
      status: { $in: ['confirmed', 'processing'] } 
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean()
    .catch(err => {
      console.error("Error in processing orders query:", err);
      throw new Error("Database query failed");
    });
    
    console.log(`Found ${processingOrders?.length || 0} processing orders`);
    
    // Return empty array if no orders found
    res.status(200).json(processingOrders || []);
  } catch (error) {
    console.error("Error fetching processing orders:", error.message);
    res.status(500).json({ message: "Error fetching processing orders", error: error.toString() });
  }
});

router.get("/orders-shipping", protect, isAdmin, async (req, res) => {
  try {
    const Order = require("../models/Order");
    
    // Check if Order model exists
    if (!Order) {
      return res.status(500).json({ message: "Order model not found" });
    }
    
    // Add more robust error handling
    const shippingOrders = await Order.find({ 
      status: 'shipped' 
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean()
    .catch(err => {
      console.error("Error in shipping orders query:", err);
      throw new Error("Database query failed");
    });
    
    console.log(`Found ${shippingOrders?.length || 0} shipping orders`);
    
    // Return empty array if no orders found
    res.status(200).json(shippingOrders || []);
  } catch (error) {
    console.error("Error fetching shipping orders:", error.message);
    res.status(500).json({ message: "Error fetching shipping orders", error: error.toString() });
  }
});

// Reports routes
router.get("/reports/frequently-bought-together", protect, isAdmin, async (req, res) => {
  try {
    // Lấy tham số từ query string và kiểm tra hợp lệ
    let minSupport = parseFloat(req.query.minSupport) || 0.01;
    const limit = parseInt(req.query.limit) || 50;
    const orderLimit = parseInt(req.query.orderLimit) || 1000;
    
    // Đảm bảo minSupport là số hợp lệ và không quá nhỏ để tránh quá tải
    if (isNaN(minSupport) || minSupport <= 0) {
      minSupport = 0.01; // Giá trị mặc định an toàn
    } else if (minSupport < 0.01) {
      // Giới hạn nhỏ nhất cho minSupport là 0.01 để đảm bảo hiệu năng
      minSupport = 0.01;
      console.log("minSupport đã được điều chỉnh lên 0.01 để đảm bảo hiệu năng");
    } else if (minSupport > 1) {
      minSupport = 1; // Support không thể lớn hơn 1 (100%)
    }
    
    console.log(`Processing frequently-bought-together request with: minSupport=${minSupport}, limit=${limit}, orderLimit=${orderLimit}`);
    
    // Gọi service function
    const result = await getFrequentlyBoughtTogether(minSupport, limit, orderLimit);
    
    // Ensure we have a properly formed frequentItemsets array
    let frequentItemsets = [];
    if (result && result.frequentItemsets) {
      frequentItemsets = Array.isArray(result.frequentItemsets) 
        ? result.frequentItemsets 
        : [];
      
      console.log(`Found ${frequentItemsets.length} patterns to return`);
    } else {
      console.log("No patterns found or invalid result structure");
      // For debugging
      console.log("Result structure:", JSON.stringify(result));
    }
    
    // Nếu no patterns were found, return an empty array with message
    if (frequentItemsets.length === 0) {
      console.log("No frequent itemsets found in the database");
      return res.status(200).json({
        frequentItemsets: [],
        message: result?.message || "Không tìm thấy mẫu mua hàng nào. Hãy thử giảm minSupport hoặc thêm dữ liệu đơn hàng.",
        success: false,
        info: {
          minSupport,
          limit,
          orderLimit,
          algorithm: result?.info?.algorithm || "FP-Growth"
        }
      });
    }
    
    // Chuẩn hóa kết quả trước khi trả về để đảm bảo hiển thị chính xác
    const normalizedItemsets = frequentItemsets.map(item => {
      // Đảm bảo support và frequency là giá trị hợp lệ
      const totalTransactions = item.totalTransactions || result?.info?.totalTransactions || 0;
      const frequency = Math.min(item.frequency || 0, totalTransactions);
      const support = totalTransactions > 0 ? frequency / totalTransactions : 0;
      
      return {
        ...item,
        frequency: frequency,
        support: support,
        supportPercent: `${(support * 100).toFixed(2)}%`, // Thêm % hiển thị
        frequencyDisplay: `${frequency}/${totalTransactions}` // Hiển thị dạng phân số
      };
    });
    
    res.status(200).json({
      frequentItemsets: normalizedItemsets,
      message: result?.message || "Danh sách sản phẩm thường được mua cùng nhau",
      success: true,
      info: result?.info || {
        minSupport,
        limit, 
        orderLimit,
        totalTransactions: frequentItemsets[0]?.totalTransactions || 0
      }
    });
  } catch (error) {
    console.error("Error getting frequently bought together products:", error);
    
    res.status(500).json({ 
      frequentItemsets: [],
      message: "Không thể lấy dữ liệu sản phẩm thường được mua cùng nhau: " + error.message, 
      success: false,
      error: error.toString()
    });
  }
});

// Order update endpoint
router.put("/order/:id", protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Verify valid order status - must match the enum in Order model
    const validStatuses = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'paid'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
    }
    
    const Order = require("../models/Order");
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    
    // Update order status
    if (status) {
      order.status = status;
      
      // Update related fields
      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }
      
      if (status === 'paid') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }
    
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng", error: error.toString() });
  }
});

// Settings routes
router.get("/settings/general", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const generalSettings = await Setting.findOne({ type: 'general' }).lean() || { 
      type: 'general',
      siteName: '2NADH',
      siteDescription: 'Cửa hàng thương mại điện tử',
      logo: 'https://via.placeholder.com/200x60?text=2NADH',
      favicon: 'https://via.placeholder.com/32x32',
      email: 'contact@example.com',
      phone: '+84 123 456 789',
      address: 'Hà Nội, Việt Nam',
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com'
      },
      metaTags: {
        title: '2NADH - Cửa hàng thương mại điện tử',
        description: 'Mua sắm trực tuyến với giá tốt nhất',
        keywords: 'thương mại điện tử, mua sắm, trực tuyến'
      },
      currencyCode: 'VND',
      currencySymbol: '₫',
      currencyPosition: 'after',
      thousandSeparator: '.',
      decimalSeparator: ',',
      numberOfDecimals: 0
    };
    
    res.status(200).json(generalSettings);
  } catch (error) {
    console.error("Error fetching general settings:", error);
    res.status(500).json({ message: "Error fetching general settings", error: error.toString() });
  }
});

router.put("/settings/general", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const updatedSettings = await Setting.findOneAndUpdate(
      { type: 'general' },
      { ...req.body, type: 'general' },
      { new: true, upsert: true }
    );
    
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating general settings:", error);
    res.status(500).json({ message: "Error updating general settings", error: error.toString() });
  }
});

router.get("/settings/payment", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const paymentSettings = await Setting.findOne({ type: 'payment' }).lean() || {
      type: 'payment',
      enabledMethods: ['cod', 'bank_transfer'],
      codSettings: {
        enabled: true,
        title: 'Thanh toán khi nhận hàng (COD)',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng'
      },
      bankTransferSettings: {
        enabled: true,
        title: 'Chuyển khoản ngân hàng',
        description: 'Thanh toán bằng chuyển khoản ngân hàng',
        bankAccounts: [
          {
            bankName: 'Vietcombank',
            accountNumber: '1234567890',
            accountName: '2NADH Company'
          }
        ]
      }
    };
    
    res.status(200).json(paymentSettings);
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    res.status(500).json({ message: "Error fetching payment settings", error: error.toString() });
  }
});

router.put("/settings/payment", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const updatedSettings = await Setting.findOneAndUpdate(
      { type: 'payment' },
      { ...req.body, type: 'payment' },
      { new: true, upsert: true }
    );
    
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating payment settings:", error);
    res.status(500).json({ message: "Error updating payment settings", error: error.toString() });
  }
});

router.get("/settings/shipping", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const shippingSettings = await Setting.findOne({ type: 'shipping' }).lean() || {
      type: 'shipping',
      enableFreeShipping: true,
      freeShippingThreshold: 500000,
      shippingMethods: [
        {
          id: 'standard',
          name: 'Giao hàng tiêu chuẩn',
          description: 'Giao hàng trong 3-5 ngày',
          cost: 30000,
          estimatedDays: '3-5'
        },
        {
          id: 'express',
          name: 'Giao hàng nhanh',
          description: 'Giao hàng trong 1-2 ngày',
          cost: 50000,
          estimatedDays: '1-2'
        }
      ]
    };
    
    res.status(200).json(shippingSettings);
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    res.status(500).json({ message: "Error fetching shipping settings", error: error.toString() });
  }
});

router.put("/settings/shipping", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const updatedSettings = await Setting.findOneAndUpdate(
      { type: 'shipping' },
      { ...req.body, type: 'shipping' },
      { new: true, upsert: true }
    );
    
    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    res.status(500).json({ message: "Error updating shipping settings", error: error.toString() });
  }
});

module.exports = router;

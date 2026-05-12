const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Basic middleware for testing
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// Import needed controller functions
const adminController = require("../controllers/adminController");
const {
  getFrequentlyBoughtTogether,
  clearRecommendationCache,
} = require("../services/recommendationService");

/**
 * @swagger
 * /api/admin/debug:
 *   get:
 *     tags: [Admin]
 *     summary: Kiểm tra route admin
 * /api/admin/debug-db:
 *   get:
 *     tags: [Admin]
 *     summary: Kiểm tra kết nối DB
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách user
 *     security:
 *       - BearerAuth: []
 * /api/admin/products:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách sản phẩm (admin)
 *     security:
 *       - BearerAuth: []
 * /api/admin/categories:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách danh mục
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Tạo danh mục
 *     security:
 *       - BearerAuth: []
 * /api/admin/categories/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy chi tiết danh mục
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật danh mục
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa danh mục
 *     security:
 *       - BearerAuth: []
 * /api/admin/attributes:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách thuộc tính
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Tạo thuộc tính
 *     security:
 *       - BearerAuth: []
 * /api/admin/attributes/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy chi tiết thuộc tính
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật thuộc tính
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa thuộc tính
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/banners:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách banner
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Tạo banner
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/banners/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật banner
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa banner
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/deal-hot:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy sản phẩm Deal Hot cho admin
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/discounts:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách giảm giá
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Tạo giảm giá
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/discounts/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật giảm giá
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa giảm giá
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/coupons:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy danh sách mã giảm giá
 *     security:
 *       - BearerAuth: []
 *   post:
 *     tags: [Admin]
 *     summary: Tạo mã giảm giá
 *     security:
 *       - BearerAuth: []
 * /api/admin/marketing/coupons/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật mã giảm giá
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     tags: [Admin]
 *     summary: Xóa mã giảm giá
 *     security:
 *       - BearerAuth: []
 * /api/admin/all-orders:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy tất cả đơn hàng
 *     security:
 *       - BearerAuth: []
 * /api/admin/order/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy chi tiết đơn hàng
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật trạng thái đơn hàng
 *     security:
 *       - BearerAuth: []
 * /api/admin/orders-pending:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy đơn hàng chờ xử lý
 *     security:
 *       - BearerAuth: []
 * /api/admin/orders-processing:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy đơn hàng đang xử lý
 *     security:
 *       - BearerAuth: []
 * /api/admin/orders-shipping:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy đơn hàng đang giao
 *     security:
 *       - BearerAuth: []
 * /api/admin/reports/frequently-bought-together:
 *   get:
 *     tags: [Admin, Recommendations]
 *     summary: Báo cáo sản phẩm thường mua cùng nhau
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minSupport
 *         schema:
 *           type: number
 *           default: 0.01
 *         description: Ngưỡng support tối thiểu (0-1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số pattern tối đa trả về
 *       - in: query
 *         name: orderLimit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Số đơn hàng tối đa dùng để phân tích
 *       - in: query
 *         name: force
 *         schema:
 *           type: string
 *           enum: ['true', '1']
 *         description: Bỏ qua cache FBT và chạy lại FP-Growth (vd. force=true)
 *     responses:
 *       200:
 *         description: Lấy báo cáo thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 * /api/admin/settings/general:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy cấu hình chung
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật cấu hình chung
 *     security:
 *       - BearerAuth: []
 * /api/admin/settings/payment:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy cấu hình thanh toán
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật cấu hình thanh toán
 *     security:
 *       - BearerAuth: []
 * /api/admin/settings/shipping:
 *   get:
 *     tags: [Admin]
 *     summary: Lấy cấu hình vận chuyển
 *     security:
 *       - BearerAuth: []
 *   put:
 *     tags: [Admin]
 *     summary: Cập nhật cấu hình vận chuyển
 *     security:
 *       - BearerAuth: []
 */

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
const productController = require("../controllers/productController");

router.get("/products", protect, isAdmin, async (req, res) => {
  try {
    const Product = require("../models/Product");
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.toString() });
  }
});

router.post("/products", protect, isAdmin, productController.createProduct);

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
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(20000, Math.max(1, rawLimit))
      : 20000;
    const rawPage = parseInt(req.query.page, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const skip = (page - 1) * limit;

    const filter = {};
    const status = req.query.status;
    if (status && String(status).toLowerCase() !== "all") {
      filter.status = status;
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    console.error("all-orders:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách đơn hàng",
      error: String(error?.message || error),
    });
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
    let orderLimit = parseInt(req.query.orderLimit) || 1000;
    let minConfidence = parseFloat(req.query.minConfidence);
    let minLift = parseFloat(req.query.minLift);
    let minConviction = parseFloat(req.query.minConviction);
    
    // Đảm bảo minSupport là số hợp lệ
    if (isNaN(minSupport) || minSupport <= 0) {
      minSupport = 0.01; // Giá trị mặc định an toàn
    } else if (minSupport < 0.00001) {
      // Cho phép support rất nhỏ nhưng vẫn chặn giá trị quá thấp
      minSupport = 0.00001;
      console.log("minSupport đã được điều chỉnh lên 0.00001");
    } else if (minSupport > 1) {
      minSupport = 1; // Support không thể lớn hơn 1 (100%)
    }

    if (isNaN(orderLimit) || orderLimit <= 0) {
      orderLimit = 1000;
    }

    if (!Number.isFinite(minConfidence) || minConfidence <= 0 || minConfidence > 1) {
      minConfidence = 0.1;
    }
    if (!Number.isFinite(minLift) || minLift <= 0) {
      minLift = 1;
    }
    if (!Number.isFinite(minConviction) || minConviction <= 0) {
      minConviction = 1;
    }
    
    const forceRefresh =
      req.query.force === 'true' ||
      req.query.force === '1' ||
      req.query.refresh === 'true';

    console.log(`Processing frequently-bought-together request with: minSupport=${minSupport}, minConfidence=${minConfidence}, minLift=${minLift}, minConviction=${minConviction}, orderLimit=${orderLimit}, force=${forceRefresh}`);
    
    // Gọi service function
    const result = await getFrequentlyBoughtTogether(
      minSupport,
      orderLimit,
      minConfidence,
      minLift,
      minConviction,
      { forceRefresh }
    );
    
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
        strongRules: Array.isArray(result?.strongRules) ? result.strongRules : [],
        message: result?.message || "Không tìm thấy mẫu mua hàng nào. Hãy thử giảm minSupport hoặc thêm dữ liệu đơn hàng.",
        success: result?.success === true ? true : false,
        info: {
          ...(result?.info && typeof result.info === "object" ? result.info : {}),
          minSupport,
          minConfidence,
          minLift,
          minConviction,
          orderLimit,
          algorithm: result?.info?.algorithm || "FP-Growth",
        },
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

    const strongRules = Array.isArray(result?.strongRules) ? result.strongRules : [];
    
    res.status(200).json({
      frequentItemsets: normalizedItemsets,
      strongRules,
      message: result?.message || "Danh sách sản phẩm thường được mua cùng nhau",
      success: true,
      info: {
        ...(result?.info && typeof result.info === "object" ? result.info : {}),
        minSupport,
        minConfidence,
        minLift,
        minConviction,
        orderLimit,
      },
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

// Xóa cache gợi ý / mining (FBT, FP-Growth, luật cặp trong NodeCache) — lần gọi sau tính lại từ DB
router.post("/reports/recommendations-cache/clear", protect, isAdmin, (req, res) => {
  try {
    clearRecommendationCache();
    res.status(200).json({
      success: true,
      message:
        "Đã xóa cache recommendation. Lần gọi sau: mặc định mining từ MongoDB Order; nếu FBT_USE_FP_JSON=true thì đọc lại fp_transactions / fp_pair_rules / fp_strong_rules và tính FP-Growth.",
    });
  } catch (error) {
    console.error("clearRecommendationCache:", error);
    res.status(500).json({
      success: false,
      message: error.message || String(error),
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
    const { getMergedGeneralSettings } = require("../services/generalSettingsService");
    const generalSettings = await getMergedGeneralSettings();
    res.status(200).json(generalSettings);
  } catch (error) {
    console.error("Error fetching general settings:", error);
    res.status(500).json({ message: "Error fetching general settings", error: error.toString() });
  }
});

router.put("/settings/general", protect, isAdmin, async (req, res) => {
  try {
    const Setting = require("../models/Setting");
    const payload = { ...req.body };
    delete payload._id;
    delete payload.type;
    if (payload.numberOfDecimals !== undefined && payload.numberOfDecimals !== null && payload.numberOfDecimals !== '') {
      const n = parseInt(payload.numberOfDecimals, 10);
      payload.numberOfDecimals = Number.isFinite(n) ? Math.min(4, Math.max(0, n)) : 2;
    }

    const updatedSettings = await Setting.findOneAndUpdate(
      { type: 'general' },
      {
        type: 'general',
        data: payload,
        updatedBy: req.user?._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.status(200).json({ type: 'general', ...(updatedSettings?.data || {}) });
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

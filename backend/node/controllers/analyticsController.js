const UserBehavior = require("../models/UserBehavior");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const { getCartRecommendations } = require("../services/recommendationService");

// @desc    Track user behavior
// @route   POST /api/analytics/track
// @access  Private
exports.trackUserBehavior = asyncHandler(async (req, res) => {
  try {
    const { type, productId, searchQuery, metadata } = req.body;
    const userId = req.user._id;
    
    if (!type) {
      return res.status(400).json({ message: "Loại hành vi không được để trống" });
    }
    
    let result;
    
    switch (type) {
      case 'view':
        if (!productId) {
          return res.status(400).json({ message: "ID sản phẩm không được để trống" });
        }
        result = await UserBehavior.trackProductView(userId, productId, metadata);
        break;
        
      case 'search':
        if (!searchQuery) {
          return res.status(400).json({ message: "Từ khóa tìm kiếm không được để trống" });
        }
        result = await UserBehavior.trackSearch(userId, searchQuery, metadata);
        break;
        
      case 'cart':
        if (!productId) {
          return res.status(400).json({ message: "ID sản phẩm không được để trống" });
        }
        result = await UserBehavior.trackAddToCart(userId, productId, metadata);
        break;
        
      case 'purchase':
        if (!productId) {
          return res.status(400).json({ message: "ID sản phẩm không được để trống" });
        }
        result = await UserBehavior.trackPurchase(userId, productId, metadata);
        break;
        
      default:
        return res.status(400).json({ message: "Loại hành vi không hợp lệ" });
    }
    
    res.status(200).json({ message: "Ghi nhận hành vi thành công" });
  } catch (error) {
    console.error("Error tracking user behavior:", error);
    res.status(500).json({ message: "Lỗi ghi nhận hành vi người dùng", error });
  }
});

// @desc    Get product recommendations for user
// @route   GET /api/analytics/recommendations
// @access  Private
exports.getRecommendations = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get product IDs recommended for this user
    const recommendedProductIds = await UserBehavior.getUserRecommendations(userId);
    
    if (!recommendedProductIds || recommendedProductIds.length === 0) {
      // If no personalized recommendations, return popular products
      const popularProducts = await Product.find({})
        .sort({ rating: -1 })
        .limit(10);
        
      return res.status(200).json(popularProducts);
    }
    
    // Fetch full product details
    const recommendedProducts = await Product.find({
      _id: { $in: recommendedProductIds }
    });
    
    res.status(200).json(recommendedProducts);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ message: "Lỗi lấy sản phẩm đề xuất", error });
  }
});

// @desc    Get popular products
// @route   GET /api/analytics/popular
// @access  Public
exports.getPopularProducts = asyncHandler(async (req, res) => {
  try {
    // Get most viewed products from user behavior data
    const popularProductIds = await UserBehavior.aggregate([
      { $unwind: "$behaviors" },
      { $match: { "behaviors.type": "view" } },
      { $group: {
          _id: "$behaviors.product",
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Extract just the product IDs
    const productIds = popularProductIds.map(item => item._id);
    
    // Fetch the actual products
    const popularProducts = await Product.find({
      _id: { $in: productIds }
    });
    
    // Sort products in the same order as the view counts
    const sortedProducts = productIds.map(id => 
      popularProducts.find(product => product._id.toString() === id.toString())
    ).filter(product => product); // Remove any null/undefined values
    
    res.status(200).json(sortedProducts);
  } catch (error) {
    console.error("Error getting popular products:", error);
    
    // Fallback to simple product sorting if aggregation fails
    try {
      const products = await Product.find({})
        .sort({ rating: -1 })
        .limit(10);
        
      res.status(200).json(products);
    } catch (fallbackError) {
      res.status(500).json({ message: "Lỗi lấy sản phẩm phổ biến", error });
    }
  }
});

// @desc    Get related products
// @route   GET /api/analytics/related/:productId
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get the current product to find its category
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
    
    // Find products frequently viewed together with this product
    const relatedFromBehavior = await UserBehavior.aggregate([
      { $unwind: "$behaviors" },
      { $match: { "behaviors.product": mongoose.Types.ObjectId(productId) } },
      { $group: { _id: "$user" } },
      { $lookup: {
          from: "userbehaviors",
          localField: "_id",
          foreignField: "user",
          as: "userBehaviors"
        }
      },
      { $unwind: "$userBehaviors" },
      { $unwind: "$userBehaviors.behaviors" },
      { $match: { 
          "userBehaviors.behaviors.product": { $ne: mongoose.Types.ObjectId(productId) },
          "userBehaviors.behaviors.type": { $in: ["view", "purchase"] }
        }
      },
      { $group: {
          _id: "$userBehaviors.behaviors.product",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Extract product IDs
    const relatedProductIds = relatedFromBehavior.map(item => item._id);
    
    // If we have enough related products from behavior, use those
    if (relatedProductIds.length >= 4) {
      const relatedProducts = await Product.find({
        _id: { $in: relatedProductIds }
      });
      
      return res.status(200).json(relatedProducts);
    }
    
    // Otherwise, fall back to category-based recommendations
    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category
    }).limit(5);
    
    res.status(200).json(relatedProducts);
  } catch (error) {
    console.error("Error getting related products:", error);
    res.status(500).json({ message: "Lỗi lấy sản phẩm liên quan", error });
  }
});

// @desc    Get product analytics for admin dashboard
// @route   GET /api/analytics/products
// @access  Private/Admin
exports.getProductAnalytics = asyncHandler(async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const rawFromY = parseInt(req.query.fromYear, 10);
    const rawToY = parseInt(req.query.toYear, 10);
    const rawYear = parseInt(req.query.year, 10);

    let filterFromYear = null;
    let filterToYear = null;
    if (Number.isFinite(rawFromY) && Number.isFinite(rawToY)) {
      filterFromYear = Math.max(2000, Math.min(rawFromY, currentYear));
      filterToYear = Math.max(2000, Math.min(rawToY, currentYear));
      if (filterFromYear > filterToYear) {
        [filterFromYear, filterToYear] = [filterToYear, filterFromYear];
      }
    } else if (
      Number.isFinite(rawYear) &&
      rawYear >= 2000 &&
      rawYear <= currentYear
    ) {
      filterFromYear = rawYear;
      filterToYear = rawYear;
    }

    const useOrderDateFilter =
      filterFromYear != null && filterToYear != null;
    const rangeStart = useOrderDateFilter
      ? new Date(filterFromYear, 0, 1)
      : null;
    const rangeEnd = useOrderDateFilter
      ? new Date(filterToYear, 11, 31, 23, 59, 59, 999)
      : null;

    const analyticsDateExprOrder = {
      $min: [
        { $ifNull: ["$deliveredAt", new Date("9999-12-31T23:59:59.999Z")] },
        { $ifNull: ["$paidAt", new Date("9999-12-31T23:59:59.999Z")] },
        { $ifNull: ["$createdAt", new Date("9999-12-31T23:59:59.999Z")] }
      ]
    };
    const orderYearStages = useOrderDateFilter
      ? [
          { $addFields: { analyticsDate: analyticsDateExprOrder } },
          { $match: { analyticsDate: { $gte: rangeStart, $lte: rangeEnd } } }
        ]
      : [];

    const topProductsPromise = Order.aggregate([
      ...orderYearStages,
      { $unwind: "$orderItems" },
      { $group: {
          _id: "$orderItems.product",
          // Support both old (`quantity`) and current (`qty`) schemas.
          totalSales: { $sum: { $ifNull: ["$orderItems.qty", "$orderItems.quantity"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      { $project: {
          _id: "$productDetails._id",
          name: "$productDetails.name",
          category: "$productDetails.category",
          price: "$productDetails.price",
          stock: "$productDetails.stock",
          salePrice: "$productDetails.salePrice",
          countInStock: "$productDetails.countInStock",
          totalSales: 1,
          image: "$productDetails.image"
        }
      }
    ]);

    // Get sales by category
    const salesByCategoryPromise = Order.aggregate([
      ...orderYearStages,
      { $unwind: "$orderItems" },
      { $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          categoryName: {
            $ifNull: [
              "$categoryDetails.name",
              {
                $ifNull: [
                  {
                    $cond: [
                      { $eq: [{ $type: "$product.category" }, "string"] },
                      "$product.category",
                      null
                    ]
                  },
                  {
                    $ifNull: ["$orderItems.category", "Khác"]
                  }
                ]
              }
            ]
          }
        }
      },
      { $group: {
          _id: "$categoryName",
          value: { $sum: { $multiply: [{ $ifNull: ["$orderItems.qty", "$orderItems.quantity"] }, "$orderItems.price"] } }
        }
      },
      { $project: {
          _id: 0,
          name: "$_id",
          value: 1
        }
      },
      { $sort: { value: -1 } },
      { $limit: 6 }
    ]);

    // Get product views
    const productViewsPromise = UserBehavior.aggregate([
      { $unwind: "$behaviors" },
      { $match: { "behaviors.type": "view" } },
      { $group: {
          _id: "$behaviors.product",
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      { $project: {
          _id: 0,
          name: "$productDetails.name",
          views: 1
        }
      }
    ]);

    const [topProducts, salesByCategory, productViews] = await Promise.all([
      topProductsPromise,
      salesByCategoryPromise,
      productViewsPromise
    ]);

    res.status(200).json({
      topProducts,
      salesByCategory,
      productViews,
      statsFromYear: useOrderDateFilter ? filterFromYear : null,
      statsToYear: useOrderDateFilter ? filterToYear : null
    });
  } catch (error) {
    console.error("Error getting product analytics:", error);
    res.status(500).json({ message: "Lỗi lấy phân tích sản phẩm", error: error.message });
  }
});

// @desc    Get user analytics for admin dashboard
// @route   GET /api/analytics/users
// @access  Private/Admin
exports.getUserAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get monthly user growth data
    const currentDate = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - 8); // Get data for last 8 months
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get monthly new user registrations
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: monthsAgo } } },
      { $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Get monthly active users from behavior data
    const activeUsers = await UserBehavior.aggregate([
      { $match: { "behaviors.timestamp": { $gte: monthsAgo } } },
      { $unwind: "$behaviors" },
      { $match: { "behaviors.timestamp": { $gte: monthsAgo } } },
      { $group: {
          _id: { 
            user: "$user", 
            month: { $month: "$behaviors.timestamp" }, 
            year: { $year: "$behaviors.timestamp" } 
          }
        }
      },
      { $group: {
          _id: { month: "$_id.month", year: "$_id.year" },
          activeUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Format data for frontend chart
    const customersByPeriod = [];
    
    // Create last 8 months of data
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - 7 + i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthName = months[month];
      
      const registrationData = userRegistrations.find(
        item => item._id.month === month + 1 && item._id.year === year
      );
      
      const activeUserData = activeUsers.find(
        item => item._id.month === month + 1 && item._id.year === year
      );
      
      customersByPeriod.push({
        name: monthName,
        newUsers: registrationData ? registrationData.newUsers : 0,
        activeUsers: activeUserData ? activeUserData.activeUsers : 0
      });
    }
    
    // Get user device distribution
    const usersByDevice = [
      { name: 'Mobile', value: 65 },
      { name: 'Desktop', value: 25 },
      { name: 'Tablet', value: 10 }
    ];
    
    // Get user regional distribution
    const usersByRegion = [
      { name: 'North', value: 35 },
      { name: 'South', value: 45 },
      { name: 'Central', value: 20 }
    ];
    
    res.status(200).json({
      customersByPeriod,
      usersByDevice,
      usersByRegion
    });
  } catch (error) {
    console.error("Error getting user analytics:", error);
    res.status(500).json({ message: "Lỗi lấy phân tích người dùng", error: error.message });
  }
});

// @desc    Get order analytics for admin dashboard
// @route   GET /api/analytics/orders
// @access  Private/Admin
exports.getOrderAnalytics = asyncHandler(async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const rawFromYear = parseInt(req.query.fromYear, 10);
    const rawToYear = parseInt(req.query.toYear, 10);
    const defaultFromYear = currentYear - 4;
    const defaultToYear = currentYear;

    let fromYear = Number.isFinite(rawFromYear) ? rawFromYear : defaultFromYear;
    let toYear = Number.isFinite(rawToYear) ? rawToYear : defaultToYear;

    fromYear = Math.max(2000, Math.min(fromYear, currentYear));
    toYear = Math.max(2000, Math.min(toYear, currentYear));

    if (fromYear > toYear) {
      [fromYear, toYear] = [toYear, fromYear];
    }
    const singleCalendarYear = fromYear === toYear;
    // So sánh deliveredAt, paidAt, createdAt và lấy ngày cũ nhất
    const analyticsDateExpr = {
      $min: [
        { $ifNull: ["$deliveredAt", new Date("9999-12-31T23:59:59.999Z")] },
        { $ifNull: ["$paidAt", new Date("9999-12-31T23:59:59.999Z")] },
        { $ifNull: ["$createdAt", new Date("9999-12-31T23:59:59.999Z")] }
      ]
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let orderDataByMonth;
    if (singleCalendarYear) {
      const y = fromYear;
      const yearStart = new Date(y, 0, 1);
      const yearEnd = new Date(y, 11, 31, 23, 59, 59, 999);
      orderDataByMonth = await Order.aggregate([
        {
          $project: {
            totalPrice: 1,
            analyticsDate: analyticsDateExpr
          }
        },
        { $match: { analyticsDate: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
            _id: { month: { $month: "$analyticsDate" }, year: { $year: "$analyticsDate" } },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
    } else {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 8);
      orderDataByMonth = await Order.aggregate([
        {
          $project: {
            totalPrice: 1,
            analyticsDate: analyticsDateExpr
          }
        },
        { $match: { analyticsDate: { $gte: monthsAgo } } },
        { $group: {
            _id: { month: { $month: "$analyticsDate" }, year: { $year: "$analyticsDate" } },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
    }
    
    // Get weekly data
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - 7 * 8); // Get data for last 8 weeks
    
    const orderDataByWeek = await Order.aggregate([
      {
        $project: {
          totalPrice: 1,
          analyticsDate: analyticsDateExpr
        }
      },
      { $match: { analyticsDate: { $gte: weeksAgo } } },
      {
        $project: {
          totalPrice: 1,
          week: { $week: "$analyticsDate" },
          year: { $year: "$analyticsDate" }
        }
      },
      {
        $group: {
          _id: { week: "$week", year: "$year" },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } }
    ]);
    
    // Get yearly data theo khoảng năm từ frontend
    const orderDataByYear = await Order.aggregate([
      {
        $project: {
          totalPrice: 1,
          analyticsDate: analyticsDateExpr
        }
      },
      {
        $match: {
          analyticsDate: {
            $gte: new Date(fromYear, 0, 1),
            $lte: new Date(toYear, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: { year: { $year: "$analyticsDate" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1 } }
    ]);

    // Lấy năm nhỏ nhất/lớn nhất có dữ liệu theo analyticsDate (toàn bộ dữ liệu)
    const [yearBounds] = await Order.aggregate([
      {
        $project: {
          analyticsDate: analyticsDateExpr
        }
      },
      {
        $group: {
          _id: null,
          minDate: { $min: "$analyticsDate" },
          maxDate: { $max: "$analyticsDate" }
        }
      }
    ]);

    const minDataYear = yearBounds?.minDate ? new Date(yearBounds.minDate).getFullYear() : null;
    const maxDataYear = yearBounds?.maxDate ? new Date(yearBounds.maxDate).getFullYear() : null;
    
    // Format data for frontend chart
    const revenueByPeriod = [];
    
    if (singleCalendarYear) {
      const y = fromYear;
      for (let m = 0; m < 12; m++) {
        const data = orderDataByMonth.find(
          (item) => item._id.month === m + 1 && item._id.year === y
        );
        revenueByPeriod.push({
          name: months[m],
          revenue: Number(data ? data.revenue : 0) || 0,
          orders: Number(data ? data.orders : 0) || 0,
          period: "month",
          year: y
        });
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - 7 + i);
        const month = date.getMonth();
        const year = date.getFullYear();

        const monthName = months[month];

        const data = orderDataByMonth.find(
          (item) => item._id.month === month + 1 && item._id.year === year
        );

        revenueByPeriod.push({
          name: monthName,
          revenue: Number(data ? data.revenue : 0) || 0,
          orders: Number(data ? data.orders : 0) || 0,
          period: "month"
        });
      }
    }
    
    // 8 điểm tuần: lấy trực tiếp từ aggregate (tránh lệch ISO week vs $week)
    const sortedWeekRows = [...orderDataByWeek].sort((a, b) =>
      a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.week - b._id.week
    );
    const lastWeekBuckets = sortedWeekRows.slice(-8);
    const weekPad = Math.max(0, 8 - lastWeekBuckets.length);
    for (let i = 0; i < weekPad; i++) {
      revenueByPeriod.push({
        name: `Tuần ${i + 1}`,
        revenue: 0,
        orders: 0,
        period: 'week'
      });
    }
    lastWeekBuckets.forEach((row, idx) => {
      revenueByPeriod.push({
        name: `Tuần ${weekPad + idx + 1} (${row._id.year}-W${row._id.week})`,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0,
        period: 'week'
      });
    });
    
    for (let year = fromYear; year <= toYear; year++) {
      const data = orderDataByYear.find((item) => item._id.year === year);
      revenueByPeriod.push({
        name: year.toString(),
        revenue: Number(data ? data.revenue : 0) || 0,
        orders: Number(data ? data.orders : 0) || 0,
        period: 'year'
      });
    }
    
    // Get recent orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean();
    
    // Format recent orders
    const formattedRecentOrders = recentOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || `ORD-${order._id.toString().substring(0, 8)}`,
      user: {
        name: order.user?.name || order.guestInfo?.name || 'Khách hàng không xác định',
        email: order.user?.email || order.guestInfo?.email || 'Không có email'
      },
      totalPrice: order.totalPrice,
      status: order.status || 'pending',
      isPaid: order.isPaid || false,
      createdAt: order.createdAt
    }));
    
    // Get order payment method distribution
    const ordersByPaymentMethod = [
      { name: 'Credit Card', value: 45 },
      { name: 'Bank Transfer', value: 25 },
      { name: 'COD', value: 20 },
      { name: 'E-wallet', value: 10 }
    ];
    
    res.status(200).json({
      revenueByPeriod,
      recentOrders: formattedRecentOrders,
      ordersByPaymentMethod,
      info: {
        fromYear,
        toYear,
        minDataYear,
        maxDataYear,
        dateSource: "min(deliveredAt,paidAt,createdAt)"
      }
    });
  } catch (error) {
    console.error("Error getting order analytics:", error);
    res.status(500).json({ message: "Lỗi lấy phân tích đơn hàng", error: error.message });
  }
});

// @desc    Gợi ý theo giỏ (luật cặp + FP-Growth cache) từ danh sách productId
// @route   GET /api/analytics/cart-suggestions?productIds=id1,id2&limit=6
// @access  Public
exports.getCartSuggestions = asyncHandler(async (req, res) => {
  const limitRaw = parseInt(String(req.query.limit ?? "6"), 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 6;
  const raw = req.query.productIds ?? req.query.ids ?? "";
  const ids = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) {
    return res.status(200).json({ products: [] });
  }
  const cartItems = ids.map((product) => ({ product, quantity: 1 }));
  const products = await getCartRecommendations(cartItems, limit);
  res.status(200).json({ products: Array.isArray(products) ? products : [] });
});
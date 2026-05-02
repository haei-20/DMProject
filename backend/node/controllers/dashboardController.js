const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Newsletter = require("../models/Newsletter");

// Lấy số liệu tổng quan
exports.getOverviewStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    let startDate;
    const now = new Date();
    
    // Xác định khoảng thời gian
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)); // Mặc định 30 ngày
    }

    // Tính tổng doanh thu
    const totalRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          // Chỉ tính đơn hàng đã giao
          isDelivered: true
        } 
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalPrice" }
        }
      }
    ]);

    // Đếm đơn hàng mới
    const newOrders = await Order.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Đếm người dùng mới
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Tính đơn hàng trung bình
    const averageOrderValue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$totalPrice" }
        }
      }
    ]);

    // Đếm sản phẩm có lượt xem cao
    const topViewedProducts = await Product.countDocuments({
      numReviews: { $gt: 0 }
    });

    // Tính tổng số lượng đăng ký newsletter
    const totalSubscribers = await Newsletter.countDocuments({
      isSubscribed: true,
      createdAt: { $gte: startDate }
    });

    res.json({
      totalRevenue: totalRevenue.length ? totalRevenue[0].revenue : 0,
      newOrders,
      newUsers,
      averageOrderValue: averageOrderValue.length ? averageOrderValue[0].average : 0,
      topViewedProducts,
      totalSubscribers,
      timeRange
    });

  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy dữ liệu tổng quan", 
      error: error.message 
    });
  }
};

// Lấy thống kê tổng quan cho dashboard
exports.getStats = async (req, res) => {
  try {
    // Tính tổng doanh thu
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" }
        }
      }
    ]);

    // Đếm tổng số đơn hàng
    const totalOrders = await Order.countDocuments();
    
    // Đếm đơn hàng đang xử lý
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'processing'] }
    });

    // Đếm tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: 'user' });
    
    // Đếm khách hàng mới trong tháng này
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newCustomers = await User.countDocuments({ 
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });

    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countDocuments();
    
    // Đếm sản phẩm sắp hết hàng
    const lowStockProducts = await Product.countDocuments({
      stock: { $lte: 10, $gt: 0 }
    });

    res.json({
      totalRevenue: revenueData.length > 0 ? revenueData[0].totalRevenue : 0,
      totalOrders,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStockProducts,
      pendingOrders
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thống kê dashboard", 
      error: error.message 
    });
  }
};

// Lấy dữ liệu doanh thu theo thời gian
exports.getRevenueData = async (req, res) => {
  try {
    const { timeRange = 'month', groupBy = 'day' } = req.query;
    let startDate;
    const now = new Date();
    
    // Xác định khoảng thời gian
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1)); // Mặc định 1 tháng
    }

    // Xác định cách nhóm dữ liệu
    let dateFormat;
    let groupByField;
    
    switch (groupBy) {
      case 'day':
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        groupByField = 'Ngày';
        break;
      case 'week':
        dateFormat = { 
          $dateToString: { 
            format: "%Y-W%U", 
            date: "$createdAt" 
          } 
        };
        groupByField = 'Tuần';
        break;
      case 'month':
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        groupByField = 'Tháng';
        break;
      default:
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        groupByField = 'Ngày';
    }

    // Tính doanh thu theo thời gian
    const revenueByTime = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: dateFormat,
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          [groupByField]: "$_id",
          revenue: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      data: revenueByTime,
      timeRange,
      groupBy
    });

  } catch (error) {
    console.error("Error fetching revenue data:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy dữ liệu doanh thu", 
      error: error.message 
    });
  }
};

// Lấy danh sách sản phẩm bán chạy
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, timeRange = 'month' } = req.query;
    let startDate;
    const now = new Date();
    
    // Xác định khoảng thời gian
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1)); // Mặc định 1 tháng
    }

    // Tìm sản phẩm bán chạy
    const topSellingProducts = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate }
        } 
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          productName: { $first: "$orderItems.name" },
          totalSold: { $sum: "$orderItems.qty" },
          totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } },
          image: { $first: "$orderItems.image" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: 1,
          totalSold: 1,
          totalRevenue: 1,
          image: 1
        }
      }
    ]);

    res.json({
      products: topSellingProducts,
      timeRange
    });

  } catch (error) {
    console.error("Error fetching top selling products:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách sản phẩm bán chạy", 
      error: error.message 
    });
  }
};

// Lấy thông tin tồn kho
exports.getInventoryStats = async (req, res) => {
  try {
    const { lowStockThreshold = 5 } = req.query;
    
    // Sản phẩm sắp hết hàng
    const lowStockProducts = await Product.find({
      stock: { $lte: 10, $gt: 0 }
    }).limit(5);
    
    // Sản phẩm hết hàng
    const outOfStockProducts = await Product.find({ stock: 0 })
    .select('name price stock category image')
    .limit(20);
    
    // Tổng kê tồn kho theo danh mục
    const stockByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalStock: { $sum: "$stock" },
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }
      },
      { $sort: { totalStock: -1 } },
      {
        $project: {
          category: "$_id",
          totalStock: 1,
          totalProducts: 1,
          avgPrice: 1,
          _id: 0
        }
      }
    ]);
    
    // Tổng giá trị tồn kho
    const totalInventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          value: { $sum: { $multiply: ["$price", "$stock"] } },
          totalItems: { $sum: "$stock" }
        }
      }
    ]);

    res.json({
      lowStockProducts,
      outOfStockProducts,
      stockByCategory,
      totalInventoryValue: totalInventoryValue.length ? totalInventoryValue[0] : { value: 0, totalItems: 0 },
      lowStockThreshold: Number(lowStockThreshold)
    });

  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thông tin tồn kho", 
      error: error.message 
    });
  }
};

// Lấy thông tin người dùng
exports.getUserStats = async (req, res) => {
  try {
    const { timeRange = 'month' } = req.query;
    let startDate;
    const now = new Date();
    
    // Xác định khoảng thời gian
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1)); // Mặc định 1 tháng
    }

    // Thống kê người dùng mới theo ngày
    const newUsersByDay = await User.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    // Tổng số người dùng và phân loại
    const userTypes = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          role: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    // Top người dùng theo đơn hàng
    const topUsersByOrders = await Order.aggregate([
      {
        $match: {
          user: { $ne: null } // Chỉ lấy những đơn có thông tin người dùng
        }
      },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          email: "$userInfo.email",
          orderCount: 1,
          totalSpent: 1
        }
      }
    ]);

    // Tính số người dùng đã xác thực và chưa xác thực
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    res.json({
      newUsersByDay,
      userTypes,
      topUsersByOrders,
      verifiedUsers,
      unverifiedUsers,
      timeRange
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thông tin người dùng", 
      error: error.message 
    });
  }
};

// Lấy thống kê đơn hàng
exports.getOrderStats = async (req, res) => {
  try {
    // Thống kê trạng thái đơn hàng
    const orderStatusCount = await Order.aggregate([
      {
        $group: {
          _id: { delivered: "$isDelivered" },
          count: { $sum: 1 },
          totalValue: { $sum: "$totalPrice" }
        }
      },
      {
        $project: {
          status: {
            $cond: { if: "$_id.delivered", then: "Đã giao hàng", else: "Chưa giao hàng" }
          },
          count: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);

    // Giá trị đơn hàng trung bình theo tháng
    const averageOrderByMonth = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          averageValue: { $avg: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          month: "$_id",
          averageValue: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    // Đơn hàng gần đây cần xử lý
    const recentOrders = await Order.find({ isDelivered: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id createdAt totalPrice shippingAddress.address')
      .lean();

    // Sắp xếp đơn hàng theo giá trị
    const ordersByValue = await Order.aggregate([
      {
        $group: {
          _id: null,
          averageValue: { $avg: "$totalPrice" },
          minValue: { $min: "$totalPrice" },
          maxValue: { $max: "$totalPrice" }
        }
      }
    ]);

    res.json({
      orderStatusCount,
      averageOrderByMonth,
      recentOrders,
      orderValueStats: ordersByValue.length ? ordersByValue[0] : { averageValue: 0, minValue: 0, maxValue: 0 }
    });

  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thống kê đơn hàng", 
      error: error.message 
    });
  }
};

// Lấy dữ liệu so sánh với kỳ trước
exports.getComparisonStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Kỳ hiện tại: 30 ngày gần đây
    const currentPeriodStart = new Date(now.getTime());
    currentPeriodStart.setDate(currentPeriodStart.getDate() - 30);
    
    // Kỳ trước: 30 ngày trước kỳ hiện tại
    const previousPeriodStart = new Date(currentPeriodStart.getTime());
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    
    // Doanh thu kỳ hiện tại
    const currentRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: currentPeriodStart,
            $lte: now
          }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Doanh thu kỳ trước
    const previousRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { 
            $gte: previousPeriodStart,
            $lt: currentPeriodStart
          }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Người dùng mới kỳ hiện tại
    const currentNewUsers = await User.countDocuments({
      createdAt: { 
        $gte: currentPeriodStart,
        $lte: now
      }
    });

    // Người dùng mới kỳ trước
    const previousNewUsers = await User.countDocuments({
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: currentPeriodStart
      }
    });

    // Tính % thay đổi
    const calculateChange = (current, previous) => {
      if (!previous) return 100; // Nếu kỳ trước = 0, tăng 100%
      return ((current - previous) / previous) * 100;
    };

    // Lấy giá trị hoặc mặc định = 0
    const getValue = (data, field) => {
      if (!data || data.length === 0) return 0;
      return data[0][field];
    };

    const currentRevenueValue = getValue(currentRevenue, 'total');
    const previousRevenueValue = getValue(previousRevenue, 'total');
    const currentOrderCount = getValue(currentRevenue, 'count');
    const previousOrderCount = getValue(previousRevenue, 'count');

    res.json({
      revenue: {
        current: currentRevenueValue,
        previous: previousRevenueValue,
        percentChange: calculateChange(currentRevenueValue, previousRevenueValue).toFixed(2)
      },
      orders: {
        current: currentOrderCount,
        previous: previousOrderCount,
        percentChange: calculateChange(currentOrderCount, previousOrderCount).toFixed(2)
      },
      users: {
        current: currentNewUsers,
        previous: previousNewUsers,
        percentChange: calculateChange(currentNewUsers, previousNewUsers).toFixed(2)
      },
      periods: {
        current: {
          start: currentPeriodStart,
          end: now
        },
        previous: {
          start: previousPeriodStart,
          end: currentPeriodStart
        }
      }
    });

  } catch (error) {
    console.error("Error fetching comparison stats:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy dữ liệu so sánh", 
      error: error.message 
    });
  }
}; 
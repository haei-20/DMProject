const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { getFrequentlyBoughtTogether } = require("../services/recommendationService");
const Category = require("../models/Category");
const Attribute = require("../models/Attribute");
const CustomerGroup = require("../models/CustomerGroup");
const Discount = require("../models/Discount");
const Coupon = require("../models/Coupon");
const Banner = require("../models/Banner");
const Setting = require("../models/Setting");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách người dùng", error });
  }
};

// Alias for getAllUsers for route consistency
exports.getUsers = exports.getAllUsers;

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin người dùng", error });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.role = req.body.role || user.role;
      user.isVerified = req.body.hasOwnProperty('isVerified') 
        ? req.body.isVerified 
        : user.isVerified;
      
      if (req.body.address) {
        user.address = {
          street: req.body.address.street || user.address?.street,
          city: req.body.address.city || user.address?.city,
          state: req.body.address.state || user.address?.state,
          zipCode: req.body.address.zipCode || user.address?.zipCode,
          country: req.body.address.country || user.address?.country || "Vietnam",
        };
      }
      
      const updatedUser = await user.save();
      
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        phone: updatedUser.phone,
        address: updatedUser.address
      });
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật người dùng", error });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: "Không thể xóa tài khoản quản trị viên" });
      }
      
      await user.deleteOne();
      res.status(200).json({ message: "Xóa người dùng thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa người dùng", error });
  }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Admin
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm", error });
  }
};

// Alias for getAllProducts for route consistency
exports.getProducts = exports.getAllProducts;

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa sản phẩm", error });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Admin
exports.getAllOrders = async (req, res) => {
  try {
    console.log("====== GET ALL ORDERS CALLED ======");
    
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Parse filtering parameters
    const status = req.query.status || '';
    const search = req.query.search || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const minTotal = parseFloat(req.query.minTotal) || 0;
    const maxTotal = parseFloat(req.query.maxTotal) || Number.MAX_SAFE_INTEGER;
    
    // Build filter object
    const filter = {};
    
    // Điều kiện cố định: Chỉ lấy đơn hàng từ 2h sáng ngày 20/05/2025
    // Sử dụng thời gian tháng 5 năm 2025, nhưng để đảm bảo hiển thị đơn hàng hiện tại cho demo
    // chúng ta sẽ tạm thời bỏ qua điều kiện này
    // const fixedStartDate = new Date('2025-05-20T02:00:00.000Z');
    // filter.createdAt = { $gte: fixedStartDate };
    // console.log('Fixed start date filter:', fixedStartDate);
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by user date range if provided
    if (startDate || endDate) {
      filter.createdAt = filter.createdAt || {};
      if (startDate) {
        const userStartDate = new Date(startDate);
        filter.createdAt.$gte = userStartDate;
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateObj;
      }
    }
    
    // Filter by price range
    filter.totalPrice = { $gte: minTotal, $lte: maxTotal };
    
    // Search by order ID or customer name/email
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Query parameters:', { page, limit, status, search, startDate, endDate });
    console.log('Final filter:', JSON.stringify(filter));
    
    // Get all orders first for debugging
    const allOrders = await Order.find({}).lean();
    console.log(`DEBUG: Total orders in DB: ${allOrders.length}`);
    if (allOrders.length > 0) {
      console.log(`DEBUG: First order date: ${allOrders[0].createdAt}`);
    }
    
    // Get total count for pagination
    const totalCount = await Order.countDocuments(filter);
    console.log(`Total count with filter: ${totalCount}`);
    
    // Get paginated orders
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${orders.length} orders matching filter`);
    
    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ message: "Lỗi lấy danh sách đơn hàng", error });
  }
};

// Alias for getAllOrders for route consistency
exports.getOrders = exports.getAllOrders;

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Admin
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name image');
    
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin đơn hàng", error });
  }
};

// @desc    Get pending orders
// @route   GET /api/admin/orders/pending
// @access  Admin
exports.getPendingOrders = async (req, res) => {
  try {
    // Updated to get orders with status 'pending' or 'placed'
    const orders = await Order.find({ status: { $in: ['pending', 'placed'] } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    console.log("Successfully retrieved pending orders:", orders.length);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getPendingOrders:", error);
    res.status(500).json({ message: "Lỗi lấy thông tin đơn hàng", error: error.toString() });
  }
};

// @desc    Get processing orders
// @route   GET /api/admin/orders/processing
// @access  Admin
exports.getProcessingOrders = async (req, res) => {
  try {
    // Updated to get orders with status 'confirmed' or 'processing'
    const orders = await Order.find({ status: { $in: ['confirmed', 'processing'] } })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    console.log("Successfully retrieved processing orders:", orders.length);
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in getProcessingOrders:", error);
    res.status(500).json({ message: "Lỗi lấy thông tin đơn hàng", error: error.toString() });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const oldStatus = order.status; // Lưu trạng thái cũ để log
      order.status = req.body.status || order.status;
      
      // Cập nhật các trường liên quan dựa trên trạng thái mới
      switch(req.body.status) {
        case 'delivered':
          order.isDelivered = true;
          order.deliveredAt = Date.now();
          break;
        case 'paid':
          order.isPaid = true;
          order.paidAt = Date.now();
          break;
        case 'placed':
        case 'confirmed':
        case 'processing':
          // Không cần thay đổi các trường khác
          break;
        case 'shipped':
          // Không cần thay đổi các trường khác
          break;
        case 'cancelled':
          // Có thể thêm logic để trả lại hàng tồn kho, hủy thanh toán, v.v.
          break;
        case 'pending':
          // Đặt lại các trạng thái nếu cần
          if (oldStatus === 'delivered' || oldStatus === 'cancelled') {
            order.isDelivered = false;
            order.deliveredAt = undefined;
          }
          if (oldStatus === 'paid') {
            // Thận trọng khi đặt lại trạng thái thanh toán
            // order.isPaid = false;
            // order.paidAt = undefined;
          }
          break;
        default:
          break;
      }
      
      // Lưu ghi chú nếu có
      if (req.body.note) {
        order.note = req.body.note;
      }
      
      const updatedOrder = await order.save();
      
      // Log thay đổi trạng thái
      console.log(`Order ${order._id} status updated: ${oldStatus} -> ${updatedOrder.status}`);
      
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Lỗi cập nhật đơn hàng", error });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Count total users
    const userCount = await User.countDocuments();
    
    // Count total products
    const productCount = await Product.countDocuments();
    
    // Count total orders
    const orderCount = await Order.countDocuments();
    
    // Calculate total revenue
    const orders = await Order.find({ isPaid: true });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    
    res.status(200).json({
      userCount,
      productCount,
      orderCount,
      totalRevenue,
      recentOrders,
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thống kê", error });
  }
};

// @desc    Get sales reports
// @route   GET /api/admin/reports/sales
// @access  Admin
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = { isPaid: true };
    
    if (startDate && endDate) {
      dateFilter.paidAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const salesData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } 
          },
          totalSales: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json(salesData);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo báo cáo bán hàng", error });
  }
};

// @desc    Get top selling products
// @route   GET /api/admin/reports/top-products
// @access  Admin
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalSold: { $sum: "$orderItems.qty" },
          totalRevenue: { $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] } }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          name: "$productDetails.name",
          totalSold: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json(topProducts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách sản phẩm bán chạy", error });
  }
};

// @desc    Get user analytics
// @route   GET /api/admin/reports/user-analytics
// @access  Admin
exports.getUserAnalytics = async (req, res) => {
  try {
    // User registration statistics by month
    const userRegistrations = await User.aggregate([
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" }, 
            year: { $year: "$createdAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Most active users (by order count)
    const activeUsers = await Order.aggregate([
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 1,
          name: "$userDetails.name",
          email: "$userDetails.email",
          orderCount: 1,
          totalSpent: 1
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      userRegistrations,
      activeUsers
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin phân tích người dùng", error });
  }
};

// @desc    Get frequently bought together products for creating combos
// @route   GET /api/admin/reports/frequently-bought-together
// @access  Admin
exports.getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const minSupport = parseFloat(req.query.minSupport) || 0.05;
    const limit = parseInt(req.query.limit) || 20;
    
    const frequentItemsets = await getFrequentlyBoughtTogether(minSupport, limit);
    
    res.status(200).json({
      frequentItemsets,
      message: "Danh sách sản phẩm thường được mua cùng nhau",
      success: true
    });
  } catch (error) {
    console.error("Error getting frequently bought together products:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy sản phẩm thường mua cùng nhau", 
      error: error.message,
      success: false
    });
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Admin
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách danh mục", error });
  }
};

// @desc    Get category by ID
// @route   GET /api/admin/categories/:id
// @access  Admin
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (category) {
      res.status(200).json(category);
    } else {
      res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin danh mục", error });
  }
};

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl, parentId, isActive } = req.body;
    
    const category = new Category({
      name,
      description,
      imageUrl,
      parentId: parentId || null,
      isActive: isActive !== undefined ? isActive : true
    });
    
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo danh mục", error });
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, imageUrl, parentId, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (category) {
      category.name = name || category.name;
      category.description = description || category.description;
      category.imageUrl = imageUrl || category.imageUrl;
      category.parentId = parentId !== undefined ? parentId : category.parentId;
      category.isActive = isActive !== undefined ? isActive : category.isActive;
      
      const updatedCategory = await category.save();
      res.status(200).json(updatedCategory);
    } else {
      res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật danh mục", error });
  }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (category) {
      // Check if there are products using this category
      const productsWithCategory = await Product.countDocuments({ category: req.params.id });
      
      if (productsWithCategory > 0) {
        return res.status(400).json({ 
          message: "Không thể xóa danh mục này vì có sản phẩm đang sử dụng" 
        });
      }
      
      // Check if there are child categories
      const childCategories = await Category.countDocuments({ parentId: req.params.id });
      
      if (childCategories > 0) {
        return res.status(400).json({ 
          message: "Không thể xóa danh mục này vì có danh mục con" 
        });
      }
      
      await category.deleteOne();
      res.status(200).json({ message: "Danh mục đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa danh mục", error });
  }
};

// @desc    Get all attributes
// @route   GET /api/admin/attributes
// @access  Admin
exports.getAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find({}).sort({ name: 1 });
    res.status(200).json(attributes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách thuộc tính", error });
  }
};

// @desc    Get attribute by ID
// @route   GET /api/admin/attributes/:id
// @access  Admin
exports.getAttributeById = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    
    if (attribute) {
      res.status(200).json(attribute);
    } else {
      res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy thông tin thuộc tính", error });
  }
};

// @desc    Create new attribute
// @route   POST /api/admin/attributes
// @access  Admin
exports.createAttribute = async (req, res) => {
  try {
    const { name, values, isFilterable, isRequired } = req.body;
    
    const attribute = new Attribute({
      name,
      values: values || [],
      isFilterable: isFilterable !== undefined ? isFilterable : true,
      isRequired: isRequired !== undefined ? isRequired : false
    });
    
    const createdAttribute = await attribute.save();
    res.status(201).json(createdAttribute);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo thuộc tính", error });
  }
};

// @desc    Update attribute
// @route   PUT /api/admin/attributes/:id
// @access  Admin
exports.updateAttribute = async (req, res) => {
  try {
    const { name, values, isFilterable, isRequired } = req.body;
    
    const attribute = await Attribute.findById(req.params.id);
    
    if (attribute) {
      attribute.name = name || attribute.name;
      attribute.values = values || attribute.values;
      attribute.isFilterable = isFilterable !== undefined ? isFilterable : attribute.isFilterable;
      attribute.isRequired = isRequired !== undefined ? isRequired : attribute.isRequired;
      
      const updatedAttribute = await attribute.save();
      res.status(200).json(updatedAttribute);
    } else {
      res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật thuộc tính", error });
  }
};

// @desc    Delete attribute
// @route   DELETE /api/admin/attributes/:id
// @access  Admin
exports.deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    
    if (attribute) {
      // Check if there are products using this attribute
      // This would require a more complex query depending on your product schema
      // For example:
      // const productsWithAttribute = await Product.countDocuments({ 
      //   [`attributes.${attribute.name}`]: { $exists: true } 
      // });
      
      // if (productsWithAttribute > 0) {
      //   return res.status(400).json({ 
      //     message: "Không thể xóa thuộc tính này vì có sản phẩm đang sử dụng" 
      //   });
      // }
      
      await attribute.deleteOne();
      res.status(200).json({ message: "Thuộc tính đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thuộc tính" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa thuộc tính", error });
  }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Admin
exports.getCustomers = async (req, res) => {
  try {
    // Find all users with role 'user' (excluding admins)
    const customers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Enhance customer data with order information
    const enhancedCustomers = await Promise.all(customers.map(async (customer) => {
      // Get customer's orders
      const orders = await Order.find({ user: customer._id });
      
      // Calculate total spent and return enhanced customer object
      const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      return {
        ...customer.toJSON(),
        orderCount: orders.length,
        totalSpent: totalSpent,
        lastOrderDate: orders.length > 0 ? 
          orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : 
          null
      };
    }));

    console.log(`Found ${enhancedCustomers.length} customers`);
    res.status(200).json(enhancedCustomers);
  } catch (error) {
    console.error("Error in getCustomers:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách hàng", error: error.toString() });
  }
};

// @desc    Get customer by ID
// @route   GET /api/admin/customers/:id
// @access  Admin
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    
    if (!customer) {
      return res.status(404).json({ message: "Không tìm thấy khách hàng" });
    }
    
    // Get customer's orders
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 });
    
    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const enhancedCustomer = {
      ...customer.toJSON(),
      orders,
      orderCount: orders.length,
      totalSpent
    };
    
    res.status(200).json(enhancedCustomer);
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin khách hàng", error: error.toString() });
  }
};

// @desc    Get customer groups
// @route   GET /api/admin/customers/groups
// @access  Admin
exports.getCustomerGroups = async (req, res) => {
  try {
    const customerGroups = await CustomerGroup.find({});
    res.status(200).json(customerGroups);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách nhóm khách hàng", error });
  }
};

// @desc    Create customer group
// @route   POST /api/admin/customers/groups
// @access  Admin
exports.createCustomerGroup = async (req, res) => {
  try {
    const { name, description, discountPercentage, minimumOrder } = req.body;
    
    const customerGroup = new CustomerGroup({
      name,
      description,
      discountPercentage: discountPercentage || 0,
      minimumOrder: minimumOrder || 0
    });
    
    const createdGroup = await customerGroup.save();
    res.status(201).json(createdGroup);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo nhóm khách hàng", error });
  }
};

// @desc    Update customer group
// @route   PUT /api/admin/customers/groups/:id
// @access  Admin
exports.updateCustomerGroup = async (req, res) => {
  try {
    const { name, description, discountPercentage, minimumOrder } = req.body;
    
    const customerGroup = await CustomerGroup.findById(req.params.id);
    
    if (customerGroup) {
      customerGroup.name = name || customerGroup.name;
      customerGroup.description = description || customerGroup.description;
      customerGroup.discountPercentage = discountPercentage !== undefined 
        ? discountPercentage 
        : customerGroup.discountPercentage;
      customerGroup.minimumOrder = minimumOrder !== undefined 
        ? minimumOrder 
        : customerGroup.minimumOrder;
      
      const updatedGroup = await customerGroup.save();
      res.status(200).json(updatedGroup);
    } else {
      res.status(404).json({ message: "Không tìm thấy nhóm khách hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật nhóm khách hàng", error });
  }
};

// @desc    Delete customer group
// @route   DELETE /api/admin/customers/groups/:id
// @access  Admin
exports.deleteCustomerGroup = async (req, res) => {
  try {
    const customerGroup = await CustomerGroup.findById(req.params.id);
    
    if (customerGroup) {
      // Check if there are customers in this group
      const customersInGroup = await User.countDocuments({ customerGroup: req.params.id });
      
      if (customersInGroup > 0) {
        return res.status(400).json({ 
          message: "Không thể xóa nhóm này vì có khách hàng đang thuộc về nhóm này" 
        });
      }
      
      await customerGroup.deleteOne();
      res.status(200).json({ message: "Nhóm khách hàng đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy nhóm khách hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa nhóm khách hàng", error });
  }
};

// @desc    Get all discounts
// @route   GET /api/admin/marketing/discounts
// @access  Admin
exports.getDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({}).sort({ createdAt: -1 });
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách khuyến mãi", error });
  }
};

// @desc    Create discount
// @route   POST /api/admin/marketing/discounts
// @access  Admin
exports.createDiscount = async (req, res) => {
  try {
    const { 
      name, description, discountType, discountValue, 
      minPurchase, maxDiscount, startDate, endDate,
      applicableProducts, applicableCategories, isActive 
    } = req.body;
    
    const discount = new Discount({
      name,
      description,
      discountType: discountType || 'percentage', // 'percentage' or 'fixed'
      discountValue: discountValue || 0,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      isActive: isActive !== undefined ? isActive : true
    });
    
    const createdDiscount = await discount.save();
    res.status(201).json(createdDiscount);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo khuyến mãi", error });
  }
};

// @desc    Update discount
// @route   PUT /api/admin/marketing/discounts/:id
// @access  Admin
exports.updateDiscount = async (req, res) => {
  try {
    const { 
      name, description, discountType, discountValue, 
      minPurchase, maxDiscount, startDate, endDate,
      applicableProducts, applicableCategories, isActive 
    } = req.body;
    
    const discount = await Discount.findById(req.params.id);
    
    if (discount) {
      discount.name = name || discount.name;
      discount.description = description || discount.description;
      discount.discountType = discountType || discount.discountType;
      discount.discountValue = discountValue !== undefined ? discountValue : discount.discountValue;
      discount.minPurchase = minPurchase !== undefined ? minPurchase : discount.minPurchase;
      discount.maxDiscount = maxDiscount !== undefined ? maxDiscount : discount.maxDiscount;
      discount.startDate = startDate || discount.startDate;
      discount.endDate = endDate || discount.endDate;
      discount.applicableProducts = applicableProducts || discount.applicableProducts;
      discount.applicableCategories = applicableCategories || discount.applicableCategories;
      discount.isActive = isActive !== undefined ? isActive : discount.isActive;
      
      const updatedDiscount = await discount.save();
      res.status(200).json(updatedDiscount);
    } else {
      res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật khuyến mãi", error });
  }
};

// @desc    Delete discount
// @route   DELETE /api/admin/marketing/discounts/:id
// @access  Admin
exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (discount) {
      await discount.deleteOne();
      res.status(200).json({ message: "Khuyến mãi đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy khuyến mãi" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa khuyến mãi", error });
  }
};

// @desc    Get all coupons
// @route   GET /api/admin/marketing/coupons
// @access  Admin
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách mã giảm giá", error });
  }
};

// @desc    Create coupon
// @route   POST /api/admin/marketing/coupons
// @access  Admin
exports.createCoupon = async (req, res) => {
  try {
    const { 
      code, description, discountType, discountValue, 
      minPurchase, maxDiscount, startDate, endDate,
      maxUsage, usageCount, isActive 
    } = req.body;
    
    const coupon = new Coupon({
      code,
      description,
      discountType: discountType || 'percentage', // 'percentage' or 'fixed'
      discountValue: discountValue || 0,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      maxUsage: maxUsage || null,
      usageCount: usageCount || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    
    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo mã giảm giá", error });
  }
};

// @desc    Update coupon
// @route   PUT /api/admin/marketing/coupons/:id
// @access  Admin
exports.updateCoupon = async (req, res) => {
  try {
    const { 
      code, description, discountType, discountValue, 
      minPurchase, maxDiscount, startDate, endDate,
      maxUsage, usageCount, isActive 
    } = req.body;
    
    const coupon = await Coupon.findById(req.params.id);
    
    if (coupon) {
      coupon.code = code || coupon.code;
      coupon.description = description || coupon.description;
      coupon.discountType = discountType || coupon.discountType;
      coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
      coupon.minPurchase = minPurchase !== undefined ? minPurchase : coupon.minPurchase;
      coupon.maxDiscount = maxDiscount !== undefined ? maxDiscount : coupon.maxDiscount;
      coupon.startDate = startDate || coupon.startDate;
      coupon.endDate = endDate || coupon.endDate;
      coupon.maxUsage = maxUsage !== undefined ? maxUsage : coupon.maxUsage;
      coupon.usageCount = usageCount !== undefined ? usageCount : coupon.usageCount;
      coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
      
      const updatedCoupon = await coupon.save();
      res.status(200).json(updatedCoupon);
    } else {
      res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật mã giảm giá", error });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/marketing/coupons/:id
// @access  Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (coupon) {
      await coupon.deleteOne();
      res.status(200).json({ message: "Mã giảm giá đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa mã giảm giá", error });
  }
};

// @desc    Get all banners
// @route   GET /api/admin/marketing/banners
// @access  Admin
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ order: 1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách banner", error });
  }
};

// @desc    Create banner
// @route   POST /api/admin/marketing/banners
// @access  Admin
exports.createBanner = async (req, res) => {
  try {
    const { 
      title, imageUrl, linkTo, startDate, 
      endDate, isActive, order, position 
    } = req.body;
    
    const banner = new Banner({
      title,
      imageUrl,
      linkTo: linkTo || '#',
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      position: position || 'home_main' // home_main, home_secondary, category_page, etc.
    });
    
    const createdBanner = await banner.save();
    res.status(201).json(createdBanner);
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo banner", error });
  }
};

// @desc    Update banner
// @route   PUT /api/admin/marketing/banners/:id
// @access  Admin
exports.updateBanner = async (req, res) => {
  try {
    const { 
      title, imageUrl, linkTo, startDate, 
      endDate, isActive, order, position 
    } = req.body;
    
    const banner = await Banner.findById(req.params.id);
    
    if (banner) {
      banner.title = title || banner.title;
      banner.imageUrl = imageUrl || banner.imageUrl;
      banner.linkTo = linkTo || banner.linkTo;
      banner.startDate = startDate || banner.startDate;
      banner.endDate = endDate || banner.endDate;
      banner.isActive = isActive !== undefined ? isActive : banner.isActive;
      banner.order = order !== undefined ? order : banner.order;
      banner.position = position || banner.position;
      
      const updatedBanner = await banner.save();
      res.status(200).json(updatedBanner);
    } else {
      res.status(404).json({ message: "Không tìm thấy banner" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật banner", error });
  }
};

// @desc    Delete banner
// @route   DELETE /api/admin/marketing/banners/:id
// @access  Admin
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (banner) {
      await banner.deleteOne();
      res.status(200).json({ message: "Banner đã được xóa thành công" });
    } else {
      res.status(404).json({ message: "Không tìm thấy banner" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa banner", error });
  }
};

// @desc    Get general settings
// @route   GET /api/admin/settings/general
// @access  Admin
exports.getGeneralSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne({ type: 'general' });
    
    if (settings) {
      res.status(200).json(settings);
    } else {
      // Create default settings if not found
      const defaultSettings = await Setting.create({
        type: 'general',
        data: {
          siteName: 'Retail Web App',
          siteDescription: 'Your one-stop online shopping destination',
          logo: '/images/logo.png',
          email: 'contact@retailwebapp.com',
          phone: '+84 123 456 789',
          address: 'Hanoi, Vietnam',
          socialLinks: {
            facebook: 'https://facebook.com',
            instagram: 'https://instagram.com',
            twitter: 'https://twitter.com'
          }
        }
      });
      
      res.status(200).json(defaultSettings);
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy cài đặt chung", error });
  }
};

// @desc    Update general settings
// @route   PUT /api/admin/settings/general
// @access  Admin
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { siteName, siteDescription, logo, email, phone, address, socialLinks } = req.body;
    
    let settings = await Setting.findOne({ type: 'general' });
    
    if (settings) {
      settings.data = {
        ...settings.data,
        siteName: siteName || settings.data.siteName,
        siteDescription: siteDescription || settings.data.siteDescription,
        logo: logo || settings.data.logo,
        email: email || settings.data.email,
        phone: phone || settings.data.phone,
        address: address || settings.data.address,
        socialLinks: socialLinks || settings.data.socialLinks
      };
    } else {
      settings = new Setting({
        type: 'general',
        data: {
          siteName,
          siteDescription,
          logo,
          email,
          phone,
          address,
          socialLinks
        }
      });
    }
    
    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật cài đặt chung", error });
  }
};

// @desc    Get payment settings
// @route   GET /api/admin/settings/payment
// @access  Admin
exports.getPaymentSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne({ type: 'payment' });
    
    if (settings) {
      res.status(200).json(settings);
    } else {
      // Create default settings if not found
      const defaultSettings = await Setting.create({
        type: 'payment',
        data: {
          currency: 'VND',
          paymentMethods: {
            cod: {
              enabled: true,
              title: 'Thanh toán khi nhận hàng'
            },
            bankTransfer: {
              enabled: true,
              title: 'Chuyển khoản ngân hàng',
              instructions: 'Vui lòng chuyển tiền đến số tài khoản: 123456789'
            },
            momo: {
              enabled: false,
              title: 'MoMo',
              apiKey: '',
              secretKey: ''
            },
            vnpay: {
              enabled: false,
              title: 'VNPAY',
              tmnCode: '',
              hashSecret: '',
              sandbox: true
            }
          }
        }
      });
      
      res.status(200).json(defaultSettings);
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy cài đặt thanh toán", error });
  }
};

// @desc    Update payment settings
// @route   PUT /api/admin/settings/payment
// @access  Admin
exports.updatePaymentSettings = async (req, res) => {
  try {
    const { currency, paymentMethods } = req.body;
    
    let settings = await Setting.findOne({ type: 'payment' });
    
    if (settings) {
      settings.data = {
        ...settings.data,
        currency: currency || settings.data.currency,
        paymentMethods: paymentMethods || settings.data.paymentMethods
      };
    } else {
      settings = new Setting({
        type: 'payment',
        data: {
          currency,
          paymentMethods
        }
      });
    }
    
    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật cài đặt thanh toán", error });
  }
};

// @desc    Get shipping settings
// @route   GET /api/admin/settings/shipping
// @access  Admin
exports.getShippingSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne({ type: 'shipping' });
    
    if (settings) {
      res.status(200).json(settings);
    } else {
      // Create default settings if not found
      const defaultSettings = await Setting.create({
        type: 'shipping',
        data: {
          shippingMethods: {
            standard: {
              enabled: true,
              title: 'Giao hàng tiêu chuẩn',
              price: 30000,
              estimatedDelivery: '3-5 ngày'
            },
            express: {
              enabled: true,
              title: 'Giao hàng nhanh',
              price: 50000,
              estimatedDelivery: '1-2 ngày'
            }
          },
          freeShippingThreshold: 500000
        }
      });
      
      res.status(200).json(defaultSettings);
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy cài đặt vận chuyển", error });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/admin/settings/shipping
// @access  Admin
exports.updateShippingSettings = async (req, res) => {
  try {
    const { shippingMethods, freeShippingThreshold } = req.body;
    
    let settings = await Setting.findOne({ type: 'shipping' });
    
    if (settings) {
      settings.data = {
        ...settings.data,
        shippingMethods: shippingMethods || settings.data.shippingMethods,
        freeShippingThreshold: freeShippingThreshold !== undefined 
          ? freeShippingThreshold 
          : settings.data.freeShippingThreshold
      };
    } else {
      settings = new Setting({
        type: 'shipping',
        data: {
          shippingMethods,
          freeShippingThreshold
        }
      });
    }
    
    const updatedSettings = await settings.save();
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật cài đặt vận chuyển", error });
  }
};

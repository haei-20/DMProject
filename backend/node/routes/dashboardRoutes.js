const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// Tất cả các routes dashboard yêu cầu quyền admin
router.use(protect, isAdmin);

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Lấy số liệu tổng quan cho dashboard
 *     description: Lấy dữ liệu tổng quan về doanh thu, đơn hàng, người dùng
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *         description: Khoảng thời gian cho dữ liệu
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/overview", dashboardController.getOverviewStats);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Lấy thống kê cơ bản cho dashboard
 *     description: Lấy thống kê về doanh thu, đơn hàng, khách hàng và sản phẩm
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/stats", dashboardController.getStats);

/**
 * @swagger
 * /api/dashboard/revenue:
 *   get:
 *     summary: Lấy dữ liệu doanh thu
 *     description: Lấy dữ liệu doanh thu theo thời gian
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Khoảng thời gian cho dữ liệu
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: Cách nhóm dữ liệu
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/revenue", dashboardController.getRevenueData);

/**
 * @swagger
 * /api/dashboard/top-products:
 *   get:
 *     summary: Lấy sản phẩm bán chạy
 *     description: Lấy danh sách sản phẩm bán chạy nhất
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng sản phẩm trả về
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Khoảng thời gian
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/top-products", dashboardController.getTopSellingProducts);

/**
 * @swagger
 * /api/dashboard/inventory:
 *   get:
 *     summary: Lấy thông tin tồn kho
 *     description: Lấy thông tin tổng quan về tồn kho sản phẩm
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lowStockThreshold
 *         schema:
 *           type: integer
 *         description: Ngưỡng cảnh báo sắp hết hàng
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/inventory", dashboardController.getInventoryStats);

/**
 * @swagger
 * /api/dashboard/users:
 *   get:
 *     summary: Lấy thông tin người dùng
 *     description: Lấy thống kê về người dùng 
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Khoảng thời gian
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/users", dashboardController.getUserStats);

/**
 * @swagger
 * /api/dashboard/orders:
 *   get:
 *     summary: Lấy thống kê đơn hàng
 *     description: Lấy thông tin thống kê về đơn hàng
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/orders", dashboardController.getOrderStats);

/**
 * @swagger
 * /api/dashboard/comparison:
 *   get:
 *     summary: Lấy dữ liệu so sánh với kỳ trước
 *     description: So sánh số liệu hiện tại với kỳ trước
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */
router.get("/comparison", dashboardController.getComparisonStats);

module.exports = router; 
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const setupSwagger = require("./swagger");
const path = require("path");
require("dotenv").config();
const cron = require('node-cron');
const recommendationService = require('./services/recommendationService');

const app = express();

// Enable CORS - Cho phép tất cả các nguồn truy cập API
app.use(cors({
  origin: '*', // Cho phép tất cả các nguồn truy cập
  credentials: true
}));

app.use(express.json());

// Kết nối MongoDB
connectDB();

// Setup Swagger documentation
setupSwagger(app);

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log tất cả các requests để debug
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  // Log thêm chi tiết headers cho việc debug
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Route kiểm tra API đang hoạt động
app.get("/", (req, res) => res.send("API is running"));
app.get("/api", (req, res) => res.send("API is running"));

// Add status endpoint for health checks
app.get("/api/status", (req, res) => {
  res.json({ 
    status: "success", 
    message: "API server is running", 
    timestamp: new Date().toISOString() 
  });
});

// Routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const recommendRoutes = require("./routes/recommendRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const couponRoutes = require("./routes/couponRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const uploadRoutes = require('./routes/uploadRoutes');
const comboRoutes = require('./routes/comboRoutes');

// Áp dụng routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/combos', comboRoutes);

// Thêm cron job để chạy FP-Growth mỗi 3 ngày
cron.schedule('0 0 */3 * *', async () => {
  console.log('Running FP-Growth algorithm update...');
  try {
    await recommendationService.updateFPGrowthRecommendations();
    console.log('FP-Growth algorithm update completed successfully');
  } catch (error) {
    console.error('Error updating FP-Growth recommendations:', error);
  }
});

// Thêm cron job để chạy Apriori mỗi 3 ngày
cron.schedule('0 0 */3 * *', async () => {
  console.log('Running Apriori algorithm update...');
  try {
    await recommendationService.updateAprioriRecommendations();
    console.log('Apriori algorithm update completed successfully');
  } catch (error) {
    console.error('Error updating Apriori recommendations:', error);
  }
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy đường dẫn" });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Lỗi máy chủ",
    error: process.env.NODE_ENV === "production" ? {} : err.stack
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please choose another port or kill the process using it.`);
    process.exit(1); // thoát chương trình
  } else {
    console.error("❌ Server error:", err);
  }
});





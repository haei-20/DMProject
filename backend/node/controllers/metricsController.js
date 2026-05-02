const metricsService = require('../services/metricsService');

// Ghi nhận lượt hiển thị đề xuất
exports.trackImpression = async (req, res) => {
  try {
    const { type, productIds, userId, sessionId } = req.body;
    
    if (!type || !productIds || productIds.length === 0) {
      return res.status(400).json({
        message: "Thiếu thông tin cần thiết",
        success: false
      });
    }
    
    const result = await metricsService.trackImpression(type, productIds, userId, sessionId);
    
    res.status(200).json({
      message: "Đã ghi nhận lượt hiển thị",
      success: result
    });
  } catch (error) {
    console.error("Error tracking impression:", error);
    res.status(500).json({
      message: "Lỗi khi ghi nhận lượt hiển thị",
      error: error.message,
      success: false
    });
  }
};

// Ghi nhận lượt click vào sản phẩm đề xuất
exports.trackClick = async (req, res) => {
  try {
    const { type, productId, userId, sessionId } = req.body;
    
    if (!type || !productId) {
      return res.status(400).json({
        message: "Thiếu thông tin cần thiết",
        success: false
      });
    }
    
    const result = await metricsService.trackClick(type, productId, userId, sessionId);
    
    res.status(200).json({
      message: "Đã ghi nhận lượt click",
      success: result
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({
      message: "Lỗi khi ghi nhận lượt click",
      error: error.message,
      success: false
    });
  }
};

// Ghi nhận lượt thêm sản phẩm đề xuất vào giỏ hàng
exports.trackAddToCart = async (req, res) => {
  try {
    const { type, productId, userId, sessionId } = req.body;
    
    if (!type || !productId) {
      return res.status(400).json({
        message: "Thiếu thông tin cần thiết",
        success: false
      });
    }
    
    const result = await metricsService.trackAddToCart(type, productId, userId, sessionId);
    
    res.status(200).json({
      message: "Đã ghi nhận thêm vào giỏ hàng",
      success: result
    });
  } catch (error) {
    console.error("Error tracking add to cart:", error);
    res.status(500).json({
      message: "Lỗi khi ghi nhận thêm vào giỏ hàng",
      error: error.message,
      success: false
    });
  }
};

// Ghi nhận lượt mua sản phẩm đề xuất
exports.trackPurchase = async (req, res) => {
  try {
    const { productIds, userId, sessionId } = req.body;
    
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        message: "Thiếu thông tin cần thiết",
        success: false
      });
    }
    
    const result = await metricsService.trackPurchase(productIds, userId, sessionId);
    
    res.status(200).json({
      message: "Đã ghi nhận lượt mua hàng",
      success: result
    });
  } catch (error) {
    console.error("Error tracking purchase:", error);
    res.status(500).json({
      message: "Lỗi khi ghi nhận lượt mua hàng",
      error: error.message,
      success: false
    });
  }
};

// Lấy CTR (Click-Through Rate) cho một loại đề xuất
exports.getClickThroughRate = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!type) {
      return res.status(400).json({
        message: "Thiếu thông tin loại đề xuất",
        success: false
      });
    }
    
    const result = await metricsService.getClickThroughRate(type, startDate, endDate);
    
    res.status(200).json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error("Error getting CTR:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tỷ lệ click",
      error: error.message,
      success: false
    });
  }
};

// Lấy tỷ lệ thêm vào giỏ hàng cho một loại đề xuất
exports.getCartAdditionRate = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!type) {
      return res.status(400).json({
        message: "Thiếu thông tin loại đề xuất",
        success: false
      });
    }
    
    const result = await metricsService.getCartAdditionRate(type, startDate, endDate);
    
    res.status(200).json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error("Error getting cart addition rate:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tỷ lệ thêm vào giỏ hàng",
      error: error.message,
      success: false
    });
  }
};

// Lấy tỷ lệ chuyển đổi cho một loại đề xuất
exports.getConversionRate = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (!type) {
      return res.status(400).json({
        message: "Thiếu thông tin loại đề xuất",
        success: false
      });
    }
    
    const result = await metricsService.getConversionRate(type, startDate, endDate);
    
    res.status(200).json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error("Error getting conversion rate:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tỷ lệ chuyển đổi",
      error: error.message,
      success: false
    });
  }
};

// Lấy tỷ lệ tăng trưởng giỏ hàng
exports.getAverageCartGrowth = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await metricsService.getAverageCartGrowth(startDate, endDate);
    
    res.status(200).json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error("Error getting cart growth:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tỷ lệ tăng trưởng giỏ hàng",
      error: error.message,
      success: false
    });
  }
};

// Lấy tất cả các chỉ số hiệu quả của hệ thống đề xuất
exports.getAllMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await metricsService.getAllMetrics(startDate, endDate);
    
    res.status(200).json({
      ...result,
      success: true
    });
  } catch (error) {
    console.error("Error getting all metrics:", error);
    res.status(500).json({
      message: "Lỗi khi lấy tất cả các chỉ số",
      error: error.message,
      success: false
    });
  }
}; 
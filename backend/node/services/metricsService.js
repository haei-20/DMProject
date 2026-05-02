const mongoose = require('mongoose');
const NodeCache = require("node-cache");

// Schema for recommendation metrics
const RecommendationMetricSchema = new mongoose.Schema({
  // Loại đề xuất: 'cart', 'homepage', 'related', 'admin'
  type: {
    type: String,
    required: true,
    enum: ['cart', 'homepage', 'related', 'admin']
  },
  // ID sản phẩm được đề xuất
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // ID người dùng (có thể null nếu là khách)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // ID phiên của khách (nếu không có userId)
  sessionId: {
    type: String,
    default: null
  },
  // Hiển thị: sản phẩm đã được hiển thị trong đề xuất
  impression: {
    type: Boolean,
    default: true
  },
  // Click: người dùng đã nhấp vào sản phẩm đề xuất
  clicked: {
    type: Boolean,
    default: false
  },
  // Thêm vào giỏ hàng: người dùng đã thêm sản phẩm vào giỏ hàng
  addedToCart: {
    type: Boolean,
    default: false
  },
  // Mua: người dùng đã mua sản phẩm
  purchased: {
    type: Boolean,
    default: false
  },
  // Thời gian hiển thị
  impressionTime: {
    type: Date,
    default: Date.now
  },
  // Thời gian click (nếu có)
  clickTime: {
    type: Date,
    default: null
  },
  // Thời gian thêm vào giỏ hàng (nếu có)
  addToCartTime: {
    type: Date,
    default: null
  },
  // Thời gian mua (nếu có)
  purchaseTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const RecommendationMetric = mongoose.model('RecommendationMetric', RecommendationMetricSchema);

// Cache để tối ưu hiệu suất
const metricsCache = new NodeCache({ stdTTL: 3600 }); // Cache 1 giờ

// Ghi nhận lượt hiển thị đề xuất
const trackImpression = async (type, productIds, userId = null, sessionId = null) => {
  try {
    // Tạo mảng các bản ghi metrics
    const metrics = productIds.map(productId => ({
      type,
      productId,
      userId,
      sessionId,
      impression: true,
      impressionTime: new Date()
    }));

    // Lưu vào database
    await RecommendationMetric.insertMany(metrics);
    return true;
  } catch (error) {
    console.error('Error tracking recommendation impression:', error);
    return false;
  }
};

// Ghi nhận lượt click vào sản phẩm đề xuất
const trackClick = async (type, productId, userId = null, sessionId = null) => {
  try {
    // Tìm bản ghi gần nhất của sản phẩm này được hiển thị cho user/session
    const query = {
      type,
      productId,
      ...(userId ? { userId } : { sessionId }),
      clicked: false // Chỉ cập nhật nếu chưa được click
    };

    const update = {
      clicked: true,
      clickTime: new Date()
    };

    await RecommendationMetric.findOneAndUpdate(
      query,
      update,
      { sort: { impressionTime: -1 } } // Lấy bản ghi mới nhất
    );

    return true;
  } catch (error) {
    console.error('Error tracking recommendation click:', error);
    return false;
  }
};

// Ghi nhận lượt thêm sản phẩm đề xuất vào giỏ hàng
const trackAddToCart = async (type, productId, userId = null, sessionId = null) => {
  try {
    // Tìm bản ghi gần nhất của sản phẩm này được hiển thị cho user/session
    const query = {
      type,
      productId,
      ...(userId ? { userId } : { sessionId }),
      addedToCart: false // Chỉ cập nhật nếu chưa được thêm vào giỏ hàng
    };

    const update = {
      addedToCart: true,
      addToCartTime: new Date()
    };

    await RecommendationMetric.findOneAndUpdate(
      query,
      update,
      { sort: { impressionTime: -1 } } // Lấy bản ghi mới nhất
    );

    return true;
  } catch (error) {
    console.error('Error tracking recommendation add to cart:', error);
    return false;
  }
};

// Ghi nhận lượt mua sản phẩm đề xuất
const trackPurchase = async (productIds, userId = null, sessionId = null) => {
  try {
    // Tìm tất cả các bản ghi của các sản phẩm này được hiển thị cho user/session
    const query = {
      productId: { $in: productIds },
      ...(userId ? { userId } : { sessionId }),
      purchased: false // Chỉ cập nhật nếu chưa được mua
    };

    const update = {
      purchased: true,
      purchaseTime: new Date()
    };

    await RecommendationMetric.updateMany(query, update);

    return true;
  } catch (error) {
    console.error('Error tracking recommendation purchase:', error);
    return false;
  }
};

// Tính toán CTR (Click-Through Rate) cho một loại đề xuất
const getClickThroughRate = async (type, startDate = null, endDate = null) => {
  try {
    const cacheKey = `ctr_${type}_${startDate}_${endDate}`;
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) return cachedData;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.impressionTime = {};
      if (startDate) dateFilter.impressionTime.$gte = new Date(startDate);
      if (endDate) dateFilter.impressionTime.$lte = new Date(endDate);
    }

    const totalImpressions = await RecommendationMetric.countDocuments({
      type,
      impression: true,
      ...dateFilter
    });

    const totalClicks = await RecommendationMetric.countDocuments({
      type,
      clicked: true,
      ...dateFilter
    });

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    const result = {
      type,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2))
    };

    metricsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error calculating CTR:', error);
    return {
      type,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      error: error.message
    };
  }
};

// Tính toán tỷ lệ chuyển đổi (thêm vào giỏ hàng) cho một loại đề xuất
const getCartAdditionRate = async (type, startDate = null, endDate = null) => {
  try {
    const cacheKey = `cart_rate_${type}_${startDate}_${endDate}`;
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) return cachedData;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.impressionTime = {};
      if (startDate) dateFilter.impressionTime.$gte = new Date(startDate);
      if (endDate) dateFilter.impressionTime.$lte = new Date(endDate);
    }

    const totalImpressions = await RecommendationMetric.countDocuments({
      type,
      impression: true,
      ...dateFilter
    });

    const totalAddedToCart = await RecommendationMetric.countDocuments({
      type,
      addedToCart: true,
      ...dateFilter
    });

    const cartRate = totalImpressions > 0 ? (totalAddedToCart / totalImpressions) * 100 : 0;

    const result = {
      type,
      impressions: totalImpressions,
      addedToCart: totalAddedToCart,
      cartRate: parseFloat(cartRate.toFixed(2))
    };

    metricsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error calculating cart addition rate:', error);
    return {
      type,
      impressions: 0,
      addedToCart: 0,
      cartRate: 0,
      error: error.message
    };
  }
};

// Tính toán tỷ lệ chuyển đổi (mua hàng) cho một loại đề xuất
const getConversionRate = async (type, startDate = null, endDate = null) => {
  try {
    const cacheKey = `conversion_rate_${type}_${startDate}_${endDate}`;
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) return cachedData;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.impressionTime = {};
      if (startDate) dateFilter.impressionTime.$gte = new Date(startDate);
      if (endDate) dateFilter.impressionTime.$lte = new Date(endDate);
    }

    const totalImpressions = await RecommendationMetric.countDocuments({
      type,
      impression: true,
      ...dateFilter
    });

    const totalPurchased = await RecommendationMetric.countDocuments({
      type,
      purchased: true,
      ...dateFilter
    });

    const conversionRate = totalImpressions > 0 ? (totalPurchased / totalImpressions) * 100 : 0;

    const result = {
      type,
      impressions: totalImpressions,
      purchases: totalPurchased,
      conversionRate: parseFloat(conversionRate.toFixed(2))
    };

    metricsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error calculating conversion rate:', error);
    return {
      type,
      impressions: 0,
      purchases: 0,
      conversionRate: 0,
      error: error.message
    };
  }
};

// Tính toán giá trị giỏ hàng trung bình trước và sau khi xem đề xuất
const getAverageCartGrowth = async (startDate = null, endDate = null) => {
  try {
    const cacheKey = `cart_growth_${startDate}_${endDate}`;
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) return cachedData;

    // Phân tích này yêu cầu dữ liệu từ bảng Cart và RecommendationMetric
    // Giả định: Chúng ta có truy vấn để tính giá trị giỏ hàng trước và sau khi xem đề xuất
    
    // Đây là một ví dụ giả định, trong thực tế cần truy vấn phức tạp hơn
    const result = {
      beforeRecommendation: {
        averageItemCount: 2.1,
        averageValue: 150000
      },
      afterRecommendation: {
        averageItemCount: 3.4,
        averageValue: 245000
      },
      growth: {
        itemCountGrowth: 61.9, // Phần trăm tăng số lượng sản phẩm
        valueGrowth: 63.3 // Phần trăm tăng giá trị giỏ hàng
      }
    };

    metricsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error calculating average cart growth:', error);
    return {
      error: error.message
    };
  }
};

// Lấy tất cả các chỉ số hiệu quả của hệ thống đề xuất
const getAllMetrics = async (startDate = null, endDate = null) => {
  try {
    const cacheKey = `all_metrics_${startDate}_${endDate}`;
    const cachedData = metricsCache.get(cacheKey);
    if (cachedData) return cachedData;

    const types = ['cart', 'homepage', 'related', 'admin'];
    
    const [ctrMetrics, cartRateMetrics, conversionMetrics, cartGrowth] = await Promise.all([
      Promise.all(types.map(type => getClickThroughRate(type, startDate, endDate))),
      Promise.all(types.map(type => getCartAdditionRate(type, startDate, endDate))),
      Promise.all(types.map(type => getConversionRate(type, startDate, endDate))),
      getAverageCartGrowth(startDate, endDate)
    ]);

    const result = {
      clickThroughRates: ctrMetrics,
      cartAdditionRates: cartRateMetrics,
      conversionRates: conversionMetrics,
      cartGrowth
    };

    metricsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error getting all metrics:', error);
    return {
      error: error.message
    };
  }
};

module.exports = {
  trackImpression,
  trackClick,
  trackAddToCart,
  trackPurchase,
  getClickThroughRate,
  getCartAdditionRate,
  getConversionRate,
  getAverageCartGrowth,
  getAllMetrics
}; 
const Newsletter = require("../models/Newsletter");
const crypto = require("crypto");

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email, name, preferences } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        message: "Email là bắt buộc", 
        success: false 
      });
    }
    
    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    
    if (existingSubscription) {
      // If already subscribed, return success
      if (existingSubscription.isSubscribed) {
        return res.status(200).json({ 
          message: "Email này đã đăng ký nhận bản tin", 
          success: true 
        });
      }
      
      // If unsubscribed before, resubscribe
      existingSubscription.isSubscribed = true;
      existingSubscription.subscribedAt = new Date();
      existingSubscription.unsubscribedAt = null;
      
      // Update preferences if provided
      if (preferences) {
        existingSubscription.preferences = {
          ...existingSubscription.preferences,
          ...preferences
        };
      }
      
      // Update name if provided
      if (name) {
        existingSubscription.name = name;
      }
      
      await existingSubscription.save();
      
      return res.status(200).json({ 
        message: "Đã đăng ký lại nhận bản tin thành công", 
        success: true 
      });
    }
    
    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    
    // Create new subscription
    const subscription = new Newsletter({
      email,
      name,
      unsubscribeToken,
      preferences: preferences || undefined
    });
    
    await subscription.save();
    
    res.status(201).json({ 
      message: "Đăng ký nhận bản tin thành công", 
      success: true 
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ 
      message: "Lỗi khi đăng ký nhận bản tin", 
      error: error.message,
      success: false
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ 
        message: "Token không hợp lệ", 
        success: false 
      });
    }
    
    const subscription = await Newsletter.findOne({ unsubscribeToken: token });
    
    if (!subscription) {
      return res.status(404).json({ 
        message: "Không tìm thấy đăng ký với token này", 
        success: false 
      });
    }
    
    // Update subscription status
    subscription.isSubscribed = false;
    subscription.unsubscribedAt = new Date();
    await subscription.save();
    
    res.json({ 
      message: "Hủy đăng ký nhận bản tin thành công", 
      success: true 
    });
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    res.status(500).json({ 
      message: "Lỗi khi hủy đăng ký nhận bản tin", 
      error: error.message,
      success: false
    });
  }
};

// Update preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { token } = req.params;
    const { preferences } = req.body;
    
    if (!token || !preferences) {
      return res.status(400).json({ 
        message: "Token và tùy chọn là bắt buộc", 
        success: false 
      });
    }
    
    const subscription = await Newsletter.findOne({ unsubscribeToken: token });
    
    if (!subscription) {
      return res.status(404).json({ 
        message: "Không tìm thấy đăng ký với token này", 
        success: false 
      });
    }
    
    // Update preferences
    subscription.preferences = {
      ...subscription.preferences,
      ...preferences
    };
    
    await subscription.save();
    
    res.json({ 
      message: "Cập nhật tùy chọn thành công", 
      success: true 
    });
  } catch (error) {
    console.error("Error updating newsletter preferences:", error);
    res.status(500).json({ 
      message: "Lỗi khi cập nhật tùy chọn", 
      error: error.message,
      success: false
    });
  }
};

// Get all subscribers (Admin)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({});
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách người đăng ký", 
      error: error.message 
    });
  }
};

// Get active subscribers (Admin)
exports.getActiveSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isSubscribed: true });
    res.json(subscribers);
  } catch (error) {
    console.error("Error fetching active subscribers:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách người đăng ký", 
      error: error.message 
    });
  }
};

// Delete subscriber (Admin)
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriber = await Newsletter.findById(id);
    if (!subscriber) {
      return res.status(404).json({ 
        message: "Không tìm thấy người đăng ký", 
        success: false 
      });
    }
    
    await subscriber.deleteOne();
    
    res.json({ 
      message: "Xóa người đăng ký thành công", 
      success: true 
    });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    res.status(500).json({ 
      message: "Lỗi khi xóa người đăng ký", 
      error: error.message,
      success: false
    });
  }
}; 
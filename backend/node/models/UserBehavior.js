const mongoose = require("mongoose");

const userBehaviorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    behaviors: [
      {
        type: {
          type: String,
          enum: ["view", "search", "cart", "wishlist", "purchase"],
          required: true
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        searchQuery: {
          type: String
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        metadata: {
          sessionDuration: Number,
          deviceType: String,
          browser: String,
          location: String,
          referrer: String
        }
      }
    ]
  },
  { timestamps: true }
);

// Static method to add a behavior event
userBehaviorSchema.statics.addBehavior = async function(userId, behaviorData) {
  try {
    // Find or create user behavior document
    let userBehavior = await this.findOne({ user: userId });
    
    if (!userBehavior) {
      userBehavior = new this({
        user: userId,
        behaviors: []
      });
    }
    
    // Add new behavior to the array
    userBehavior.behaviors.push({
      type: behaviorData.type,
      product: behaviorData.productId,
      searchQuery: behaviorData.searchQuery,
      timestamp: Date.now(),
      metadata: behaviorData.metadata || {}
    });
    
    // Save and return the updated document
    return await userBehavior.save();
  } catch (error) {
    console.error("Error adding user behavior:", error);
    throw error;
  }
};

// Static method to get user recommendations
userBehaviorSchema.statics.getUserRecommendations = async function(userId, limit = 10) {
  try {
    // Get user's viewed and purchased products
    const userBehavior = await this.findOne({ user: userId });
    
    if (!userBehavior || userBehavior.behaviors.length === 0) {
      return []; // No behavior data to base recommendations on
    }
    
    // Extract product IDs from user behaviors
    const viewedProductIds = userBehavior.behaviors
      .filter(b => b.type === 'view' || b.type === 'wishlist')
      .map(b => b.product);
      
    const purchasedProductIds = userBehavior.behaviors
      .filter(b => b.type === 'purchase')
      .map(b => b.product);
    
    // Find similar users who viewed/bought the same products
    const similarUserBehaviors = await this.find({
      user: { $ne: userId },
      "behaviors.product": { $in: [...viewedProductIds, ...purchasedProductIds] }
    });
    
    // Extract product IDs from similar users
    const similarUsersProductIds = new Set();
    similarUserBehaviors.forEach(ub => {
      ub.behaviors.forEach(b => {
        if (b.product && !viewedProductIds.includes(b.product) && !purchasedProductIds.includes(b.product)) {
          similarUsersProductIds.add(b.product.toString());
        }
      });
    });
    
    // Return product IDs as recommendations
    return Array.from(similarUsersProductIds).slice(0, limit);
  } catch (error) {
    console.error("Error getting user recommendations:", error);
    throw error;
  }
};

// Static method to track product view
userBehaviorSchema.statics.trackProductView = async function(userId, productId, metadata = {}) {
  return this.addBehavior(userId, {
    type: 'view',
    productId,
    metadata
  });
};

// Static method to track search query
userBehaviorSchema.statics.trackSearch = async function(userId, searchQuery, metadata = {}) {
  return this.addBehavior(userId, {
    type: 'search',
    searchQuery,
    metadata
  });
};

// Static method to track product added to cart
userBehaviorSchema.statics.trackAddToCart = async function(userId, productId, metadata = {}) {
  return this.addBehavior(userId, {
    type: 'cart',
    productId,
    metadata
  });
};

// Static method to track product purchase
userBehaviorSchema.statics.trackPurchase = async function(userId, productId, metadata = {}) {
  return this.addBehavior(userId, {
    type: 'purchase',
    productId,
    metadata
  });
};

module.exports = mongoose.model("UserBehavior", userBehaviorSchema); 
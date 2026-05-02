const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    name: { 
      type: String, 
      trim: true 
    },
    isSubscribed: { 
      type: Boolean, 
      default: true 
    },
    subscribedAt: { 
      type: Date, 
      default: Date.now 
    },
    unsubscribedAt: { 
      type: Date 
    },
    preferences: {
      promotions: { type: Boolean, default: true },
      newProducts: { type: Boolean, default: true },
      blog: { type: Boolean, default: false }
    },
    unsubscribeToken: { 
      type: String 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Newsletter", newsletterSchema); 
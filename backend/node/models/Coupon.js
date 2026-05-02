const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true 
    },
    description: { 
      type: String 
    },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'], 
      default: 'percentage' 
    },
    discountValue: { 
      type: Number, 
      required: true 
    },
    minOrderValue: { 
      type: Number, 
      default: 0 
    },
    maxDiscountAmount: { 
      type: Number 
    },
    validFrom: { 
      type: Date, 
      default: Date.now 
    },
    validUntil: { 
      type: Date, 
      required: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    usageLimit: { 
      type: Number, 
      default: null 
    },
    usedCount: { 
      type: Number, 
      default: 0 
    },
    applicableProducts: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    }],
    applicableCategories: [{ 
      type: String 
    }],
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  { timestamps: true }
);

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(orderTotal) {
  if (!this.isValid() || orderTotal < this.minOrderValue) {
    return 0;
  }

  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (orderTotal * this.discountValue) / 100;
  } else {
    discountAmount = this.discountValue;
  }

  // Apply max discount if specified
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }

  return discountAmount;
};

module.exports = mongoose.model("Coupon", couponSchema); 
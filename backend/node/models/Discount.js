const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Check if discount is active and within date range
discountSchema.methods.isValid = function() {
  const now = new Date();
  const isWithinDateRange = 
    (now >= this.startDate) && 
    (this.endDate === null || now <= this.endDate);
  
  return this.isActive && isWithinDateRange;
};

// Calculate discount amount for a product or order
discountSchema.methods.calculateDiscount = function(price) {
  if (!this.isValid() || price < this.minPurchase) {
    return 0;
  }

  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (price * this.discountValue) / 100;
  } else { // fixed
    discountAmount = this.discountValue;
  }

  // Apply max discount if specified
  if (this.maxDiscount && discountAmount > this.maxDiscount) {
    discountAmount = this.maxDiscount;
  }

  return discountAmount;
};

module.exports = mongoose.model('Discount', discountSchema); 
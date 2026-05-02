const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  linkTo: {
    type: String,
    default: '#'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  position: {
    type: String,
    enum: ['home_main', 'home_secondary', 'category_page', 'sidebar', 'popup'],
    default: 'home_main'
  }
}, {
  timestamps: true
});

// Check if banner is active and within date range
bannerSchema.methods.checkActive = function() {
  const now = new Date();
  const isWithinDateRange = 
    (now >= this.startDate) && 
    (this.endDate === null || now <= this.endDate);
  
  return this.isActive && isWithinDateRange;
};

module.exports = mongoose.model('Banner', bannerSchema); 
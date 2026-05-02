const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['general', 'payment', 'shipping', 'email', 'social', 'seo'],
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema); 
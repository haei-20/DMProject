const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    products: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: String,
        image: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1
        }
      }
    ],
    discount: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Combo = mongoose.model('Combo', comboSchema);

module.exports = Combo; 
const mongoose = require("mongoose");
const DEFAULT_PRODUCT_IMAGE_URL = require("../constants/defaultProductImageUrl");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String, default: "General" },
  stock: { type: Number, default: 0 },
  image: { type: String, default: DEFAULT_PRODUCT_IMAGE_URL },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }, // Percentage discount
  featured: { type: Boolean, default: false },
  tags: [{ type: String }],
  // Add new fields for Deal Hot functionality
  salePrice: { type: Number, default: 0 },
  dealStartDate: { type: Date },
  dealEndDate: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model("Product", productSchema);

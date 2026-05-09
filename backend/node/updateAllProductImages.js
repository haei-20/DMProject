/**
 * Gán cùng một URL ảnh cho mọi document Product trong MongoDB.
 * Chạy: node updateAllProductImages.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const DEFAULT_PRODUCT_IMAGE_URL = require("./constants/defaultProductImageUrl");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/tmdt";

async function main() {
  await mongoose.connect(MONGO_URI);
  const result = await Product.updateMany(
    {},
    { $set: { image: DEFAULT_PRODUCT_IMAGE_URL } }
  );
  console.log("updateMany:", result);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

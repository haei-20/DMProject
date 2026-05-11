/**
 * Đặt toàn bộ đơn hàng trong DB thành trạng thái Đã giao (delivered).
 *
 * Chạy từ backend/node:
 *   node scripts/setAllOrdersDelivered.js
 */

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Order = require('../models/Order');

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Thiếu MONGO_URI (hoặc MONGODB_URI) trong backend/node/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const now = new Date();

  const result = await Order.updateMany(
    {},
    {
      $set: {
        status: 'delivered',
        isDelivered: true,
        deliveredAt: now,
      },
    }
  );

  console.log('Đã cập nhật:', result.modifiedCount, '/', result.matchedCount, 'đơn');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

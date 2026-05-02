require('dotenv').config();
const mongoose = require('mongoose');

const Product = require('./models/Product');
const Combo = require('./models/Combo');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tmdt';

async function connectDb() {
  await mongoose.connect(MONGO_URI);
}

async function seedDealHot(count = 6) {
  const now = new Date();
  const products = await Product.find({})
    .sort({ stock: -1, price: -1 })
    .limit(count * 2);

  const selected = products.slice(0, count);
  for (const [index, product] of selected.entries()) {
    const discountPercent = 15 + (index % 3) * 5;
    const salePrice = Math.max(1, Number((product.price * (1 - discountPercent / 100)).toFixed(2)));

    product.category = 'Deal hot';
    product.tags = Array.from(new Set([...(product.tags || []), 'deal-hot']));
    product.salePrice = salePrice;
    product.dealStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    product.dealEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    product.featured = true;
    await product.save();
  }

  return selected.length;
}

async function seedCombos() {
  const comboCount = await Combo.countDocuments();
  if (comboCount > 0 && (process.env.CLEAR_COMBOS ?? 'false') !== 'true') {
    return { created: 0, skipped: comboCount };
  }

  if ((process.env.CLEAR_COMBOS ?? 'false') === 'true') {
    await Combo.deleteMany({});
  }

  const products = await Product.find({}).sort({ stock: -1, price: -1 }).limit(12);
  if (products.length < 4) {
    return { created: 0, skipped: 0 };
  }

  const combos = [
    {
      name: 'Combo tiết kiệm 1',
      description: 'Combo mẫu được tạo từ dữ liệu sản phẩm hiện có trong DB.',
      discount: 12,
      productSlice: products.slice(0, 4),
    },
    {
      name: 'Combo tiết kiệm 2',
      description: 'Combo mẫu thứ hai để hiển thị trên giao diện trang chủ.',
      discount: 15,
      productSlice: products.slice(4, 8),
    },
  ].filter((combo) => combo.productSlice.length >= 4);

  for (const combo of combos) {
    const comboProducts = combo.productSlice.map((product) => ({
      _id: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
    }));

    await Combo.create({
      name: combo.name,
      description: combo.description,
      products: comboProducts,
      discount: combo.discount,
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  return { created: combos.length };
}

async function main() {
  console.log('Bắt đầu seed dữ liệu thiếu...');
  await connectDb();

  const dealHotCount = await seedDealHot(Number(process.env.DEAL_HOT_COUNT || 6));
  console.log(`Đã gắn ${dealHotCount} sản phẩm vào Deal hot.`);

  const comboResult = await seedCombos();
  console.log('Combo:', comboResult);

  const counts = {
    products: await Product.countDocuments(),
    combos: await Combo.countDocuments(),
    dealHotProducts: await Product.countDocuments({
      $or: [{ category: 'Deal hot' }, { tags: 'deal-hot' }],
      salePrice: { $gt: 0 },
    }),
  };

  console.log('Tổng kết số lượng sau seed:', counts);
}

main()
  .catch((error) => {
    console.error('Seed thất bại:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
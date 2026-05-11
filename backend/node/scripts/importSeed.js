/**
 * importSeed.js
 *
 * Cách chạy (chọn một):
 *   cd backend/node/scripts   →   node importSeed.js
 *   cd backend/node           →   node scripts/importSeed.js
 *
 * Nếu đã ở trong thư mục scripts: chỉ dùng node importSeed.js
 * (đừng dùng node scripts/importSeed.js — sẽ lỗi …/scripts/scripts/…).
 *
 * File cùng thư mục: users_seed.json, products_seed.json, orders_seed.json
 *
 * orders_seed.json — khớp Order.js:
 * - orderItems[].skuRef → map sang product; có thể thêm name, image, price, qty
 * - customerIdRef → map user đã import; nếu không có user → bắt buộc có thông tin khách:
 *   • guestInfo: { name, email, phone? } HOẶC
 *   • guestName / guestEmail / guestPhone (tên field dự phòng)
 * - shippingAddress: { address, city, postalCode, country }
 *   (chấp nhận zipCode / street thay cho postalCode / address)
 *
 * Trước khi import: xóa Order/Combo/Cart/GuestCart/UserBehavior; làm rỗng
 * applicableProducts của Discount & Coupon; xóa wishlist/viewedProducts của admin & guest.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Combo = require('../models/Combo');
const Cart = require('../models/Cart');
const GuestCart = require('../models/GuestCart');
const UserBehavior = require('../models/UserBehavior');
const Discount = require('../models/Discount');
const Coupon = require('../models/Coupon');
const DEFAULT_PRODUCT_IMAGE_URL = require('../constants/defaultProductImageUrl');

const DIR = __dirname;

const ORDER_STATUS_ENUM = [
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'paid',
];

function normalizeOrderStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (ORDER_STATUS_ENUM.includes(s)) return s;
  return 'pending';
}

function normalizeUserAddress(addr) {
  if (!addr) return undefined;
  if (typeof addr === 'string') {
    return {
      street: addr,
      city: '',
      state: '',
      zipCode: '',
      country: 'Vietnam',
    };
  }
  return {
    street: addr.street ?? addr.address ?? '',
    city: addr.city ?? '',
    state: addr.state ?? '',
    zipCode: addr.zipCode ?? addr.postalCode ?? '',
    country: addr.country ?? 'Vietnam',
  };
}

function normalizeShippingAddress(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      address: 'Chưa cập nhật',
      city: '—',
      postalCode: '00000',
      country: 'Vietnam',
    };
  }
  const address =
    raw.address ?? raw.street ?? raw.line1 ?? '';
  const city = raw.city ?? '';
  const postalCode =
    raw.postalCode ?? raw.zipCode ?? raw.postal ?? raw.zip ?? '00000';
  const country = raw.country ?? 'Vietnam';
  return {
    address: String(address || 'Chưa cập nhật'),
    city: String(city || '—'),
    postalCode: String(postalCode || '00000'),
    country: String(country || 'Vietnam'),
  };
}

/**
 * Khi không có user: Order.js yêu cầu guestInfo đầy đủ.
 * Ưu tiên o.guestInfo; sau đó guestName / guestEmail / guestPhone trên root.
 */
function buildGuestInfo(o, seedIndex) {
  const g = o.guestInfo;
  const nameFromNested = g && (g.name || g.fullName);
  const emailFromNested = g && g.email;
  const phoneFromNested = g && (g.phone || g.phoneNumber);

  const name =
    (nameFromNested && String(nameFromNested).trim()) ||
    String(o.guestName ?? o.guest_name ?? '').trim() ||
    `Khách import #${seedIndex + 1}`;

  const emailRaw =
    (emailFromNested && String(emailFromNested).trim()) ||
    String(o.guestEmail ?? o.guest_email ?? '').trim() ||
    `guest.seed.${seedIndex + 1}@import.local`;

  const phone =
    (phoneFromNested && String(phoneFromNested).trim()) ||
    String(o.guestPhone ?? o.guest_phone ?? '').trim() ||
    '0000000000';

  return {
    name,
    email: emailRaw,
    phone,
  };
}

function parseOptionalDate(v) {
  if (v == null || v === '') return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Xóa / chuẩn hóa dữ liệu trỏ tới Product & Order cũ (trước khi xóa user/product và nạp seed).
 */
async function cleanupDependentCollections() {
  console.log('🧹 Dọn collection phụ thuộc Product / Order...');
  const [orderDel, comboDel, cartDel, guestCartDel, behaviorDel] = await Promise.all([
    Order.deleteMany({}),
    Combo.deleteMany({}),
    Cart.deleteMany({}),
    GuestCart.deleteMany({}),
    UserBehavior.deleteMany({}),
  ]);

  const discRes = await Discount.updateMany({}, { $set: { applicableProducts: [] } });
  const coupRes = await Coupon.updateMany({}, { $set: { applicableProducts: [] } });

  const userStrip = await User.updateMany(
    { role: { $in: ['admin', 'guest'] } },
    { $set: { wishlist: [], viewedProducts: [] } }
  );

  console.log(
    `   Đã xóa: orders=${orderDel.deletedCount}, combos=${comboDel.deletedCount}, ` +
      `carts=${cartDel.deletedCount}, guestCarts=${guestCartDel.deletedCount}, ` +
      `userBehaviors=${behaviorDel.deletedCount}`
  );
  console.log(
    `   applicableProducts đã làm rỗng: discounts (matched ${discRes.matchedCount}), ` +
      `coupons (matched ${coupRes.matchedCount})`
  );
  console.log(
    `   wishlist + viewedProducts đã xóa (admin/guest): ${userStrip.modifiedCount} tài khoản\n`
  );
}

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/retail';
  await mongoose.connect(mongoUri);
  console.log('✅ Kết nối MongoDB OK\n');

  await cleanupDependentCollections();

  // ── 1. USERS ──────────────────────────────────────────────────
  console.log('👤 Import users...');
  const usersRaw = JSON.parse(fs.readFileSync(path.join(DIR, 'users_seed.json'), 'utf-8'));

  await User.deleteMany({ role: 'user' });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash('123456', salt);

  const userDocs = usersRaw.map((u) => ({
    name: u.name,
    email: u.email,
    password: hashed,
    phone: u.phone || '',
    role: 'user',
    isVerified: true,
    address: normalizeUserAddress(u.address),
  }));

  const insertedUsers = await User.insertMany(userDocs, { ordered: false });
  console.log(`   ✅ ${insertedUsers.length} users\n`);

  const cidMap = {};
  const byEmail = new Map(
    insertedUsers.map((doc) => [String(doc.email).toLowerCase(), doc._id])
  );
  usersRaw.forEach((u) => {
    const id = byEmail.get(String(u.email).toLowerCase());
    if (id && u.customerIdRef != null) {
      cidMap[u.customerIdRef] = id;
    }
  });
  if (Object.keys(cidMap).length < usersRaw.length) {
    console.warn(
      '   ⚠️ Một số customerIdRef có thể không map (trùng email import hoặc thiếu customerIdRef).'
    );
  }

  // ── 2. PRODUCTS ───────────────────────────────────────────────
  console.log('📦 Import products...');
  const productsRaw = JSON.parse(fs.readFileSync(path.join(DIR, 'products_seed.json'), 'utf-8'));

  await Product.deleteMany({});

  const productDocs = productsRaw.map((p) => ({
    sku: p.sku,
    name: p.name,
    price: p.price,
    description: p.description,
    category: p.category,
    stock: p.stock,
    image: p.image ?? DEFAULT_PRODUCT_IMAGE_URL,
    rating: p.rating,
    numReviews: p.numReviews,
    discount: p.discount,
    featured: p.featured,
    tags: p.tags,
    salePrice: p.salePrice,
    dealStartDate: p.dealStartDate ? new Date(p.dealStartDate) : undefined,
    dealEndDate: p.dealEndDate ? new Date(p.dealEndDate) : undefined,
  }));

  const insertedProducts = await Product.insertMany(productDocs, { ordered: false });
  console.log(`   ✅ ${insertedProducts.length} products\n`);

  const skuMap = {};
  const productById = new Map();
  insertedProducts.forEach((p) => {
    if (p.sku) skuMap[p.sku] = p._id;
    productById.set(p._id.toString(), p);
  });

  // ── 3. ORDERS ─────────────────────────────────────────────────
  console.log('🧾 Import orders...');
  const ordersRaw = JSON.parse(fs.readFileSync(path.join(DIR, 'orders_seed.json'), 'utf-8'));

  let skipped = 0;
  const orderDocs = [];

  for (let idx = 0; idx < ordersRaw.length; idx++) {
    const o = ordersRaw[idx];
    const items = [];
    const lineSources = Array.isArray(o.orderItems) ? o.orderItems : [];

    for (const item of lineSources) {
      const prodId = skuMap[item.skuRef];
      if (!prodId) continue;
      const pMeta = productById.get(prodId.toString());
      const qty = Number(item.qty ?? 1);
      const price = Number(item.price ?? pMeta?.price ?? 0);
      items.push({
        product: prodId,
        name: String(item.name || pMeta?.name || 'Sản phẩm'),
        image: String(item.image || pMeta?.image || DEFAULT_PRODUCT_IMAGE_URL),
        price,
        qty: qty > 0 ? qty : 1,
      });
    }

    if (!items.length) {
      skipped++;
      continue;
    }

    const userId =
      o.customerIdRef != null && cidMap[o.customerIdRef] != null
        ? cidMap[o.customerIdRef]
        : null;

    let totalPrice = Number(o.totalPrice);
    if (!Number.isFinite(totalPrice) || totalPrice < 0) {
      totalPrice = items.reduce((s, it) => s + it.price * it.qty, 0);
    }
    if (totalPrice <= 0) {
      skipped++;
      continue;
    }

    const doc = {
      orderItems: items,
      shippingAddress: normalizeShippingAddress(o.shippingAddress),
      totalPrice,
      status: normalizeOrderStatus(o.status),
      isPaid: Boolean(o.isPaid),
      isDelivered: Boolean(o.isDelivered),
      note: o.note != null ? String(o.note) : undefined,
    };

    if (userId) {
      doc.user = userId;
    } else {
      doc.guestInfo = buildGuestInfo(o, idx);
    }

    const paidAt = parseOptionalDate(o.paidAt);
    const deliveredAt = parseOptionalDate(o.deliveredAt);
    if (paidAt) doc.paidAt = paidAt;
    if (deliveredAt) doc.deliveredAt = deliveredAt;

    if (o.createdAt) doc.createdAt = new Date(o.createdAt);
    if (o.updatedAt) doc.updatedAt = new Date(o.updatedAt);

    orderDocs.push(doc);
  }

  const insertedOrders = await Order.insertMany(orderDocs, { ordered: false });
  console.log(`   ✅ ${insertedOrders.length} orders  (bỏ qua ${skipped})\n`);

  console.log('═'.repeat(50));
  console.log('✅ Import xong!');
  console.log(`   Users   : ${insertedUsers.length}`);
  console.log(`   Products: ${insertedProducts.length}`);
  console.log(`   Orders  : ${insertedOrders.length}`);
  console.log('═'.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});

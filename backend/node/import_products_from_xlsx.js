require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const Category = require('./models/Category');
const Product = require('./models/Product');

const MONGO_URI = (process.env.MONGO_URI || process.env.MONGO_URL || '').trim();
const DEFAULT_IMAGE = '/uploads/Ảnh chụp màn hình 2026-05-05 201316.png';

async function connectDb() {
  if (!MONGO_URI) {
    throw new Error('Thiếu MONGO_URI/MONGO_URL. Vui lòng cấu hình MongoDB Atlas trong file .env');
  }
  if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
    throw new Error('Script này chỉ dùng MongoDB Atlas. Vui lòng đổi MONGO_URI sang chuỗi Atlas');
  }
  await mongoose.connect(MONGO_URI);
}

function parseNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  try {
    return parseFloat(String(v).replace(/[^0-9.\-]+/g, '')) || 0;
  } catch (e) {
    return 0;
  }
}

function normalizeStockCode(v) {
  return String(v || '').trim();
}

function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function inferCategory(name) {
  const upperName = String(name || '').toUpperCase();
  if (['MUG', 'CUP', 'TEA'].some((x) => upperName.includes(x))) {
    return 'Kitchen';
  }
  if (['CANDLE', 'LANTERN', 'HEART'].some((x) => upperName.includes(x))) {
    return 'Decoration';
  }
  if (['DOLL', 'TOY'].some((x) => upperName.includes(x))) {
    return 'Toys';
  }
  if (['BOX', 'BAG'].some((x) => upperName.includes(x))) {
    return 'Accessories';
  }
  return 'Others';
}

async function ensureCategory(name) {
  if (!name) return null;
  const trimmed = String(name).trim();
  if (!trimmed) return null;
  let c = await Category.findOne({ name: trimmed });
  if (!c) {
    c = await Category.create({ name: trimmed, description: '' });
  }
  return c;
}

async function run() {
  console.log('Import script started');
  await connectDb();
  // Optionally clear existing products before import. Default: true
  const CLEAR_PRODUCTS = (process.env.CLEAR_PRODUCTS ?? 'true') === 'true';
  if (CLEAR_PRODUCTS) {
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`Clearing ${existingCount} existing products before import...`);
      await Product.deleteMany({});
      console.log('Existing products removed.');
    } else {
      console.log('No existing products to remove.');
    }
  } else {
    console.log('CLEAR_PRODUCTS=false — existing products will be preserved.');
  }
  const inputPath = path.join(__dirname, 'data', 'products_final.xlsx');
  if (!fs.existsSync(inputPath)) {
    console.error('File not found:', inputPath);
    process.exit(1);
  }

  const wb = xlsx.readFile(inputPath, { raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Loaded ${rows.length} rows from products_final.xlsx`);

  // Pre-create categories inferred from product name
  const categoriesMap = {};
  for (const r of rows) {
    const nameCandidates = ['Product Name', 'Name', 'name', 'Product', 'title'];
    let name = '';
    for (const k of nameCandidates) {
      if (r[k]) {
        name = r[k];
        break;
      }
    }
    name = String(name || '').trim();
    if (!name) continue;
    const catName = inferCategory(name);
    if (catName && !categoriesMap[catName]) {
      const c = await ensureCategory(catName);
      if (c) categoriesMap[catName] = c;
    }
  }

  let created = 0;
  let updated = 0;

  for (const r of rows) {
    const nameCandidates = ['Product Name', 'Name', 'name', 'Product', 'title'];
    let name = '';
    for (const k of nameCandidates) { if (r[k]) { name = r[k]; break; } }
    name = String(name || '').trim();
    if (!name) continue;

    const sku = normalizeStockCode(r['StockCode'] || r['stock_code'] || r['SKU'] || r['sku']);

    const priceCandidates = ['Price', 'price', 'UnitPrice', 'unit_price', 'List Price', 'list_price'];
    let priceRaw = 0;
    for (const k of priceCandidates) { if (r[k] !== undefined && r[k] !== '') { priceRaw = r[k]; break; } }
    const price = parseNumber(priceRaw);
    if (price <= 0) continue;

    const description = name;
    const stock = randomIntInclusive(5, 41);
    const image = DEFAULT_IMAGE;
    const tags = [];
    const discount = 0;
    const salePrice = 0;
    const featured = false;

    const catName = inferCategory(name);
    const catObj = categoriesMap[catName];
    const categoryValue = catObj ? catObj.name : catName;

    const productData = {
      sku: sku || undefined,
      name,
      price,
      description,
      category: categoryValue,
      stock,
      image,
      reviews: [],
      rating: 0,
      numReviews: 0,
      discount,
      featured,
      tags,
      salePrice
    };

    const existing = sku
      ? await Product.findOne({ sku })
      : await Product.findOne({ name });
    if (existing) {
      await Product.updateOne({ _id: existing._id }, { $set: productData });
      updated++;
    } else {
      await Product.create(productData);
      created++;
    }
  }

  console.log(`Import finished. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const Category = require('./models/Category');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tmdt';

async function connectDb() {
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

function parseIntSafe(v) {
  const n = parseInt(parseNumber(v));
  return Number.isFinite(n) ? n : 0;
}

function parseDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeStockCode(v) {
  return String(v || '').trim();
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
  const csvPath = path.join(__dirname, 'data', 'products_final.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('File not found:', csvPath);
    process.exit(1);
  }

  const wb = xlsx.readFile(csvPath, { raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Loaded ${rows.length} rows from products_final.csv`);

  // Pre-create categories map
  const categoriesMap = {};
  for (const r of rows) {
    const catCandidates = ['Category', 'category', 'Category Name', 'category_name'];
    let catName = '';
    for (const k of catCandidates) {
      if (r[k]) { catName = r[k]; break; }
    }
    catName = String(catName || '').trim();
    if (catName && !categoriesMap[catName]) {
      const c = await ensureCategory(catName);
      if (c) categoriesMap[catName] = c;
    }
  }

  let created = 0;
  let updated = 0;

  for (const r of rows) {
    const nameCandidates = ['Name', 'name', 'Product', 'Product Name', 'title'];
    let name = '';
    for (const k of nameCandidates) { if (r[k]) { name = r[k]; break; } }
    name = String(name || '').trim();
    if (!name) continue;

    const sku = normalizeStockCode(r['StockCode'] || r['stock_code'] || r['SKU'] || r['sku']);

    const priceCandidates = ['Price', 'price', 'List Price', 'list_price'];
    let priceRaw = 0;
    for (const k of priceCandidates) { if (r[k] !== undefined && r[k] !== '') { priceRaw = r[k]; break; } }
    const price = parseNumber(priceRaw);

    const description = (r['Description'] || r['description'] || '').toString();
    const stock = parseIntSafe(r['Stock'] || r['Qty'] || r['Quantity'] || 0);
    const image = (r['Image'] || r['image'] || r['ImageUrl'] || r['image_url'] || '').toString();
    const tagsRaw = (r['Tags'] || r['tags'] || '').toString();
    const tags = tagsRaw ? tagsRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const discount = parseNumber(r['Discount'] || r['discount'] || 0) || 0;
    const salePrice = parseNumber(r['SalePrice'] || r['Sale Price'] || r['sale_price'] || 0) || 0;
    const dealStartDate = parseDateSafe(r['DealStartDate'] || r['Deal Start Date'] || r['deal_start'] || null);
    const dealEndDate = parseDateSafe(r['DealEndDate'] || r['Deal End Date'] || r['deal_end'] || null);
    const featured = String(r['Featured'] || r['featured'] || '').toLowerCase() === 'true';

    const catName = String(r['Category'] || r['category'] || '').trim();
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
      salePrice: salePrice || 0,
      dealStartDate: dealStartDate || undefined,
      dealEndDate: dealEndDate || undefined
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

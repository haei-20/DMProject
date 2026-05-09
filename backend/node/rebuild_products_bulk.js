require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Product = require('./models/Product');
const DEFAULT_PRODUCT_IMAGE_URL = require('./constants/defaultProductImageUrl');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tmdt';
const CSV_PATH = path.join(__dirname, 'data', 'products_final.csv');

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(String(value).replace(/[^0-9.\-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIntSafe(value) {
  const parsed = parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSku(value) {
  return String(value || '').trim();
}

function firstValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return '';
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const workbook = xlsx.readFile(CSV_PATH, { raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Loaded ${rows.length} rows from products_final.csv`);

  await Product.deleteMany({});
  console.log('Cleared existing products');

  const docs = [];

  for (const row of rows) {
    const name = String(firstValue(row, ['Name', 'name', 'Product', 'Product Name', 'title'])).trim();
    if (!name) {
      continue;
    }

    const sku = normalizeSku(firstValue(row, ['StockCode', 'stockCode', 'stock_code', 'SKU', 'sku']));
    const price = parseNumber(firstValue(row, ['Price', 'price', 'List Price', 'list_price']));
    const description = String(firstValue(row, ['Description', 'description'])).trim();
    const category = String(firstValue(row, ['Category', 'category', 'Category Name', 'category_name'])).trim() || 'General';
    const stock = parseIntSafe(firstValue(row, ['Stock', 'Qty', 'Quantity', 'stock']));
    const image = DEFAULT_PRODUCT_IMAGE_URL;
    const tagsRaw = String(firstValue(row, ['Tags', 'tags'])).trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const discount = parseNumber(firstValue(row, ['Discount', 'discount'])) || 0;
    const salePrice = parseNumber(firstValue(row, ['SalePrice', 'Sale Price', 'sale_price'])) || 0;
    const featured = String(firstValue(row, ['Featured', 'featured'])).toLowerCase() === 'true';

    docs.push({
      sku: sku || undefined,
      name,
      price,
      description,
      category,
      stock,
      image,
      reviews: [],
      rating: 0,
      numReviews: 0,
      discount,
      featured,
      tags,
      salePrice,
    });
  }

  const chunkSize = 1000;
  let inserted = 0;

  for (let index = 0; index < docs.length; index += chunkSize) {
    const chunk = docs.slice(index, index + chunkSize);
    const result = await Product.insertMany(chunk, { ordered: false });
    inserted += result.length;
    console.log(`Inserted ${inserted}/${docs.length} products`);
  }

  console.log(`Finished rebuilding products. Inserted: ${inserted}`);
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error('Rebuild failed:', error);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // Ignore disconnect errors.
  }
  process.exit(1);
});
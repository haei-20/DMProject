const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const xlsx = require('xlsx');
const Order = require('./models/Order');
const Product = require('./models/Product');

dotenv.config();

const excelPath = path.join(__dirname, 'online_retail.xlsx');
const MONGO_URI = (process.env.MONGO_URI || process.env.MONGO_URL || '').trim();

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function parseInvoiceDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (!parsed) {
      return null;
    }

    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S));
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeStockCode(value) {
  return String(value || '').trim();
}

async function importOrdersFromExcel() {
  let connected = false;

  try {
    if (!MONGO_URI) {
      throw new Error('Thiếu MONGO_URI/MONGO_URL. Vui lòng cấu hình MongoDB Atlas trong file .env');
    }
    if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
      throw new Error('Script này chỉ dùng MongoDB Atlas. Vui lòng đổi MONGO_URI sang chuỗi Atlas');
    }
    await mongoose.connect(MONGO_URI);
    connected = true;
    console.log('✅ Connected to MongoDB');

    console.log('📖 Đọc file Excel...');
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    console.log(`✅ Đã đọc ${rows.length} dòng từ Excel`);

    const products = await Product.find({}).select('_id sku name image').lean();
    const productLookupBySku = new Map();
    const productLookupByName = new Map();

    for (const product of products) {
      if (product.sku) {
        productLookupBySku.set(normalizeStockCode(product.sku), product);
      }
      productLookupByName.set(normalizeText(product.name), product);
    }

    console.log(`🔍 Tìm thấy ${products.length} sản phẩm trong MongoDB`);

    if (products.length === 0) {
      throw new Error('Không có sản phẩm nào trong MongoDB. Hãy import products trước.');
    }

    const invoiceBuckets = new Map();
    const invalidReasons = {
      cancelled: 0,
      invalidQuantity: 0,
      negativeQuantity: 0,
      invalidUnitPrice: 0,
      invalidInvoiceDate: 0,
      emptyCountry: 0,
      productMissing: 0,
      missingInvoiceNo: 0,
    };
    const rejectedInvoices = new Set();

    for (const row of rows) {
      const invoiceNo = String(row.InvoiceNo || row.Invoice || '').trim();
      const stockCode = normalizeStockCode(row.StockCode || row.Stock_Code || row.SKU || row.sku);
      const productName = String(row.Description || row.Product || '').trim();
      const quantity = parseNumber(row.Quantity);
      const unitPrice = parseNumber(row.UnitPrice);
      const invoiceDate = parseInvoiceDate(row.InvoiceDate || row.Date);
      const country = String(row.Country || '').trim();
      const customerId = row.CustomerID !== null && row.CustomerID !== undefined && String(row.CustomerID).trim() !== ''
        ? String(row.CustomerID).trim()
        : null;

      if (!invoiceNo) {
        invalidReasons.missingInvoiceNo += 1;
        continue;
      }

      if (invoiceNo.toUpperCase().startsWith('C')) {
        invalidReasons.cancelled += 1;
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (quantity === null || quantity <= 0) {
        invalidReasons.invalidQuantity += 1;
        if (quantity !== null && quantity < 0) {
          invalidReasons.negativeQuantity += 1;
        }
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (unitPrice === null || unitPrice <= 0) {
        invalidReasons.invalidUnitPrice += 1;
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (!invoiceDate) {
        invalidReasons.invalidInvoiceDate += 1;
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (!country) {
        invalidReasons.emptyCountry += 1;
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      const product = (stockCode && productLookupBySku.get(stockCode)) || productLookupByName.get(normalizeText(productName));
      if (!product) {
        invalidReasons.productMissing += 1;
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (!invoiceBuckets.has(invoiceNo)) {
        invoiceBuckets.set(invoiceNo, {
          invoiceNo,
          invoiceDate,
          country,
          customerId,
          items: new Map(),
        });
      }

      const bucket = invoiceBuckets.get(invoiceNo);

      if (bucket.country !== country) {
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (bucket.invoiceDate.getTime() !== invoiceDate.getTime()) {
        rejectedInvoices.add(invoiceNo);
        continue;
      }

      if (!bucket.customerId && customerId) {
        bucket.customerId = customerId;
      }

      const itemKey = `${product._id.toString()}|${unitPrice}`;
      const existingItem = bucket.items.get(itemKey);

      if (existingItem) {
        existingItem.qty += quantity;
      } else {
        bucket.items.set(itemKey, {
          productId: product._id,
          name: product.name,
          image: product.image || `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`,
          price: unitPrice,
          qty: quantity,
        });
      }
    }

    const orderDocuments = [];
    let skippedBecauseRejectedInvoice = 0;
    let skippedBecauseEmptyOrder = 0;
    let skippedBecauseZeroTotal = 0;

    for (const bucket of invoiceBuckets.values()) {
      if (rejectedInvoices.has(bucket.invoiceNo)) {
        skippedBecauseRejectedInvoice += 1;
        continue;
      }

      const orderItems = Array.from(bucket.items.values());
      if (orderItems.length === 0) {
        skippedBecauseEmptyOrder += 1;
        continue;
      }

      const totalPrice = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      if (totalPrice <= 0) {
        skippedBecauseZeroTotal += 1;
        continue;
      }

      const dateValue = bucket.invoiceDate || new Date();
      const guestName = bucket.customerId ? `Customer ${bucket.customerId}` : `Guest ${bucket.invoiceNo}`;
      const guestEmail = bucket.customerId ? `guest.${bucket.customerId}@example.com` : `guest.${bucket.invoiceNo}@example.com`;

      orderDocuments.push({
        orderItems: orderItems.map(item => ({
          product: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          qty: item.qty,
        })),
        guestInfo: {
          name: guestName,
          email: guestEmail,
          phone: '0000000000',
        },
        shippingAddress: {
          address: `Online Retail Import - ${bucket.country}`,
          city: bucket.country,
          postalCode: '00000',
          country: bucket.country,
        },
        totalPrice,
        status: 'delivered',
        isPaid: true,
        paidAt: dateValue,
        isDelivered: true,
        deliveredAt: dateValue,
        note: `Imported from Excel - Invoice: ${bucket.invoiceNo}`,
      });
    }

    if (orderDocuments.length === 0) {
      throw new Error('Không có order hợp lệ nào sau khi áp dụng các ràng buộc dữ liệu.');
    }

    const insertedOrders = await Order.insertMany(orderDocuments, { ordered: false });

    console.log('\n📊 KẾT QUẢ IMPORT');
    console.log('================================');
    console.log(`Tổng dòng Excel: ${rows.length}`);
    console.log(`Số invoice hợp lệ: ${insertedOrders.length}`);
    console.log(`Invoice bị loại vì có dòng lỗi: ${rejectedInvoices.size}`);
    console.log(`Bỏ qua do order rỗng: ${skippedBecauseEmptyOrder}`);
    console.log(`Bỏ qua do totalPrice <= 0: ${skippedBecauseZeroTotal}`);
    console.log(`Cancelled orders: ${invalidReasons.cancelled}`);
    console.log(`Quantity <= 0: ${invalidReasons.invalidQuantity}`);
    console.log(`Negative quantity: ${invalidReasons.negativeQuantity}`);
    console.log(`UnitPrice <= 0: ${invalidReasons.invalidUnitPrice}`);
    console.log(`InvoiceDate không hợp lệ: ${invalidReasons.invalidInvoiceDate}`);
    console.log(`Country trống: ${invalidReasons.emptyCountry}`);
    console.log(`Product không tồn tại trong MongoDB: ${invalidReasons.productMissing}`);
    console.log(`Thiếu InvoiceNo: ${invalidReasons.missingInvoiceNo}`);
    console.log(`Tổng orders hiện có trong DB: ${await Order.countDocuments()}`);
    console.log('================================\n');

    const sampleOrder = await Order.findOne().populate('orderItems.product', 'name');
    if (sampleOrder) {
      console.log('📌 Sample Order:');
      console.log(JSON.stringify(sampleOrder, null, 2).substring(0, 500) + '...\n');
    }

    console.log('✅ Import thành công');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Import thất bại:', error.message);

    if (connected) {
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors on shutdown.
      }
    }

    process.exit(1);
  }
}

importOrdersFromExcel();

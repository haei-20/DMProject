require("dotenv").config();

const mongoose = require("mongoose");
const FPGrowth = require("node-fpgrowth");
const connectDB = require("./config/db");
const Order = require("./models/Order");

const TEST_PARAMS = [
  { support: 0.005, confidence: 0.5 },
  { support: 0.01, confidence: 0.5 },
  { support: 0.02, confidence: 0.5 },
  { support: 0.01, confidence: 0.7 },
];

const MIN_LIFT = 1.2;

function normalizeTransaction(order) {
  if (!order?.orderItems || !Array.isArray(order.orderItems)) {
    return null;
  }

  const uniqueProductIds = [
    ...new Set(
      order.orderItems
        .map((item) => item?.product?.toString?.())
        .filter(Boolean)
    ),
  ];

  if (uniqueProductIds.length < 2) {
    return null;
  }

  return uniqueProductIds;
}

async function loadTransactions() {
  const orders = await Order.find({})
    .select({ "orderItems.product": 1, _id: 0 })
    .lean();

  const transactions = orders
    .map(normalizeTransaction)
    .filter((tx) => Array.isArray(tx) && tx.length >= 2);

  return {
    orderCount: orders.length,
    transactionCount: transactions.length,
    transactions,
  };
}

function makeKey(items) {
  return [...items].map(String).sort().join("||");
}

function getSupportCount(itemset, supportMap) {
  const key = makeKey(itemset);
  return Number(supportMap.get(key) || 0);
}

function buildItemCountMap(transactions) {
  const itemCountMap = new Map();
  for (const transaction of transactions) {
    for (const item of transaction) {
      const key = String(item);
      itemCountMap.set(key, (itemCountMap.get(key) || 0) + 1);
    }
  }
  return itemCountMap;
}

function computeRulesFromFrequentItemsets(frequentItemsets, transactions, minConfidence) {
  const transactionCount = transactions.length;
  const supportMap = new Map();
  const itemCountMap = buildItemCountMap(transactions);
  for (const itemset of frequentItemsets) {
    if (!Array.isArray(itemset?.items) || !itemset.items.length) continue;
    supportMap.set(makeKey(itemset.items), Number(itemset.support || 0));
  }

  let totalRules = 0;
  let strongRules = 0;

  // Sinh luật 1 -> 1 từ các itemset có 2 phần tử để đo nhanh và ổn định.
  for (const itemset of frequentItemsets) {
    if (!Array.isArray(itemset?.items) || itemset.items.length !== 2) continue;
    const [a, b] = itemset.items.map(String);
    const pairCount = getSupportCount([a, b], supportMap);
    const aCount = Number(itemCountMap.get(a) || 0);
    const bCount = Number(itemCountMap.get(b) || 0);

    if (aCount > 0) {
      const confidenceAB = pairCount / aCount;
      if (confidenceAB >= minConfidence) {
        totalRules += 1;
        const liftAB = confidenceAB / (bCount / transactionCount);
        if (liftAB > MIN_LIFT) strongRules += 1;
      }
    }

    if (bCount > 0) {
      const confidenceBA = pairCount / bCount;
      if (confidenceBA >= minConfidence) {
        totalRules += 1;
        const liftBA = confidenceBA / (aCount / transactionCount);
        if (liftBA > MIN_LIFT) strongRules += 1;
      }
    }
  }

  return { totalRules, strongRules };
}

async function runMiningWithParams(transactions, support, confidence) {
  const fpGrowth = new FPGrowth.FPGrowth(support);
  const frequentItemsets = await fpGrowth.exec(transactions);
  return computeRulesFromFrequentItemsets(
    frequentItemsets,
    transactions,
    confidence
  );
}

async function testParameters() {
  await connectDB();

  try {
    const { orderCount, transactionCount, transactions } = await loadTransactions();

    console.log("=== BAT DAU THU NGHIEM THAM SO ===");
    console.log(`Tong so don hang: ${orderCount}`);
    console.log(`So giao dich hop le (>= 2 san pham): ${transactionCount}\n`);

    if (transactionCount < 2) {
      console.log("Khong du du lieu de sinh luat ket hop.");
      return;
    }

    for (const p of TEST_PARAMS) {
      console.log(
        `Dang chay voi min_support = ${p.support}, min_confidence = ${p.confidence}`
      );

      const start = Date.now();
      const result = await runMiningWithParams(
        transactions,
        p.support,
        p.confidence
      );
      const duration = (Date.now() - start) / 1000;

      console.log(`Thoi gian chay: ${duration.toFixed(2)} giay`);
      console.log(`So luat sinh ra (truoc loc Lift): ${result.totalRules}`);
      console.log(`So luat chat luong cao (Lift > ${MIN_LIFT}): ${result.strongRules}`);
      console.log("=".repeat(60));
    }
  } finally {
    await mongoose.disconnect();
  }
}

testParameters().catch((error) => {
  console.error("Loi khi test mining:", error);
  process.exitCode = 1;
});

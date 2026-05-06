require("dotenv").config();

const mongoose = require("mongoose");
const FPGrowth = require("node-fpgrowth");
const connectDB = require("./config/db");
const Order = require("./models/Order");

const PARAMS = {
  minSupport: 0.01,
  minConfidence: 0.5,
  minLift: 1.2,
};

const RUNS = 3;

function normalizeTransaction(order) {
  if (!order?.orderItems || !Array.isArray(order.orderItems)) return null;
  const items = [...new Set(order.orderItems.map((i) => i?.product?.toString?.()).filter(Boolean))];
  if (items.length < 2) return null;
  return items;
}

function keyOf(items) {
  return [...items].map(String).sort().join("||");
}

function buildItemCountMap(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    for (const item of tx) {
      const k = String(item);
      map.set(k, (map.get(k) || 0) + 1);
    }
  }
  return map;
}

function computeRulesFromFrequentPairs(frequentItemsets, itemCountMap, txCount) {
  let totalRules = 0;
  let strongRules = 0;

  for (const itemset of frequentItemsets) {
    if (!Array.isArray(itemset?.items) || itemset.items.length !== 2) continue;
    const [a, b] = itemset.items.map(String);
    const pairCount = Number(itemset.support || 0);
    const aCount = Number(itemCountMap.get(a) || 0);
    const bCount = Number(itemCountMap.get(b) || 0);

    if (aCount > 0 && bCount > 0) {
      const confAB = pairCount / aCount;
      if (confAB >= PARAMS.minConfidence) {
        totalRules += 1;
        const liftAB = confAB / (bCount / txCount);
        if (liftAB >= PARAMS.minLift) strongRules += 1;
      }

      const confBA = pairCount / bCount;
      if (confBA >= PARAMS.minConfidence) {
        totalRules += 1;
        const liftBA = confBA / (aCount / txCount);
        if (liftBA >= PARAMS.minLift) strongRules += 1;
      }
    }
  }

  return { totalRules, strongRules };
}

async function loadTransactions() {
  const orders = await Order.find({}).select({ "orderItems.product": 1, _id: 0 }).lean();
  const transactions = orders.map(normalizeTransaction).filter(Boolean);
  return { orderCount: orders.length, transactionCount: transactions.length, transactions };
}

async function runFPGrowth(transactions) {
  const fpg = new FPGrowth.FPGrowth(PARAMS.minSupport);
  const frequentItemsets = await fpg.exec(transactions);
  const filteredFrequentItemsets = frequentItemsets.filter((f) => Array.isArray(f.items) && f.items.length >= 1);
  const itemCountMap = buildItemCountMap(transactions);
  const { totalRules, strongRules } = computeRulesFromFrequentPairs(filteredFrequentItemsets, itemCountMap, transactions.length);
  return {
    frequentItemsets: filteredFrequentItemsets.length,
    totalRules,
    strongRules,
  };
}

async function averageTime(fn, runs) {
  const times = [];
  let result = null;
  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    result = await fn();
    times.push((Date.now() - start) / 1000);
  }
  const avgSeconds = times.reduce((a, b) => a + b, 0) / times.length;
  return { avgSeconds, result };
}

async function main() {
  await connectDB();
  try {
    const { orderCount, transactionCount, transactions } = await loadTransactions();
    console.log("=== FP-GROWTH OPTIMAL PARAMS ===");
    console.log(`min_support=${PARAMS.minSupport}, min_confidence=${PARAMS.minConfidence}, min_lift=${PARAMS.minLift}`);
    console.log(`Tong don hang: ${orderCount}`);
    console.log(`So transaction hop le da chay: ${transactionCount}`);

    const timed = await averageTime(() => runFPGrowth(transactions), RUNS);

    console.log("\n--- FP-Growth ---");
    console.log(`So Frequent Itemsets: ${timed.result.frequentItemsets}`);
    console.log(`So luat ket hop (truoc loc Lift): ${timed.result.totalRules}`);
    console.log(`So luat chat luong cao (Lift >= ${PARAMS.minLift}): ${timed.result.strongRules}`);
    console.log(`Thoi gian chay trung binh (${RUNS} lan): ${timed.avgSeconds.toFixed(2)} giay`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Loi test FP-Growth:", err);
  process.exitCode = 1;
});

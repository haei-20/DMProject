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

const RUNS = 1;
const MAX_TRANSACTIONS_FOR_COMPARE = Number(process.env.MAX_TRANSACTIONS_FOR_COMPARE || 4000);

function normalizeTransaction(order) {
  if (!order?.orderItems || !Array.isArray(order.orderItems)) return null;
  const items = [...new Set(order.orderItems.map((i) => i?.product?.toString?.()).filter(Boolean))];
  if (items.length < 2) return null;
  return items;
}

async function loadTransactions() {
  const orders = await Order.find({}).select({ "orderItems.product": 1, _id: 0 }).lean();
  const transactions = orders.map(normalizeTransaction).filter(Boolean);
  return { orderCount: orders.length, transactionCount: transactions.length, transactions };
}

function selectTransactionsForCompare(transactions, maxCount) {
  if (!Number.isFinite(maxCount) || maxCount <= 0 || transactions.length <= maxCount) {
    return transactions;
  }
  // Lấy tập con cố định để benchmark ổn định, lặp lại được.
  return transactions.slice(0, maxCount);
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

function metricsFromPairs(pairCounts, itemCountMap, txCount, minConfidence, minLift) {
  let totalRules = 0;
  let strongRules = 0;
  for (const [pairKey, pairCount] of pairCounts.entries()) {
    const [a, b] = pairKey.split("||");
    const aCount = itemCountMap.get(a) || 0;
    const bCount = itemCountMap.get(b) || 0;

    if (aCount > 0) {
      const confAB = pairCount / aCount;
      if (confAB >= minConfidence) {
        totalRules += 1;
        const liftAB = confAB / (bCount / txCount);
        if (liftAB >= minLift) strongRules += 1;
      }
    }
    if (bCount > 0) {
      const confBA = pairCount / bCount;
      if (confBA >= minConfidence) {
        totalRules += 1;
        const liftBA = confBA / (aCount / txCount);
        if (liftBA >= minLift) strongRules += 1;
      }
    }
  }
  return { totalRules, strongRules };
}

function pairCountsFromTransactions(transactions, minSupportCount) {
  const map = new Map();
  for (const tx of transactions) {
    for (let i = 0; i < tx.length; i++) {
      for (let j = i + 1; j < tx.length; j++) {
        const pairKey = keyOf([tx[i], tx[j]]);
        map.set(pairKey, (map.get(pairKey) || 0) + 1);
      }
    }
  }
  for (const [k, count] of map.entries()) {
    if (count < minSupportCount) map.delete(k);
  }
  return map;
}

async function runFPGrowthLike(transactions) {
  const fpg = new FPGrowth.FPGrowth(PARAMS.minSupport);
  const frequent = await fpg.exec(transactions);
  const frequentItemsets = frequent.filter((x) => Array.isArray(x.items) && x.items.length >= 1);

  const itemCountMap = buildItemCountMap(transactions);
  const pairCounts = new Map();
  for (const f of frequent) {
    if (!Array.isArray(f.items) || f.items.length !== 2) continue;
    pairCounts.set(keyOf(f.items), Number(f.support || 0));
  }
  const { totalRules, strongRules } = metricsFromPairs(
    pairCounts,
    itemCountMap,
    transactions.length,
    PARAMS.minConfidence,
    PARAMS.minLift
  );

  return {
    frequentItemsets: frequentItemsets.length,
    totalRules,
    strongRules,
  };
}

async function averageTime(fn, runs) {
  const times = [];
  let latest = null;
  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    latest = await fn();
    times.push((Date.now() - start) / 1000);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { avgSeconds: avg, latest };
}

async function main() {
  await connectDB();
  try {
    const { orderCount, transactionCount, transactions } = await loadTransactions();
    const evalTransactions = selectTransactionsForCompare(
      transactions,
      MAX_TRANSACTIONS_FOR_COMPARE
    );
    console.log("=== KET QUA THAM SO TOI UU ===");
    console.log(`min_support=${PARAMS.minSupport}, min_confidence=${PARAMS.minConfidence}, min_lift=${PARAMS.minLift}`);
    console.log(`Tong don hang: ${orderCount}`);
    console.log(`So transaction hop le: ${transactionCount}`);
    console.log(`So transaction dung de so sanh: ${evalTransactions.length}`);

    const fpTimed = await averageTime(() => runFPGrowthLike(evalTransactions), RUNS);

    console.log("\n--- FP-Growth ---");
    console.log(`So Frequent Itemsets: ${fpTimed.latest.frequentItemsets}`);
    console.log(`So luat ket hop (truoc loc Lift): ${fpTimed.latest.totalRules}`);
    console.log(`So luat chat luong cao (Lift >= ${PARAMS.minLift}): ${fpTimed.latest.strongRules}`);
    console.log(`Thoi gian chay trung binh (${RUNS} lan): ${fpTimed.avgSeconds.toFixed(2)} giay`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Loi test:", err);
  process.exitCode = 1;
});

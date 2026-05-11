/**
 * Benchmark association-rule metrics (đọc DB thật).
 *
 * Lưu ý: dự án không có `generateRecommendations`; API đúng là
 * `getFrequentlyBoughtTogether` / `getMiningAssociationRuleStats`.
 *
 * Chạy: cd backend/node && node test-mining.js
 * Tùy chọn: MINING_TEST_ORDER_LIMIT=10000 node test-mining.js
 *           FULL_PIPELINE=1 node test-mining.js   (thêm FP-Growth + enrich, chậm)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const recommendationService = require('./services/recommendationService');

const ORDER_LIMIT = parseInt(process.env.MINING_TEST_ORDER_LIMIT || '5000', 10);
const MIN_LIFT = 1.2;
const RUN_FULL = process.env.FULL_PIPELINE === '1';

async function testParameters() {
  const params = [
    { support: 0.005, confidence: 0.5 },
    { support: 0.01, confidence: 0.5 },
    { support: 0.02, confidence: 0.5 },
    { support: 0.01, confidence: 0.7 }
  ];

  console.log('=== THỬ NGHIỆM THAM SỐ (dữ liệu thật từ MongoDB) ===\n');
  console.log(`orderLimit (giao dịch FBT mục tiêu): ${ORDER_LIMIT}`);
  console.log(`minLift cho “luật mạnh”: >= ${MIN_LIFT}\n`);

  for (const p of params) {
    console.log(`\n--- min_support=${p.support}, min_confidence=${p.confidence} ---`);

    const tStats = Date.now();
    const stats = await recommendationService.getMiningAssociationRuleStats(
      p.support,
      p.confidence,
      ORDER_LIMIT,
      MIN_LIFT,
      {}
    );
    const statsDuration = (Date.now() - tStats) / 1000;

    if (!stats.success) {
      console.log('Lỗi / không đủ dữ liệu:', stats.message || stats);
      console.log('='.repeat(60));
      continue;
    }

    console.log(`Thời gian (đọc đơn + đếm luật, không FP-Growth): ${statsDuration.toFixed(2)} s`);
    console.log(`Giao dịch hợp lệ: ${stats.validTransactionCount} (minSupport dùng: ${stats.usedMinSupport})`);
    console.log(`Số luật (trước lọc lift, minLift=0): ${stats.ruleCountBeforeLiftFilter}`);
    console.log(`Số luật thỏa lift >= ${MIN_LIFT}: ${stats.ruleCountWithLiftAtLeast}`);
    console.log(`Số luật lift > ${MIN_LIFT} (nghiêm ngặt hơn): ${stats.ruleCountLiftStrictlyGreaterThanThreshold}`);

    if (RUN_FULL) {
      console.log('--- Pipeline đầy đủ (FP-Growth + enrich) ---');
      const tFull = Date.now();
      const full = await recommendationService.getFrequentlyBoughtTogether(
        p.support,
        ORDER_LIMIT,
        p.confidence,
        MIN_LIFT,
        1
      );
      const fullDur = (Date.now() - tFull) / 1000;
      console.log(`Thời gian pipeline đầy đủ: ${fullDur.toFixed(2)} s`);
      if (full.info) {
        console.log(
          `info.elapsedSecondsTotal: ${Number(full.info.elapsedSecondsTotal).toFixed(2)} s | algorithm: ${full.info.algorithm}`
        );
        console.log(`strongRuleCountTotal (API): ${full.info.strongRuleCountTotal}`);
      }
      console.log(`success: ${full.success}`);
    }

    console.log('='.repeat(60));
  }
}

async function main() {
  await connectDB();
  try {
    await testParameters();
  } finally {
    await mongoose.disconnect();
    console.log('\nĐã ngắt kết nối MongoDB.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

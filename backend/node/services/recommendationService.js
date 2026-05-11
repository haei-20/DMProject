const FPGrowth = require("node-fpgrowth");
const NodeCache = require("node-cache");
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// useClones: false — dữ liệu fp JSON lớn, tránh clone sâu mỗi lần get (không sửa mảng in-place).
const cache = new NodeCache({ stdTTL: 600, useClones: false });

const FP_SCRIPTS_DIR = path.join(__dirname, "../scripts");
const FP_TRANSACTIONS_PATH = path.join(FP_SCRIPTS_DIR, "fp_transactions.json");
const FP_PAIR_RULES_PATH = path.join(FP_SCRIPTS_DIR, "fp_pair_rules.json");
const FP_STRONG_RULES_PATH = path.join(FP_SCRIPTS_DIR, "fp_strong_rules.json");

/** Dữ liệu nguồn từ 3 file JSON — lưu trong NodeCache (TTL dài; xóa bằng clear / preload). */
const CACHE_KEY_FP_TRANSACTIONS = "fp:transactions";
const CACHE_KEY_FP_PAIR_RULES = "fp:pair-rules";
const CACHE_KEY_FP_STRONG_RULES = "fp:strong-rules";
/** Key cũ (tính từ DB); luôn xóa khi preload để tránh nhầm. */
const CACHE_KEY_PAIR_LEGACY = "pair-association";

const TTL_FP_SOURCE_SEC = 3600 * 24 * 365; // 1 năm — nguồn file; làm mới bằng clear hoặc preload

/**
 * TTL entry cache kết quả FBT trong NodeCache (giây). Mặc định 7 ngày.
 * FBT_CACHE_TTL_SEC=0 → NodeCache v5: không tự xóa theo TTL (chỉ nhờ cron / force); không khuyến nghị.
 */
const DEFAULT_TTL_FBT_SEC = 7 * 24 * 3600;
const TTL_FBT_RESULT_SEC = (() => {
  const raw = process.env.FBT_CACHE_TTL_SEC;
  if (raw === undefined || raw === "") return DEFAULT_TTL_FBT_SEC;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_FBT_SEC;
})();

/** Sau khoảng này (ms) coi cache FBT “cũ” → request tiếp theo chạy lại FP-Growth (trừ khi có force). Mặc định 3 ngày. */
const FBT_RECOMPUTE_AFTER_MS = (() => {
  const raw = process.env.FBT_RECOMPUTE_AFTER_MS;
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return 3 * 24 * 3600 * 1000;
})();

const FBT_CACHE_KEY_PREFIX = "frequently-bought-together-";

/** Ngưỡng gợi ý cho khách: support, confidence, lift, độ dài itemset tối thiểu (luật cặp + mẫu FP fallback). Ghi đè bằng biến môi trường nếu cần. */
const CUSTOMER_REC_MIN_SUPPORT = (() => {
  const n = Number(process.env.CUSTOMER_REC_MIN_SUPPORT);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.01;
})();
const CUSTOMER_REC_MIN_CONFIDENCE = (() => {
  const n = Number(process.env.CUSTOMER_REC_MIN_CONFIDENCE);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.5;
})();
const CUSTOMER_REC_MIN_LIFT = (() => {
  const n = Number(process.env.CUSTOMER_REC_MIN_LIFT);
  return Number.isFinite(n) && n > 0 ? n : 1.2;
})();
const CUSTOMER_REC_MIN_ITEMSET_SIZE = (() => {
  const n = parseInt(process.env.CUSTOMER_REC_MIN_ITEMSET_SIZE, 10);
  return Number.isFinite(n) && n >= 2 ? n : 2;
})();

async function readFpTransactionsFromDisk() {
  const raw = await fs.readFile(FP_TRANSACTIONS_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("fp_transactions.json phải là mảng JSON");
  }
  return data
    .map((row) => (Array.isArray(row) ? [...new Set(row.map((x) => String(x)))] : []))
    .filter((row) => row.length >= 1);
}

async function loadFpTransactionsArray({ force = false } = {}) {
  if (!force) {
    const hit = cache.get(CACHE_KEY_FP_TRANSACTIONS);
    if (hit) return hit;
  }
  const parsed = await readFpTransactionsFromDisk();
  cache.set(CACHE_KEY_FP_TRANSACTIONS, parsed, TTL_FP_SOURCE_SEC);
  console.log(`[NodeCache ${CACHE_KEY_FP_TRANSACTIONS}] đã nạp ${parsed.length} giao dịch từ fp_transactions.json`);
  return parsed;
}

async function loadFpPairRulesArray({ force = false } = {}) {
  if (!force) {
    const hit = cache.get(CACHE_KEY_FP_PAIR_RULES);
    if (hit) return hit;
  }
  const raw = await fs.readFile(FP_PAIR_RULES_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("fp_pair_rules.json phải là mảng JSON");
  }
  cache.set(CACHE_KEY_FP_PAIR_RULES, data, TTL_FP_SOURCE_SEC);
  console.log(`[NodeCache ${CACHE_KEY_FP_PAIR_RULES}] đã nạp ${data.length} luật từ fp_pair_rules.json`);
  return data;
}

async function loadFpStrongRulesArray({ force = false } = {}) {
  if (!force) {
    const hit = cache.get(CACHE_KEY_FP_STRONG_RULES);
    if (hit) return hit;
  }
  const raw = await fs.readFile(FP_STRONG_RULES_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error("fp_strong_rules.json phải là mảng JSON");
  }
  cache.set(CACHE_KEY_FP_STRONG_RULES, data, TTL_FP_SOURCE_SEC);
  console.log(`[NodeCache ${CACHE_KEY_FP_STRONG_RULES}] đã nạp ${data.length} luật từ fp_strong_rules.json`);
  return data;
}

/**
 * Đọc lại 3 file fp_*.json vào NodeCache; xóa key legacy pair-association.
 * Gọi khi khởi động server hoặc sau khi sửa file JSON.
 */
async function preloadFpSourceFiles({ replace = true } = {}) {
  if (replace) {
    cache.del(CACHE_KEY_FP_TRANSACTIONS);
    cache.del(CACHE_KEY_FP_PAIR_RULES);
    cache.del(CACHE_KEY_FP_STRONG_RULES);
    cache.del(CACHE_KEY_PAIR_LEGACY);
  }
  await Promise.all([
    loadFpTransactionsArray({ force: true }),
    loadFpPairRulesArray({ force: true }),
    loadFpStrongRulesArray({ force: true }),
  ]);
  console.log("preloadFpSourceFiles: đã đồng bộ 3 file fp_*.json vào NodeCache.");
}

/**
 * Xóa toàn bộ NodeCache (kết quả FBT, fp-growth, dữ liệu fp cũ…),
 * rồi nạp lại 3 file fp_*.json vào cache (không giữ dữ liệu tính toán cũ).
 */
function clearRecommendationCache() {
  cache.flushAll();
  console.log("Đã xóa toàn bộ cache recommendation (flushAll).");
  preloadFpSourceFiles({ replace: true }).catch((err) =>
    console.error("clearRecommendationCache → preloadFpSourceFiles:", err)
  );
  return { ok: true };
}

/** Xóa mọi entry cache kết quả FBT (`frequently-bought-together-*`). Lần gọi API sau sẽ chạy lại thuật toán. */
function invalidateFbtComputedResultsCache() {
  const keys = typeof cache.keys === "function" ? cache.keys() : [];
  let n = 0;
  for (const k of keys) {
    if (typeof k === "string" && k.startsWith(FBT_CACHE_KEY_PREFIX)) {
      cache.del(k);
      n += 1;
    }
  }
  console.log(`invalidateFbtComputedResultsCache: đã xóa ${n} key kết quả FBT`);
  return n;
}

/**
 * Giao dịch cho FP-Growth / mining: luôn lấy từ scripts/fp_transactions.json.
 * @param {number} targetFbtValidCount — >0: chỉ lấy N dòng đầu (giống giới hạn mẫu FBT).
 */
const getTransactions = async (targetFbtValidCount = 0) => {
  try {
    console.log(`Lấy giao dịch từ fp_transactions.json (targetFbtValidCount=${targetFbtValidCount})`);
    const all = await loadFpTransactionsArray();
    const fullLen = all.length;
    if (targetFbtValidCount > 0) {
      const slice = all.slice(0, targetFbtValidCount);
      return {
        transactions: slice,
        meta: {
          mode: "fp_transactions_file",
          ordersScanned: fullLen,
          requestedValidTransactions: targetFbtValidCount,
          collectedValidTransactions: slice.length,
        },
      };
    }
    return {
      transactions: all,
      meta: { mode: "fp_transactions_file", ordersScanned: fullLen },
    };
  } catch (error) {
    console.error("Lỗi đọc fp_transactions.json:", error);
    return { transactions: [], meta: null };
  }
};

// Tự động chọn minSupport dựa vào số lượng giao dịch
const getDynamicMinSupport = (numTransactions) => {
  if (numTransactions < 50) return 0.05; // Dữ liệu ít -> giảm minSupport
  if (numTransactions < 500) return 0.1;
  return 0.2; // Dữ liệu nhiều -> tăng minSupport để giảm noise
};

/**
 * Khóa trong luật / mẫu có thể là ObjectId (24 hex) hoặc mã sku (Product.sku, ví dụ fp_*.json).
 * Map: chuỗi khóa đúng như trong luật → ObjectId trong DB.
 */
async function resolveProductKeysToIdMap(rawKeys) {
  const keys = [...new Set((rawKeys || []).map((k) => String(k).trim()).filter(Boolean))];
  if (keys.length === 0) return new Map();

  const objectIdStrings = keys.filter((k) => mongoose.Types.ObjectId.isValid(k));
  const skuKeys = keys.filter((k) => !mongoose.Types.ObjectId.isValid(k));

  const orConditions = [];
  if (objectIdStrings.length > 0) {
    orConditions.push({
      _id: { $in: objectIdStrings.map((k) => new mongoose.Types.ObjectId(k)) },
    });
  }
  if (skuKeys.length > 0) {
    orConditions.push({ sku: { $in: skuKeys } });
  }
  if (orConditions.length === 0) return new Map();

  const products = await Product.find({ $or: orConditions }).select('_id sku').lean();
  const map = new Map();
  for (const p of products) {
    map.set(String(p._id), p._id);
    if (p.sku != null && String(p.sku).length > 0) {
      map.set(String(p.sku), p._id);
    }
  }
  return map;
}

/**
 * Toàn bộ khóa xuất hiện trong fp_pair_rules → ObjectId (qua Product._id hoặc Product.sku).
 * Dùng để khớp giỏ chỉ có Mongo _id với luật chỉ lưu SKU/mã giao dịch (vd. "23171").
 */
async function getPairRuleKeyToOidMap() {
  const rules = await getPairAssociationRules();
  const keys = new Set();
  for (const r of rules) {
    if (Array.isArray(r.items)) {
      for (const it of r.items) keys.add(String(it));
    }
    if (r.antecedent != null && r.antecedent !== '') keys.add(String(r.antecedent));
    if (r.consequent != null && r.consequent !== '') keys.add(String(r.consequent));
  }
  return resolveProductKeysToIdMap([...keys]);
}

/**
 * Lọc luật cặp (fp_pair_rules.json) cho gợi ý khách — ngưỡng CUSTOMER_REC_*.
 */
function filterPairRulesForCustomer(rules) {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const ms = CUSTOMER_REC_MIN_SUPPORT;
  const mc = CUSTOMER_REC_MIN_CONFIDENCE;
  const ml = CUSTOMER_REC_MIN_LIFT;
  const minLen = CUSTOMER_REC_MIN_ITEMSET_SIZE;

  return rules.filter((r) => {
    const items = r?.items;
    if (!Array.isArray(items) || items.length < minLen) return false;

    const sup = Number(r.support);
    if (!Number.isFinite(sup) || sup < ms) return false;

    const conf = Number(r.confidence);
    if (!Number.isFinite(conf) || conf < mc) return false;

    const lift = Number(r.lift);
    if (!Number.isFinite(lift) || lift < ml) return false;

    return true;
  });
}

/**
 * Chuẩn hóa support mẫu FP (thư viện có thể trả tỉ lệ hoặc đếm tuyệt đối).
 */
function normalizePatternSupport(rawSupport, transactionCount) {
  let sup = Number(rawSupport);
  if (!Number.isFinite(sup) || sup < 0) return 0;
  if (transactionCount > 0 && sup > 1) {
    sup = sup / transactionCount;
  }
  if (sup > 1) sup = 1;
  return sup;
}

function filterFrequentPatternsForCustomer(patterns, transactionCount) {
  if (!Array.isArray(patterns) || patterns.length === 0) return [];
  const ms = CUSTOMER_REC_MIN_SUPPORT;
  const minLen = CUSTOMER_REC_MIN_ITEMSET_SIZE;
  return patterns.filter((pat) => {
    const items = pat?.items;
    if (!Array.isArray(items) || items.length < minLen) return false;
    const sup = normalizePatternSupport(pat.support, transactionCount);
    return sup >= ms;
  });
}

/**
 * Lọc luật mạnh (fp_strong_rules.json) theo ngưỡng admin — khớp với tham số API/cache FBT.
 */
function filterStrongRulesByThresholds(rules, minConfidence, minLift, minConviction) {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const mc = Number(minConfidence);
  const ml = Number(minLift);
  const mv = Number(minConviction);
  if (!Number.isFinite(mc) || !Number.isFinite(ml) || !Number.isFinite(mv)) {
    return rules;
  }

  return rules.filter((r) => {
    const c = Number(r?.confidence);
    if (!Number.isFinite(c) || c < mc) return false;

    const l = Number(r?.lift);
    if (!Number.isFinite(l) || l < ml) return false;

    const convRaw = r?.conviction;
    if (convRaw === Number.POSITIVE_INFINITY || convRaw === "Infinity") {
      return true;
    }
    const v = Number(convRaw);
    if (!Number.isFinite(v) || v < mv) return false;
    return true;
  });
}

const enrichStrongRulesWithProducts = async (strongRules) => {
  if (!Array.isArray(strongRules) || strongRules.length === 0) return [];

  const ids = new Set();
  for (const rule of strongRules) {
    for (const a of (rule?.antecedent || [])) ids.add(String(a));
    for (const b of (rule?.consequent || [])) ids.add(String(b));
  }

  const keyMap = await resolveProductKeysToIdMap([...ids]);
  const uniqueOids = [...new Set([...keyMap.values()])];
  if (uniqueOids.length === 0) {
    return strongRules.map((rule) => ({
      ...rule,
      antecedentProducts: (rule?.antecedent || []).map((id) => ({ _id: id, name: String(id) })),
      consequentProducts: (rule?.consequent || []).map((id) => ({ _id: id, name: String(id) })),
    }));
  }

  const products = await Product.find({ _id: { $in: uniqueOids } })
    .select('_id name price image category')
    .lean();

  const prodById = new Map(products.map((p) => [String(p._id), p]));

  return strongRules.map((rule) => {
    const antecedentProducts = (rule?.antecedent || []).map((id) => {
      const oid = keyMap.get(String(id));
      return (oid && prodById.get(String(oid))) || { _id: id, name: String(id) };
    });
    const consequentProducts = (rule?.consequent || []).map((id) => {
      const oid = keyMap.get(String(id));
      return (oid && prodById.get(String(oid))) || { _id: id, name: String(id) };
    });
    return { ...rule, antecedentProducts, consequentProducts };
  });
};

/** Luật cặp: từ NodeCache key fp:pair-rules (nguồn fp_pair_rules.json). */
const getPairAssociationRules = async () => {
  try {
    return await loadFpPairRulesArray();
  } catch (error) {
    console.error("Lỗi đọc fp_pair_rules.json / cache:", error);
    return [];
  }
};

/** Luật cặp đã lọc theo ngưỡng gợi ý khách (support / confidence / lift / |itemset|). */
const getCustomerPairAssociationRules = async () => {
  const raw = await getPairAssociationRules();
  return filterPairRulesForCustomer(raw);
};

// Lấy đề xuất sản phẩm cho giỏ hàng dựa trên các sản phẩm đang có trong giỏ
const getCartRecommendations = async (cartItems, limit = 4) => {
  try {
    const cartProductIds = cartItems
      .map(item => {
        if (typeof item.product === 'object' && item.product._id) {
          return item.product._id.toString();
        }
        return item.product.toString();
      })
      .filter(id => id);

    console.log('Cart product IDs:', cartProductIds);

    if (cartProductIds.length === 0) {
      console.log('Giỏ hàng trống, đề xuất sản phẩm nổi bật');
      return Product.find({ featured: true })
        .limit(limit)
        .select('_id name price image rating numReviews');
    }

    const cartKeySet = new Set(cartProductIds.map(String));
    const cartOidList = cartProductIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (cartOidList.length > 0) {
      const cartRows = await Product.find({ _id: { $in: cartOidList } }).select('_id sku').lean();
      for (const p of cartRows) {
        cartKeySet.add(String(p._id));
        if (p.sku != null && String(p.sku).length > 0) cartKeySet.add(String(p.sku));
      }
    }

    const cartOidStrings = new Set(cartOidList.map((id) => String(id)));
    const pairKeyToOid = await getPairRuleKeyToOidMap();
    for (const [key, oid] of pairKeyToOid) {
      if (cartOidStrings.has(String(oid))) cartKeySet.add(key);
    }

    const rules = filterPairRulesForCustomer(await getPairAssociationRules());
    console.log(`Đã lấy ${rules.length} luật cặp (đã lọc ngưỡng khách: support≥${CUSTOMER_REC_MIN_SUPPORT}, conf≥${CUSTOMER_REC_MIN_CONFIDENCE}, lift≥${CUSTOMER_REC_MIN_LIFT}, |items|≥${CUSTOMER_REC_MIN_ITEMSET_SIZE})`);

    const relevantRules = rules.filter(
      (rule) => rule.items && rule.items.some((item) => cartKeySet.has(String(item)))
    );

    console.log(`Tìm thấy ${relevantRules.length} luật liên quan đến sản phẩm trong giỏ hàng`);

    let recommendedProductIds = new Set();

    relevantRules.forEach((rule) => {
      if (rule.items && Array.isArray(rule.items)) {
        rule.items.forEach((item) => {
          if (!cartKeySet.has(String(item))) {
            recommendedProductIds.add(String(item));
          }
        });
      }
    });

    const rawRecommended = [...recommendedProductIds].slice(0, limit);
    const recKeyMap = await resolveProductKeysToIdMap(rawRecommended);
    const recommendedOids = rawRecommended.map((k) => recKeyMap.get(String(k))).filter(Boolean);
    const uniqueRecOids = [...new Set(recommendedOids.map((o) => String(o)))].map(
      (s) => new mongoose.Types.ObjectId(s)
    );

    console.log(`Các khóa đề xuất (sku/_id): ${rawRecommended.join(', ')}`);

    const SELECT_CART = '_id name price image rating numReviews';
    let recommendedProducts =
      uniqueRecOids.length > 0
        ? await Product.find({ _id: { $in: uniqueRecOids } }).select(SELECT_CART).lean()
        : [];

    console.log(`Tìm thấy ${recommendedProducts.length} sản phẩm đề xuất (luật cặp)`);

    const seenIds = new Set([
      ...cartProductIds.map(String),
      ...recommendedProducts.map((p) => String(p._id)),
    ]);

    if (recommendedProducts.length < limit) {
      const excludeForFp = new Set(cartKeySet);
      seenIds.forEach((id) => excludeForFp.add(id));
      const need = limit - recommendedProducts.length;
      const fpKeys = await getSuggestionKeysFromFpGrowthPatterns(cartKeySet, excludeForFp, need * 3);
      if (fpKeys.length) {
        const more = await fetchProductsByRawKeys(fpKeys, SELECT_CART);
        for (const p of more) {
          const id = String(p._id);
          if (seenIds.has(id)) continue;
          recommendedProducts.push(p);
          seenIds.add(id);
          if (recommendedProducts.length >= limit) break;
        }
        console.log(`Sau FP-Growth cache: ${recommendedProducts.length} sản phẩm`);
      }
    }

    if (recommendedProducts.length < limit) {
      const additionalCount = limit - recommendedProducts.length;
      console.log(`Bổ sung thêm ${additionalCount} sản phẩm nổi bật`);

      const additionalProducts = await Product.find({
        _id: { $nin: [...seenIds] },
        featured: true,
      })
        .limit(additionalCount)
        .select(SELECT_CART)
        .lean();

      recommendedProducts = [...recommendedProducts, ...additionalProducts];
    }

    return recommendedProducts.slice(0, limit);
  } catch (error) {
    console.error('Lỗi khi tạo đề xuất giỏ hàng:', error);

    try {
      console.log('Trả về sản phẩm nổi bật do có lỗi trong quá trình đề xuất');
      return Product.find({ featured: true })
        .limit(limit)
        .select('_id name price image rating numReviews');
    } catch (fallbackError) {
      console.error('Lỗi khi lấy sản phẩm nổi bật:', fallbackError);
      return [];
    }
  }
};

// Thuật toán FP-Growth — opts.forCustomer: minSupport/ngưỡng mẫu cho khách (cache riêng fp-growth-customer)
const getFPGrowthRecommendations = async (opts = {}) => {
  const forCustomer = opts.forCustomer === true;
  const cacheKey = forCustomer ? "fp-growth-customer" : "fp-growth";

  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  const { transactions } = await getTransactions();
  if (!transactions || transactions.length < 2) {
    console.log("Không đủ dữ liệu giao dịch cho FP-Growth");
    return [];
  }

  const minSupport = forCustomer
    ? CUSTOMER_REC_MIN_SUPPORT
    : getDynamicMinSupport(transactions.length);
  const minItems = forCustomer ? CUSTOMER_REC_MIN_ITEMSET_SIZE : 2;

  const fpgrowth = new FPGrowth.FPGrowth(minSupport);
  const txCount = transactions.length;

  return new Promise((resolve) => {
    fpgrowth.exec(transactions).then((results) => {
      let frequentPatterns = results
        .filter((pattern) => Array.isArray(pattern.items) && pattern.items.length >= minItems)
        .map((pattern) => ({
          items: pattern.items,
          support: pattern.support,
        }));

      if (forCustomer) {
        frequentPatterns = filterFrequentPatternsForCustomer(frequentPatterns, txCount);
      }

      cache.set(cacheKey, frequentPatterns);
      resolve(frequentPatterns);
    });
  });
};

/**
 * Khóa gợi ý (sku / id string như trong fp_transactions) từ mẫu FP-Growth đã cache,
 * khi mẫu có giao với triggerKeys; loại excludeKeys.
 */
async function getSuggestionKeysFromFpGrowthPatterns(triggerKeys, excludeKeys, maxKeys) {
  const trigger = new Set([...triggerKeys].map(String));
  const exclude = new Set([...excludeKeys].map(String));
  if (trigger.size === 0 || maxKeys <= 0) return [];

  let patterns;
  try {
    patterns = await getFPGrowthRecommendations({ forCustomer: true });
  } catch (e) {
    console.warn("getSuggestionKeysFromFpGrowthPatterns:", e.message);
    return [];
  }
  if (!Array.isArray(patterns) || patterns.length === 0) return [];

  const scores = new Map();
  for (const pat of patterns) {
    const items = pat.items;
    if (!Array.isArray(items) || items.length < CUSTOMER_REC_MIN_ITEMSET_SIZE) continue;
    const strItems = items.map(String);
    if (!strItems.some((k) => trigger.has(k))) continue;

    let sup = typeof pat.support === "number" ? pat.support : 0;
    if (sup > 1) sup = 1;
    if (sup <= 0) sup = 0.0001;

    for (const k of strItems) {
      if (trigger.has(k) || exclude.has(k)) continue;
      const prev = scores.get(k) ?? 0;
      if (sup > prev) scores.set(k, sup);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeys)
    .map(([k]) => k);
}

async function fetchProductsByRawKeys(rawKeys, selectFields) {
  const keys = [...new Set((rawKeys || []).map((k) => String(k).trim()).filter(Boolean))];
  if (keys.length === 0) return [];
  const keyMap = await resolveProductKeysToIdMap(keys);
  const oids = [...new Set(keys.map((k) => keyMap.get(String(k))).filter(Boolean))];
  if (oids.length === 0) return [];
  return Product.find({ _id: { $in: oids } })
    .select(selectFields)
    .lean();
}

// Lấy đề xuất sản phẩm cho trang chủ
const getHomepageRecommendations = async (userId = null, limit = 8) => {
  try {
    // Nếu có userId, tìm đề xuất cá nhân hóa
    if (userId) {
      // Lấy các sản phẩm mà người dùng đã mua
      const userOrders = await Order.find({ user: userId }, 'items.product');
      const userProducts = userOrders.flatMap(order => 
        order.items.map(item => item.product.toString())
      );
      
      if (userProducts.length > 0) {
        // Lấy các luật kết hợp từ FP-Growth (thường tốt hơn cho đề xuất cá nhân hóa)
        const rules = await getFPGrowthRecommendations({ forCustomer: true });
        
        // Tìm các luật có chứa sản phẩm mà người dùng đã mua
        const relevantRules = rules.filter(rule => 
          rule.items.some(item => userProducts.includes(item))
        );
        
        // Lấy các sản phẩm được đề xuất (loại bỏ các sản phẩm đã mua)
        let recommendedProductIds = new Set();
        
        relevantRules.forEach(rule => {
          rule.items.forEach(item => {
            if (!userProducts.includes(item)) {
              recommendedProductIds.add(item);
            }
          });
        });
        
        // Chuyển Set thành Array và giới hạn số lượng
        recommendedProductIds = [...recommendedProductIds].slice(0, limit);
        
        if (recommendedProductIds.length > 0) {
          // Lấy thông tin chi tiết sản phẩm
          const recommendedProducts = await Product.find({ 
            _id: { $in: recommendedProductIds } 
          }).select('_id name price images rating numReviews description');
          
          // Nếu không đủ sản phẩm đề xuất, bổ sung thêm sản phẩm nổi bật
          if (recommendedProducts.length < limit) {
            const additionalCount = limit - recommendedProducts.length;
            const existingIds = recommendedProducts.map(p => p._id.toString());
            
            const additionalProducts = await Product.find({ 
              _id: { $nin: [...userProducts, ...existingIds] },
              isFeatured: true
            })
            .limit(additionalCount)
            .select('_id name price images rating numReviews description');
            
            return [...recommendedProducts, ...additionalProducts];
          }
          
          return recommendedProducts;
        }
      }
    }
    
    // Nếu không có userId hoặc không có đề xuất cá nhân hóa, trả về sản phẩm nổi bật
    return await Product.find({ isFeatured: true })
      .limit(limit)
      .select('_id name price images rating numReviews description');
  } catch (error) {
    console.error("Lỗi khi tạo đề xuất trang chủ:", error);
    return [];
  }
};

// Lấy đề xuất sản phẩm thường được mua cùng nhau cho admin (để tạo combo) — chỉ FP-Growth
const getFrequentlyBoughtTogether = async (
  minSupport = 0.01,
  orderLimit = 1000,
  minConfidence = 0.1,
  minLift = 1,
  minConviction = 1,
  options = {}
) => {
  try {
    const forceRefresh = Boolean(options.forceRefresh);
    const algorithmLabel = "FP-Growth";
    const cacheKey = `${FBT_CACHE_KEY_PREFIX}${minSupport}-${orderLimit}-${minConfidence}-${minLift}-${minConviction}`;

    const cachedRaw = cache.get(cacheKey);
    if (!forceRefresh && cachedRaw) {
      const wrapped =
        cachedRaw &&
        typeof cachedRaw === "object" &&
        cachedRaw.__fbtV2 === true &&
        cachedRaw.payload
          ? cachedRaw
          : null;
      if (wrapped) {
        const cachedAt = Number(wrapped.cachedAt) || 0;
        const ageMs = Date.now() - cachedAt;
        if (cachedAt > 0 && ageMs >= 0 && ageMs < FBT_RECOMPUTE_AFTER_MS) {
          console.log(
            `Trả về kết quả FBT từ cache (tuổi ~${Math.round(ageMs / 3600000)} giờ; tối đa ${FBT_RECOMPUTE_AFTER_MS / 86400000} ngày trước khi tính lại)`
          );
          const payload = wrapped.payload;
          return {
            ...payload,
            info: {
              ...(payload.info && typeof payload.info === "object" ? payload.info : {}),
              fbtFromCache: true,
              fbtCachedAt: cachedAt,
              fbtCacheMaxAgeMs: FBT_RECOMPUTE_AFTER_MS,
              fbtCacheTtlSec: TTL_FBT_RESULT_SEC,
            },
          };
        }
        console.log(
          `Cache FBT đã ≥ ${FBT_RECOMPUTE_AFTER_MS / 86400000} ngày — chạy lại thuật toán`
        );
      } else {
        console.log("Cache FBT định dạng cũ — chạy lại thuật toán");
      }
    } else if (forceRefresh) {
      console.log("force=true — bỏ qua cache FBT, chạy lại thuật toán");
    }

    console.log(
      `Phân tích dữ liệu với minSupport=${minSupport}, minConfidence=${minConfidence}, minLift=${minLift}, minConviction=${minConviction}, orderLimit=${orderLimit}, algorithm=${algorithmLabel}`
    );
    
    // Lấy đủ orderLimit giao dịch FBT hợp lệ (≥1 SP), quét đơn mới nhất trước
    const { transactions, meta: transactionsSourceMeta } = await getTransactions(orderLimit);
    
    // Chi tiết debug
    console.log(`DEBUG: Số lượng giao dịch: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log(`DEBUG: Giao dịch đầu tiên:`, JSON.stringify(transactions[0]));
    }
    
    // Chỉ kiểm tra nếu không có giao dịch nào
    if (!transactions || transactions.length === 0) {
      console.log("Không có dữ liệu giao dịch nào");
      return {
        frequentItemsets: [],
        message: "Không có dữ liệu giao dịch nào để phân tích",
        success: false
      };
    }
    
    // Determine minSupport: use provided minSupport if >0, otherwise use a dynamic value
    // (moved below so we can base dynamic choice on the number of valid transactions)

    const validTransactions = transactions.filter(trans => {
      return Array.isArray(trans) && trans.length >= 1;
    }).map(trans => {
      // Chuyển đổi tất cả ID thành chuỗi và loại bỏ các ID trùng lặp
      return [...new Set(trans.map(item => String(item)))];
    });
    
    console.log(`Filtered valid transactions: ${validTransactions.length}`);
    
    try {
      // OPTIMIZATION: Kiểm tra số lượng giao dịch trước khi chạy thuật toán
      // Yêu cầu tối thiểu 2 giao dịch (giống repo) để phân tích các mẫu mua cùng nhau
      if (validTransactions.length < 2) {
        console.log("Số lượng giao dịch quá ít, không chạy FP-Growth");
        return {
          frequentItemsets: [],
          message: "Số lượng giao dịch quá ít để phân tích (cần ít nhất 2 giao dịch)",
          success: false
        };
      }

      // Decide which minSupport to use: prefer caller-provided `minSupport`, otherwise dynamic
      const usedMinSupport = (typeof minSupport === 'number' && minSupport > 0)
        ? minSupport
        : getDynamicMinSupport(validTransactions.length);

      console.log(`Using minSupport: ${usedMinSupport}`);

      const startTime = Date.now();
      let results;
      // Timeout tăng theo số giao dịch (không fallback sang thuật toán khác khi lỗi/timeout)
      const TIMEOUT_MS = Math.min(240000, Math.max(45000, 35000 + validTransactions.length * 22));

      const fpgrowth = new FPGrowth.FPGrowth(usedMinSupport);
      console.log("Bắt đầu chạy thuật toán FP-Growth...");

      try {
        const fpGrowthPromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`FP-Growth execution timed out after ${TIMEOUT_MS}ms`));
          }, TIMEOUT_MS);

          fpgrowth.exec(validTransactions)
            .then(results => {
              clearTimeout(timeout);
              resolve(results);
            })
            .catch(err => {
              clearTimeout(timeout);
              reject(err);
            });
        });

        results = await fpGrowthPromise;
      } catch (fpError) {
        console.error("Lỗi khi chạy thuật toán FP-Growth:", fpError.message);
        return {
          frequentItemsets: [],
          strongRules: [],
          message: `FP-Growth thất bại: ${fpError.message}`,
          success: false,
          error: fpError.message,
          info: {
            totalTransactions: validTransactions.length,
            algorithm: algorithmLabel,
            minSupport: usedMinSupport,
            minConfidence,
            minLift,
            minConviction,
            miningRawPatternCount: 0,
            itemsetCandidatesCount: 0,
            frequentItemsetsReturned: 0,
            associationRulesTotal: 0,
            associationRulesReturned: 0,
            fpGrowthTimeoutMs: TIMEOUT_MS,
            ordersScanned: transactionsSourceMeta?.ordersScanned,
            requestedValidTransactions:
              transactionsSourceMeta?.requestedValidTransactions ?? orderLimit,
            collectedValidTransactions:
              transactionsSourceMeta?.collectedValidTransactions ?? validTransactions.length,
          },
        };
      }
      
      const endTime = Date.now();
      
      console.log(`Phân tích xong trong ${(endTime-startTime)/1000}s. Tìm thấy ${results.length} mẫu.`);
      console.log(`DEBUG: Kết quả đầu tiên:`, results.length > 0 ? JSON.stringify(results[0]) : "Không có kết quả");
      
      // Toàn bộ tập phổ biến từ mining (kể cả 1 SP), sắp xếp theo tần suất giảm dần
      const patternsRanked = results
        .filter((pattern) => Array.isArray(pattern?.items) && pattern.items.length >= 1)
        .map((pattern) => {
          // IMPORTANT FIX: Kiểm tra nếu support là số nguyên (>1) thì đó là frequency chứ không phải support
          // Support phải nằm trong khoảng 0-1
          const supportIsCount = typeof pattern.support === 'number' && pattern.support > 1;
          
          // Nếu support thực sự là số lần xuất hiện, tính lại support đúng
          const actualFrequency = supportIsCount ? pattern.support : Math.round(pattern.support * validTransactions.length);
          
          return {
            ...pattern,
            // Lưu trữ frequency thật
            actualFrequency: actualFrequency,
            // Giữ nguyên support gốc để debug
            rawSupport: pattern.support
          };
        })
        .sort((a, b) => b.actualFrequency - a.actualFrequency);

      // FP-Growth có thể trả về hàng chục nghìn mẫu — enrich từng mẫu = N query Mongo → treo/crash Node.
      const FBT_MAX_PATTERNS_ENRICH = Math.max(
        50,
        Math.min(10000, Number(process.env.FBT_MAX_PATTERNS_ENRICH) || 800)
      );
      const frequentPatterns = patternsRanked.slice(0, FBT_MAX_PATTERNS_ENRICH);
      if (patternsRanked.length > frequentPatterns.length) {
        console.warn(
          `FBT: chỉ enrich ${frequentPatterns.length}/${patternsRanked.length} tập phổ biến (cấu hình FBT_MAX_PATTERNS_ENRICH=${FBT_MAX_PATTERNS_ENRICH}).`
        );
      }

      console.log(
        `Enrich top ${frequentPatterns.length} tập (mining raw ${results.length}, đã xếp hạng ${patternsRanked.length}).`
      );
      
      if (patternsRanked.length === 0) {
        console.log("Không tìm thấy mẫu mua hàng nào thỏa mãn điều kiện");
        return {
          frequentItemsets: [],
          strongRules: [],
          message:
            "Không tìm thấy tập phổ biến nào thỏa minSupport. Thử giảm minSupport hoặc các ngưỡng luật; xem log server nếu FP-Growth timeout.",
          success: false,
          info: {
            totalTransactions: validTransactions.length,
            algorithm: algorithmLabel,
            minSupport: usedMinSupport,
            minConfidence,
            minLift,
            minConviction,
            miningRawPatternCount: results.length,
            itemsetCandidatesCount: patternsRanked.length,
            frequentItemsetsReturned: 0,
            associationRulesTotal: 0,
            associationRulesReturned: 0,
            ordersScanned: transactionsSourceMeta?.ordersScanned,
            requestedValidTransactions: transactionsSourceMeta?.requestedValidTransactions ?? orderLimit,
            collectedValidTransactions: transactionsSourceMeta?.collectedValidTransactions ?? validTransactions.length
          }
        };
      }
      const totalOrders =
        transactionsSourceMeta?.ordersScanned ?? validTransactions.length;
      console.log(`Số giao dịch trong tập nguồn (fp_transactions.json): ${totalOrders}`);
      
      // Số lượng giao dịch hợp lệ sử dụng trong thuật toán
      const validTransactionCount = validTransactions.length;
      console.log(`Số giao dịch hợp lệ đưa vào thuật toán: ${validTransactionCount}`);
      
      // OPTIMIZATION: Xử lý bất đồng bộ cho chi tiết sản phẩm để cải thiện hiệu suất
      const patternDetails = await Promise.all(
        frequentPatterns.map(async pattern => {
          try {
            const itemKeys = pattern.items.map((x) => String(x));
            const idMap = await resolveProductKeysToIdMap(itemKeys);
            const oidOrdered = itemKeys.map((k) => idMap.get(k)).filter(Boolean);
            if (oidOrdered.length !== pattern.items.length) {
              console.log(`Không map đủ sku/_id cho pattern: ${pattern.items.join(', ')}`);
              return null;
            }
            const productsRaw = await Product.find({
              _id: { $in: oidOrdered },
            }).select('_id name price image category').lean();
            const byId = new Map(productsRaw.map((p) => [String(p._id), p]));
            const products = oidOrdered.map((oid) => byId.get(String(oid))).filter(Boolean);
            if (products.length !== pattern.items.length) {
              console.log(`Không tìm thấy đủ thông tin sản phẩm cho pattern: ${pattern.items.join(', ')}`);
              return null;
            }
            
            // Sử dụng frequency đã tính ở trên
            const frequency = pattern.actualFrequency;
            
            // FIX: Tính support chính xác từ frequency
            // Support phải dưới 1.0 (100%) và đại diện cho tỷ lệ xuất hiện thực tế
            const actualSupport = frequency / validTransactionCount;
            
            if (frequentPatterns.length <= 30) {
              console.log(
                `Pattern ${pattern.items.join(',')}: frequency=${frequency}/${validTransactionCount} (${(actualSupport * 100).toFixed(2)}%), rawSupport=${pattern.rawSupport}`
              );
            }
            
            return {
              products,
              support: actualSupport, // Tỷ lệ xuất hiện thực tế (0-1)
              confidence: pattern.confidence || 0,
              frequency: frequency, // Số đơn hàng chứa pattern
              totalTransactions: validTransactionCount, // Thêm tổng số để client có thể tính %
              // Thêm các giá trị hiển thị để tiện cho frontend
              supportPercent: `${(actualSupport*100).toFixed(1)}%`,
              frequencyDisplay: `${frequency}/${validTransactionCount}`
            };
          } catch (error) {
            console.error(`Lỗi khi lấy chi tiết pattern: ${error.message}`);
            return null;
          }
        })
      );
      
      // Lọc bỏ các pattern null
      const validPatterns = patternDetails.filter(pattern => pattern !== null);
      
      console.log(`Đã lấy chi tiết cho ${validPatterns.length} mẫu`);
      if (validPatterns.length > 0) {
        console.log(`DEBUG: Mẫu đầu tiên có ${validPatterns[0].products.length} sản phẩm`);
        console.log(`DEBUG: Tỷ lệ xuất hiện: ${validPatterns[0].support}, Tần suất: ${validPatterns[0].frequency} đơn hàng`);
      }
      
      let strongRulesFromFile = [];
      try {
        strongRulesFromFile = await loadFpStrongRulesArray();
      } catch (e) {
        console.error("Lỗi đọc fp_strong_rules.json:", e);
      }
      const associationRulesInSource = strongRulesFromFile.length;
      const strongRulesFiltered = filterStrongRulesByThresholds(
        strongRulesFromFile,
        minConfidence,
        minLift,
        minConviction
      );
      const strongRulesWithProducts = await enrichStrongRulesWithProducts(strongRulesFiltered);

      const result = {
        frequentItemsets: validPatterns,
        strongRules: strongRulesWithProducts,
        message: `Danh sách sản phẩm thường được mua cùng nhau (FP-Growth trên fp_transactions.json; luật mạnh từ fp_strong_rules.json sau lọc conf/lift/conv, ${validTransactions.length} giao dịch)`,
        success: true,
        info: {
          totalTransactions: validTransactions.length,
          totalOrders: totalOrders,
          algorithm: algorithmLabel,
          dataSource: "fp_transactions.json + fp_strong_rules.json",
          minSupport: usedMinSupport,
          minConfidence,
          minLift,
          minConviction,
          processTime: (endTime-startTime)/1000,
          fpGrowthTimeoutMs: TIMEOUT_MS,
          ordersScanned: transactionsSourceMeta?.ordersScanned,
          requestedValidTransactions: transactionsSourceMeta?.requestedValidTransactions ?? orderLimit,
          collectedValidTransactions: transactionsSourceMeta?.collectedValidTransactions ?? validTransactions.length,
          miningRawPatternCount: results.length,
          itemsetCandidatesCount: patternsRanked.length,
          patternsEnrichedCap: FBT_MAX_PATTERNS_ENRICH,
          patternsRankedTotal: patternsRanked.length,
          frequentItemsetsReturned: validPatterns.length,
          associationRulesInSource,
          associationRulesTotal: strongRulesFiltered.length,
          associationRulesReturned: strongRulesWithProducts.length
        }
      };
      
      result.info = {
        ...(result.info && typeof result.info === "object" ? result.info : {}),
        fbtFromCache: false,
        fbtComputedAt: Date.now(),
        fbtCacheMaxAgeMs: FBT_RECOMPUTE_AFTER_MS,
        fbtCacheTtlSec: TTL_FBT_RESULT_SEC,
      };

      cache.set(
        cacheKey,
        { __fbtV2: true, payload: result, cachedAt: Date.now() },
        TTL_FBT_RESULT_SEC
      );
      
      console.log("Kết quả đã được tính toán và cache");
      return result;
    } catch (innerError) {
      console.error("Lỗi trong khối mining FBT:", innerError);
      return {
        frequentItemsets: [],
        strongRules: [],
        message: `Lỗi khi phân tích FBT: ${innerError.message}`,
        success: false,
        error: innerError.message,
      };
    }
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm thường mua cùng nhau:", error);
    return {
      frequentItemsets: [],
      message: "Đã xảy ra lỗi khi phân tích dữ liệu: " + error.message,
      success: false,
      error: error.message
    };
  }
};

// Lấy đề xuất sản phẩm liên quan cho trang chi tiết sản phẩm
const getRelatedProductRecommendations = async (productId, limit = 4) => {
  try {
    // Lấy thông tin sản phẩm hiện tại
    const product = await Product.findById(productId);
    if (!product) return [];

    const pid = String(productId);
    const sku = product.sku != null && String(product.sku).length > 0 ? String(product.sku) : null;
    const rules = filterPairRulesForCustomer(await getPairAssociationRules());
    let recommendedProducts = [];

    const pairKeyToOid = await getPairRuleKeyToOidMap();
    const productOid = String(product._id);
    const antecedentMatchKeys = new Set([pid]);
    if (sku) antecedentMatchKeys.add(sku);
    for (const [key, oid] of pairKeyToOid) {
      if (String(oid) === productOid) antecedentMatchKeys.add(key);
    }

    if (rules.length > 0) {
      const relevantRules = rules
        .filter((rule) => antecedentMatchKeys.has(String(rule.antecedent)))
        .sort((a, b) => b.confidence - a.confidence);

      console.log(`Tìm thấy ${relevantRules.length} luật kết hợp cho sản phẩm ${productId}`);
      
      if (relevantRules.length > 0) {
        const recommendedKeys = [...new Set(relevantRules.map((rule) => String(rule.consequent)))];
        const keyMap = await resolveProductKeysToIdMap(recommendedKeys);
        const oids = [...new Set(recommendedKeys.map((k) => keyMap.get(k)).filter(Boolean))];
        const rows = await Product.find({ _id: { $in: oids } })
          .select('_id name price images rating numReviews')
          .lean();
        const byId = new Map(rows.map((p) => [String(p._id), p]));

        const productsWithConfidence = recommendedKeys
          .map((rawKey) => {
            const oid = keyMap.get(rawKey);
            const p = oid ? byId.get(String(oid)) : null;
            if (!p) return null;
            const rule = relevantRules.find((r) => String(r.consequent) === rawKey);
            return { ...p, confidence: rule ? rule.confidence : 0 };
          })
          .filter(Boolean);

        recommendedProducts = productsWithConfidence
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, limit);

        console.log('Sản phẩm liên quan theo confidence:');
        recommendedProducts.forEach((p, i) => {
          console.log(`${i + 1}. ${p.name} (confidence: ${p.confidence.toFixed(2)})`);
        });
      }
    }

    if (recommendedProducts.length < limit) {
      const triggerKeys = new Set([pid]);
      if (sku) triggerKeys.add(sku);
      const excludeForFp = new Set([pid]);
      if (sku) excludeForFp.add(sku);
      recommendedProducts.forEach((p) => excludeForFp.add(String(p._id)));
      const need = limit - recommendedProducts.length;
      const fpKeys = await getSuggestionKeysFromFpGrowthPatterns(triggerKeys, excludeForFp, need * 3);
      if (fpKeys.length) {
        const SELECT_REL = '_id name price images rating numReviews';
        const more = await fetchProductsByRawKeys(fpKeys, SELECT_REL);
        const seen = new Set(recommendedProducts.map((p) => String(p._id)));
        for (const p of more) {
          const id = String(p._id);
          if (seen.has(id)) continue;
          recommendedProducts.push({ ...p, confidence: 0 });
          seen.add(id);
          if (recommendedProducts.length >= limit) break;
        }
      }
    }

    // 2. Nếu không đủ từ luật cặp, bổ sung từ cùng danh mục
    if (recommendedProducts.length < limit && product.category) {
      const categoryProducts = await Product.find({
        _id: { 
          $ne: productId,
          $nin: recommendedProducts.map(p => p._id)
        },
        category: product.category
      })
      .limit(limit - recommendedProducts.length)
      .select('_id name price images rating numReviews');

      // Thêm confidence = 0 cho các sản phẩm từ cùng danh mục
      const categoryProductsWithConfidence = categoryProducts.map(p => ({
        ...p.toObject(),
        confidence: 0
      }));

      recommendedProducts = [...recommendedProducts, ...categoryProductsWithConfidence];
    }

    // 3. Nếu vẫn không đủ, bổ sung sản phẩm có giá tương tự
    if (recommendedProducts.length < limit) {
      const priceRange = {
        min: product.price * 0.7,
        max: product.price * 1.3
      };

      const similarPriceProducts = await Product.find({
        _id: { 
          $ne: productId,
          $nin: recommendedProducts.map(p => p._id)
        },
        price: { 
          $gte: priceRange.min,
          $lte: priceRange.max
        }
      })
      .limit(limit - recommendedProducts.length)
      .select('_id name price images rating numReviews');

      // Thêm confidence = 0 cho các sản phẩm có giá tương tự
      const similarPriceProductsWithConfidence = similarPriceProducts.map(p => ({
        ...p.toObject(),
        confidence: 0
      }));

      recommendedProducts = [...recommendedProducts, ...similarPriceProductsWithConfidence];
    }

    // Log kết quả cuối cùng
    console.log(`Tổng số sản phẩm liên quan: ${recommendedProducts.length}`);
    console.log('Danh sách sản phẩm liên quan cuối cùng:');
    recommendedProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (confidence: ${p.confidence.toFixed(2)})`);
    });

    return recommendedProducts.slice(0, limit);
  } catch (error) {
    console.error("Lỗi khi tạo đề xuất sản phẩm liên quan:", error);
    return [];
  }
};

const updateFPGrowthRecommendations = async () => {
  try {
    const { transactions } = await getTransactions();
    const TTL_SEC = 3600 * 72;
    const txCount = transactions?.length ?? 0;

    if (!transactions || txCount < 2) {
      console.log("Không đủ dữ liệu để cập nhật FP-Growth");
      cache.set("fp-growth", [], TTL_SEC);
      cache.set("fp-growth-customer", [], TTL_SEC);
      return [];
    }

    const minSupportAdmin = getDynamicMinSupport(txCount);
    const fpGrowthAdmin = new FPGrowth.FPGrowth(minSupportAdmin);
    const frequentItemsetsAdmin = await fpGrowthAdmin.exec(transactions);
    const normalizedPatterns = frequentItemsetsAdmin
      .filter((pattern) => Array.isArray(pattern.items) && pattern.items.length >= 2)
      .map((pattern) => ({ items: pattern.items, support: pattern.support }));

    cache.set("fp-growth", normalizedPatterns, TTL_SEC);

    const minSupportCust = CUSTOMER_REC_MIN_SUPPORT;
    const fpGrowthCust = new FPGrowth.FPGrowth(minSupportCust);
    const frequentItemsetsCust = await fpGrowthCust.exec(transactions);
    let normalizedCustomer = frequentItemsetsCust
      .filter(
        (pattern) =>
          Array.isArray(pattern.items) &&
          pattern.items.length >= CUSTOMER_REC_MIN_ITEMSET_SIZE
      )
      .map((pattern) => ({ items: pattern.items, support: pattern.support }));
    normalizedCustomer = filterFrequentPatternsForCustomer(normalizedCustomer, txCount);

    cache.set("fp-growth-customer", normalizedCustomer, TTL_SEC);

    console.log(
      `[FP-Growth] Cache admin: ${normalizedPatterns.length} mẫu (minSup=${minSupportAdmin}); khách: ${normalizedCustomer.length} mẫu (minSup=${minSupportCust}, |items|≥${CUSTOMER_REC_MIN_ITEMSET_SIZE})`
    );

    return normalizedPatterns;
  } catch (error) {
    console.error("Error in updateFPGrowthRecommendations:", error);
    const cached = cache.get("fp-growth");
    return cached || [];
  }
};

/**
 * Tóm tắt nội dung NodeCache recommendation (RAM) — để debug trong code / REPL.
 * Không dump toàn bộ mảng lớn (transactions, FBT…); chỉ mô tả kích thước / kiểu.
 *
 * Ví dụ REPL: require('./services/recommendationService').getRecommendationCacheDebugSummary()
 *
 * @param {{ includeKeysSample?: boolean }} opts
 */
function getRecommendationCacheDebugSummary(opts = {}) {
  const stats = typeof cache.getStats === 'function' ? cache.getStats() : {};
  const keys = typeof cache.keys === 'function' ? cache.keys() : [];

  const describeValue = (val) => {
    if (val == null) return { kind: 'empty', note: String(val) };
    if (Array.isArray(val)) return { kind: 'array', length: val.length };
    if (typeof val !== 'object')
      return { kind: typeof val, preview: String(val).slice(0, 80) };
    if (val.__fbtV2 === true && val.payload)
      return {
        kind: "FBT_wrapped",
        frequentItemsetsCount: Array.isArray(val.payload.frequentItemsets)
          ? val.payload.frequentItemsets.length
          : 0,
        cachedAt: val.cachedAt,
      };
    const fi = val.frequentItemsets;
    if (Array.isArray(fi))
      return { kind: 'FBT_result', frequentItemsetsCount: fi.length };
    const ks = Object.keys(val);
    return {
      kind: 'object',
      keys: ks.slice(0, 12),
      keyCount: ks.length,
    };
  };

  const entries = keys.map((key) => {
    const val = cache.get(key);
    const entry = { key, ...describeValue(val) };
    let ttlRemainingMs;
    try {
      if (typeof cache.getTtl === 'function') ttlRemainingMs = cache.getTtl(key);
    } catch (_) {
      /* ignore */
    }
    if (ttlRemainingMs != null && ttlRemainingMs > 0) {
      entry.ttlRemainingSec = Math.round(ttlRemainingMs / 1000);
    }
    return entry;
  });

  const out = {
    stats,
    keyCount: keys.length,
    keys: opts.includeKeysSample ? keys : undefined,
    entries,
  };
  return out;
}

module.exports = {
  getPairAssociationRules,
  getCustomerPairAssociationRules,
  getFPGrowthRecommendations,
  getCartRecommendations,
  getHomepageRecommendations,
  getFrequentlyBoughtTogether,
  getRelatedProductRecommendations,
  updateFPGrowthRecommendations,
  clearRecommendationCache,
  invalidateFbtComputedResultsCache,
  preloadFpSourceFiles,
  getRecommendationCacheDebugSummary,
};

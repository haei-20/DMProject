/**
 * Chuẩn hóa id một dòng sản phẩm (FBT / combo / API có thể trả _id, id, hoặc { $oid }).
 */
export function normalizeProductItemId(p) {
  if (!p || typeof p !== 'object') return '';
  const raw = p._id !== undefined && p._id !== null ? p._id : p.id;
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'object') {
    if (typeof raw.$oid === 'string') return raw.$oid.trim();
    if (typeof raw._id === 'string') return raw._id.trim();
    return '';
  }
  const s = String(raw).trim();
  return s === '[object Object]' ? '' : s;
}

/**
 * Chuỗi khớp: tập id sản phẩm duy nhất, sắp xếp — so combo DB với frequent itemsets (gợi ý thuật toán).
 */
export function productSetSignature(items) {
  if (!Array.isArray(items)) return '';
  const ids = new Set();
  for (const p of items) {
    const id = normalizeProductItemId(p);
    if (id) ids.add(id);
  }
  return [...ids].sort().join('|');
}

/** Số sản phẩm khác nhau (theo id) trong pattern — dùng để bật nút tạo combo. */
export function uniqueProductCountInPattern(products) {
  if (!Array.isArray(products)) return 0;
  const ids = new Set();
  for (const p of products) {
    const id = normalizeProductItemId(p);
    if (id) ids.add(id);
  }
  return ids.size;
}

/** Tập chữ ký từ response FBT admin (frequentItemsets) */
export function buildSignatureSetFromFrequentItemsets(data) {
  const set = new Set();
  const list = data?.frequentItemsets;
  if (!Array.isArray(list)) return set;
  for (const row of list) {
    const sig = productSetSignature(row?.products);
    if (sig) set.add(sig);
  }
  return set;
}

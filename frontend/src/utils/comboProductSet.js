/**
 * Chuỗi khớp: tập _id sản phẩm duy nhất, sắp xếp — so combo DB với frequent itemsets (gợi ý thuật toán).
 */
export function productSetSignature(items) {
  if (!Array.isArray(items)) return '';
  const ids = new Set();
  for (const p of items) {
    const id = p && p._id != null ? String(p._id) : '';
    if (id) ids.add(id);
  }
  return [...ids].sort().join('|');
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

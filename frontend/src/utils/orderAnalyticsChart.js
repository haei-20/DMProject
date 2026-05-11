/**
 * Chuẩn hóa số từ API analytics (number, string, BSON Decimal128 {$numberDecimal}, v.v.)
 */
export function coerceNonNegativeNumber(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/,/g, ''));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  if (typeof value === 'object') {
    if (value.$numberDecimal != null) {
      const n = parseFloat(String(value.$numberDecimal));
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * Backend trả revenueByPeriod ghép: [tháng…], [tuần period=week], [năm period=year].
 * Lấy phần tháng: loại week/year (và chấp nhận mục không có period — dữ liệu cũ).
 */
export function extractMonthlyRowsFromRevenueByPeriod(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const monthly = raw.filter((item) => {
    const p = String(item?.period ?? '')
      .trim()
      .toLowerCase();
    return p !== 'week' && p !== 'year';
  });

  return monthly.map((item) => ({
    name: item.name != null ? String(item.name) : '',
    revenue: coerceNonNegativeNumber(item.revenue),
    orders: Math.max(0, Math.round(coerceNonNegativeNumber(item.orders))),
  }));
}

/**
 * Hiển thị địa chỉ giao hàng: ẩn trường rỗng/N/A; sửa đơn cũ nhầm quốc gia vào city.
 */

const EMPTY_TOKENS = new Set([
  '',
  '—',
  '–',
  '-',
  'n/a',
  'na',
  'none',
  '00000',
]);

export function isMeaningfulShippingField(v) {
  if (v == null) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (EMPTY_TOKENS.has(s.toLowerCase())) return false;
  return true;
}

const COUNTRY_ALIASES = {
  'united kingdom': 'United Kingdom',
  uk: 'United Kingdom',
  gb: 'United Kingdom',
  'great britain': 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'northern ireland': 'United Kingdom',
  vietnam: 'Vietnam',
  'viet nam': 'Vietnam',
  usa: 'United States',
  us: 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
};

function resolveCountryToken(s) {
  if (s == null || typeof s !== 'string') return null;
  const k = s.trim().toLowerCase();
  return COUNTRY_ALIASES[k] || null;
}

/** Đồng bộ logic với backend: city chứa tên quốc gia → chuyển sang country */
export function coerceShippingAddressForDisplay(addr) {
  const a = { ...(addr || {}) };
  let city = String(a.city ?? '').trim();
  let country = String(a.country ?? '').trim();

  const cityAsCountry = resolveCountryToken(city);
  const countryCanon = resolveCountryToken(country);

  const countryLooksDefault =
    !country ||
    country.toLowerCase() === 'vietnam' ||
    country.toLowerCase() === 'viet nam';

  if (cityAsCountry && countryLooksDefault) {
    a.country = cityAsCountry;
    a.city = '—';
    return a;
  }

  if (
    city &&
    country &&
    city.toLowerCase() === country.toLowerCase()
  ) {
    a.city = '—';
    return a;
  }

  if (
    cityAsCountry &&
    countryCanon &&
    cityAsCountry === countryCanon
  ) {
    a.city = '—';
  }

  return a;
}

/**
 * @returns {{ label: string, value: string }[]}
 */
export function getAdminShippingDisplayLines(addr) {
  const raw = coerceShippingAddressForDisplay(addr);
  const lines = [];

  if (isMeaningfulShippingField(raw.address)) {
    lines.push({ label: 'Địa chỉ', value: raw.address });
  }

  const country = isMeaningfulShippingField(raw.country)
    ? raw.country
    : null;
  const city = isMeaningfulShippingField(raw.city) ? raw.city : null;

  if (
    city &&
    (!country || city.toLowerCase() !== country.toLowerCase())
  ) {
    lines.push({ label: 'Thành phố / Tỉnh', value: city });
  }

  if (country) {
    lines.push({ label: 'Quốc gia', value: country });
  }

  if (isMeaningfulShippingField(raw.postalCode)) {
    lines.push({ label: 'Mã bưu điện', value: raw.postalCode });
  }

  return lines;
}

/** Một dòng gọn cho modal danh sách đơn */
export function formatShippingSummaryOneLine(addr) {
  const raw = coerceShippingAddressForDisplay(addr);
  const parts = [];
  if (isMeaningfulShippingField(raw.address)) parts.push(raw.address);
  const city = isMeaningfulShippingField(raw.city) ? raw.city : null;
  const country = isMeaningfulShippingField(raw.country)
    ? raw.country
    : null;
  if (city && (!country || city.toLowerCase() !== country.toLowerCase())) {
    parts.push(city);
  }
  if (country) parts.push(country);
  return parts.length ? parts.join(', ') : 'Không có thông tin';
}

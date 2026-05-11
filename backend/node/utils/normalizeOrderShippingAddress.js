/**
 * Chuẩn hóa shippingAddress khi tạo đơn: tránh nhầm tên quốc gia (vd. United Kingdom) vào trường city.
 */

const PLACEHOLDER = '—';

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

function normalizeOrderShippingAddress(raw = {}) {
  let address = String(raw.address ?? '').trim();
  let city = String(raw.city ?? '').trim();
  let postalCode = String(
    raw.postalCode ?? raw.zipCode ?? raw.zip ?? ''
  ).trim();
  let country = String(raw.country ?? '').trim();

  const cityAsCountry = resolveCountryToken(city);

  const countryLooksDefault =
    !country ||
    country.toLowerCase() === 'vietnam' ||
    country.toLowerCase() === 'viet nam';

  if (cityAsCountry && countryLooksDefault) {
    country = cityAsCountry;
    city = '';
  }

  if (
    city &&
    country &&
    city.toLowerCase() === country.toLowerCase()
  ) {
    city = '';
  }

  const countryCanonAfter = resolveCountryToken(country);
  if (
    cityAsCountry &&
    countryCanonAfter &&
    cityAsCountry === countryCanonAfter
  ) {
    city = '';
  }

  const finalCountry =
    resolveCountryToken(country) || country.trim() || 'Vietnam';

  return {
    address: address || PLACEHOLDER,
    city: city || PLACEHOLDER,
    postalCode: postalCode || PLACEHOLDER,
    country: finalCountry,
  };
}

module.exports = {
  normalizeOrderShippingAddress,
  resolveCountryToken,
  PLACEHOLDER,
};

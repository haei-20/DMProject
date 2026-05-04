import store from '../redux/store';

const defaultMoneyFormat = {
  currencySymbol: '£',
  currencyPosition: 'before',
  thousandSeparator: ',',
  decimalSeparator: '.',
  numberOfDecimals: 2,
};

/**
 * Định dạng giá theo cài đặt chung (ký hiệu / vị trí / số lẻ / dấu phân cách) lưu trong Redux.
 * @param {Number} price
 * @returns {String}
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '';

  const num = Number(price);
  if (!Number.isFinite(num)) return '';

  const s = store.getState().siteSettings || {};
  const sym = (s.currencySymbol ?? defaultMoneyFormat.currencySymbol).trim() || defaultMoneyFormat.currencySymbol;
  const pos = s.currencyPosition === 'after' ? 'after' : 'before';
  const thou = s.thousandSeparator ?? defaultMoneyFormat.thousandSeparator;
  const decSep = s.decimalSeparator ?? defaultMoneyFormat.decimalSeparator;
  let decPlaces = parseInt(s.numberOfDecimals, 10);
  if (!Number.isFinite(decPlaces)) decPlaces = defaultMoneyFormat.numberOfDecimals;
  decPlaces = Math.min(4, Math.max(0, decPlaces));

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const fixed = abs.toFixed(decPlaces);
  const [intRaw, fracRaw] = fixed.split('.');
  const intPart = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, thou);
  const numCore =
    decPlaces > 0 && fracRaw !== undefined ? `${intPart}${decSep}${fracRaw}` : intPart;
  const withSign = `${sign}${numCore}`;
  return pos === 'after' ? `${withSign}${sym}` : `${sym}${withSign}`;
};

/**
 * Calculate discount percentage
 * @param {Number} originalPrice - Original price
 * @param {Number} currentPrice - Current price
 * @returns {Number} Discount percentage
 */
export const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

/**
 * Check if product is in stock
 * @param {Object} product - Product object with stock or countInStock
 * @returns {Boolean} True if product is in stock
 */
export const isInStock = (product) => {
  // Ưu tiên sử dụng trường stock, nếu không có thì dùng countInStock
  const stockValue = 
    product.stock !== undefined ? product.stock : 
    (product.countInStock !== undefined ? product.countInStock : 0);
  
  return stockValue > 0;
};

/**
 * Format product image URL
 * @param {String} image - Product image path
 * @returns {String} Formatted image URL
 */
export const formatImageUrl = (image) => {
  if (!image) return '/images/product-placeholder.png';
  
  // If it's already a full URL, return as is
  if (image.startsWith('http')) {
    return image;
  }
  
  // Check if image is a base64 data URL
  if (image.startsWith('data:image')) {
    return image;
  }
  
  // Otherwise, prepend API URL
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  // Remove '/api' from the end to get the base URL
  const baseUrl = apiUrl.includes('/api') 
    ? apiUrl.substring(0, apiUrl.lastIndexOf('/api')) 
    : 'http://localhost:5000';
  
  // Ensure path starts with a slash
  const imagePath = image.startsWith('/') ? image : `/${image}`;
  
  return `${baseUrl}${imagePath}`;
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}; 
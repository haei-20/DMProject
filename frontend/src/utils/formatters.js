import { formatPrice } from './productHelpers';

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeTime - Whether to include time in the output
 * @param {string} options.format - Format type (short, medium, long)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const { includeTime = false, format = 'medium' } = options;
  
  let dateOptions = {};
  
  // Set date format based on format option
  switch (format) {
    case 'short':
      dateOptions = { 
        month: 'numeric', 
        day: 'numeric', 
        year: '2-digit'
      };
      break;
    case 'long':
      dateOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      };
      break;
    case 'medium':
    default:
      dateOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      };
      break;
  }
  
  // Add time if requested
  if (includeTime) {
    dateOptions = {
      ...dateOptions,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    };
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', dateOptions).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a number as currency (theo cài đặt tiền tệ trên site).
 * @param {number} amount
 * @param {string} _currency — giữ tham số để tương thích; không dùng (định dạng lấy từ cài đặt chung).
 */
export const formatCurrency = (amount, _currency = 'GBP') => {
  if (amount === undefined || amount === null) return 'N/A';
  const formatted = formatPrice(amount);
  return formatted === '' ? 'N/A' : formatted;
};

/**
 * Format a number with commas for thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-US').format(num);
  } catch (error) {
    console.error('Number formatting error:', error);
    return `${num}`;
  }
};

/**
 * Truncate a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} ending - Ending to append if truncated (default: '...')
 * @returns {string} Truncated string
 */
export const truncateString = (str, length, ending = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  
  return str.substring(0, length - ending.length) + ending;
};

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param {string} phoneNumber - Input phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // Check if the number is valid (10 digits for US)
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  
  return phoneNumber;
};

 
/**
 * Format date to a readable format
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, includeTime = true) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  // Show relative time for recent dates
  if (diffMinutes < 60) {
    return diffMinutes === 0 
      ? 'Vừa xong' 
      : `${diffMinutes} phút trước`;
  }
  
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  }
  
  // For older dates, use full format
  const options = { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? 'numeric' : undefined
  };
  
  return date.toLocaleDateString('vi-VN', options);
}; 
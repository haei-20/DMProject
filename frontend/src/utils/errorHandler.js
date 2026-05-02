/**
 * Format error messages from API responses
 * @param {Object} error - Error object from RTK Query 
 * @returns {String} Formatted error message
 */
export const formatError = (error) => {
  // Check if it's a server error response with message
  if (error.data && error.data.message) {
    return error.data.message;
  }
  
  // Check if it's a network error
  if (error.error === 'FETCH_ERROR') {
    return 'Network error. Unable to connect to the server.';
  }
  
  // Default error message
  return error.message || 'An unexpected error occurred.';
};

/**
 * Handle response data validation
 * @param {Object} data - Response data from API
 * @returns {Object} Validated data
 */
export const validateResponse = (data) => {
  if (!data) {
    throw new Error('Empty response received from server');
  }
  return data;
}; 
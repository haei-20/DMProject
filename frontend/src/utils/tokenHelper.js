/**
 * Token storage and retrieval utilities
 */

// Set token to localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if token exists and is valid
export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Simple validation - check if token has three parts (header.payload.signature)
    return token.split('.').length === 3;
  } catch (error) {
    return false;
  }
};

// Get user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // If there's an error parsing, remove the corrupt data
    localStorage.removeItem('user');
    return null;
  }
};

// Set user data to localStorage
export const setUserData = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove user data from localStorage
export const removeUserData = () => {
  localStorage.removeItem('user');
}; 
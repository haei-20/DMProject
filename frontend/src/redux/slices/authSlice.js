import { createSlice } from '@reduxjs/toolkit';
import { 
  setToken, 
  getToken, 
  removeToken, 
  getUserData, 
  setUserData, 
  removeUserData, 
  isTokenValid 
} from '../../utils/tokenHelper';

// Helper function to normalize user data and ensure consistent admin status
const normalizeUserData = (userData) => {
  if (!userData) return null;
  
  // Ensure the user object has all required fields with correct casing
  const normalizedUser = {
    ...userData,
    _id: userData._id || userData.id, // Handle both _id and id
    role: userData.role?.toLowerCase() || "user", // Lowercase for consistency
    isAdmin: userData.role?.toLowerCase() === 'admin' || userData.isAdmin === true // Double-check admin status
  };
  
  console.log('Normalized user data:', normalizedUser);
  return normalizedUser;
};

const initialState = {
  user: normalizeUserData(getUserData()),
  token: getToken(),
  isAuthenticated: isTokenValid(),
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setCredentials: (state, action) => {
      // Handle both formats (with and without nested user object)
      const userData = action.payload.user || action.payload;
      const token = action.payload.token || action.payload.token;
      
      // Normalize user data with consistent fields
      const user = normalizeUserData(userData);
      
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Save normalized data to localStorage
      setUserData(user);
      setToken(token);
      
      console.log('Auth state updated with user data:', user);
    },
    authFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      removeUserData();
      removeToken();
      console.log('User logged out');
    },
    updateUserProfile: (state, action) => {
      // Merge updates with existing user data and normalize
      const updatedUser = normalizeUserData({
        ...state.user,
        ...action.payload
      });
      
      state.user = updatedUser;
      setUserData(updatedUser);
      console.log('User profile updated:', updatedUser);
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
});

export const { 
  setCredentials, 
  logout, 
  updateUserProfile, 
  authStart, 
  authFail,
  clearAuthError
} = authSlice.actions;

export default authSlice.reducer; 
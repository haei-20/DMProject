import { isRejectedWithValue } from '@reduxjs/toolkit';
import { logout } from '../redux/slices/authSlice';

/**
 * Middleware that handles auth-related errors and token expiration
 */
export const authMiddleware = (api) => (next) => (action) => {
  // Kiểm tra nếu action là một API call bị từ chối
  if (isRejectedWithValue(action)) {
    const { status, data } = action.payload || {};
    
    // Nếu nhận được lỗi 401 Unauthorized, đăng xuất người dùng
    if (status === 401) {
      console.log('Token không hợp lệ hoặc hết hạn. Đăng xuất...');
      api.dispatch(logout());
    }
    
    // Log lỗi chi tiết cho các request thất bại
    if (status >= 400) {
      console.error(`API Error ${status}:`, data?.message || 'Unknown error');
    }
  }
  
  return next(action);
}; 
import { createSlice } from '@reduxjs/toolkit';
import { api } from '../../services/api';

const initialState = {
  data: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // When fetch wishlist query starts
      .addMatcher(
        api.endpoints.getWishlist.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // When fetch wishlist query succeeds
      .addMatcher(
        api.endpoints.getWishlist.matchFulfilled,
        (state, { payload }) => {
          state.data = payload;
          state.loading = false;
          state.error = null;
        }
      )
      // When fetch wishlist query fails
      .addMatcher(
        api.endpoints.getWishlist.matchRejected,
        (state, { payload }) => {
          state.loading = false;
          state.error = payload?.data?.message || 'Failed to fetch wishlist';
        }
      )
      // When add to wishlist succeeds
      .addMatcher(
        api.endpoints.addToWishlist.matchFulfilled,
        (state, { payload }) => {
          if (payload) {
            state.data = payload;
          }
        }
      )
      // When remove from wishlist succeeds
      .addMatcher(
        api.endpoints.removeFromWishlist.matchFulfilled,
        (state, { payload }) => {
          if (payload) {
            state.data = payload;
          }
        }
      )
      // Clear wishlist on logout
      .addMatcher(
        (action) => action.type === 'auth/logout',
        (state) => {
          state.data = [];
          state.loading = false;
          state.error = null;
        }
      );
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer; 
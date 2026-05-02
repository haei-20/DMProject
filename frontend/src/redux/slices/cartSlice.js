import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely parse JSON from localStorage
const safelyParseJSON = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    localStorage.removeItem(key); // Remove corrupted data
    return defaultValue;
  }
};

const initialState = {
  items: safelyParseJSON('cartItems', []),
  shippingAddress: safelyParseJSON('shippingAddress', {}),
  paymentMethod: localStorage.getItem('paymentMethod') || '',
  itemsPrice: 0,
  shippingPrice: 0,
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.items.find((x) => x._id === item._id);

      if (existItem) {
        state.items = state.items.map((x) => 
          x._id === existItem._id ? item : x
        );
      } else {
        state.items = [...state.items, item];
      }
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((x) => x._id !== action.payload);
      localStorage.setItem('cartItems', JSON.stringify(state.items));
    },
    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((x) => x._id === id);
      if (item) {
        item.quantity = quantity;
        localStorage.setItem('cartItems', JSON.stringify(state.items));
      }
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
    },
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      localStorage.setItem('paymentMethod', action.payload);
    },
    calculatePrices: (state) => {
      state.itemsPrice = state.items.reduce(
        (acc, item) => acc + item.price * item.quantity, 
        0
      );
      // Calculate shipping cost based on total price
      state.shippingPrice = state.itemsPrice > 100 ? 0 : 10;
      state.totalPrice = state.itemsPrice + state.shippingPrice;
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cartItems');
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  saveShippingAddress, 
  savePaymentMethod, 
  calculatePrices, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer; 
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Theme settings
  theme: 'light',
  // Loading states
  isLoading: false,
  loadingMessage: '',
  // Alert notification
  alert: {
    show: false,
    type: 'info',
    message: '',
    timeout: 5000,
  },
  // Modal states
  modals: {
    quickView: {
      show: false,
      productId: null,
    },
    login: {
      show: false,
      redirectUrl: null,
    },
    cart: {
      show: false,
    },
  },
  // Sidebar state for mobile
  sidebar: {
    show: false,
  },
  // Search state
  search: {
    query: '',
    isOpen: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    // Loading actions
    setLoading: (state, action) => {
      state.isLoading = action.payload.isLoading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Alert actions
    showAlert: (state, action) => {
      state.alert = {
        show: true,
        type: action.payload.type || 'info',
        message: action.payload.message,
        timeout: action.payload.timeout || 5000,
      };
    },
    hideAlert: (state) => {
      state.alert.show = false;
    },
    
    // Modal actions
    showModal: (state, action) => {
      const { modalType, data } = action.payload;
      if (modalType in state.modals) {
        state.modals[modalType].show = true;
        
        // Add any additional data to the modal state
        if (data) {
          Object.keys(data).forEach(key => {
            if (key in state.modals[modalType]) {
              state.modals[modalType][key] = data[key];
            }
          });
        }
      }
    },
    hideModal: (state, action) => {
      const modalType = action.payload;
      if (modalType in state.modals) {
        state.modals[modalType].show = false;
      }
    },
    
    // Sidebar actions
    toggleSidebar: (state, action) => {
      state.sidebar.show = action.payload !== undefined ? action.payload : !state.sidebar.show;
    },
    
    // Search actions
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    toggleSearch: (state, action) => {
      state.search.isOpen = action.payload !== undefined ? action.payload : !state.search.isOpen;
    },
    
    // Reset all UI state
    resetUiState: () => initialState,
  },
});

export const {
  setTheme,
  setLoading,
  showAlert,
  hideAlert,
  showModal,
  hideModal,
  toggleSidebar,
  setSearchQuery,
  toggleSearch,
  resetUiState,
} = uiSlice.actions;

export default uiSlice.reducer; 
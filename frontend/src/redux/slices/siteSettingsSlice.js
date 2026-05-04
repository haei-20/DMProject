import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currencyCode: 'GBP',
  currencySymbol: '£',
  currencyPosition: 'before',
  thousandSeparator: ',',
  decimalSeparator: '.',
  numberOfDecimals: 2,
  loaded: false,
};

const siteSettingsSlice = createSlice({
  name: 'siteSettings',
  initialState,
  reducers: {
    setSiteCurrencyFromApi(state, action) {
      const p = action.payload || {};
      if (p.currencyCode != null && p.currencyCode !== '') {
        state.currencyCode = String(p.currencyCode);
      }
      if (p.currencySymbol != null && p.currencySymbol !== '') {
        state.currencySymbol = String(p.currencySymbol);
      }
      if (p.currencyPosition === 'before' || p.currencyPosition === 'after') {
        state.currencyPosition = p.currencyPosition;
      }
      if (p.thousandSeparator != null && p.thousandSeparator !== '') {
        state.thousandSeparator = String(p.thousandSeparator).slice(0, 1);
      }
      if (p.decimalSeparator != null && p.decimalSeparator !== '') {
        state.decimalSeparator = String(p.decimalSeparator).slice(0, 1);
      }
      if (p.numberOfDecimals !== undefined && p.numberOfDecimals !== null && p.numberOfDecimals !== '') {
        const nd = parseInt(p.numberOfDecimals, 10);
        if (Number.isFinite(nd)) {
          state.numberOfDecimals = Math.min(4, Math.max(0, nd));
        }
      }
      state.loaded = true;
    },
  },
});

export const { setSiteCurrencyFromApi } = siteSettingsSlice.actions;
export default siteSettingsSlice.reducer;

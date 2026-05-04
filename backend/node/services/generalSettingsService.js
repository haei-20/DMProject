const Setting = require("../models/Setting");

const defaultGeneralSettings = {
  type: "general",
  siteName: "2NADH",
  siteDescription: "Cửa hàng thương mại điện tử",
  logo: "https://via.placeholder.com/200x60?text=2NADH",
  favicon: "https://via.placeholder.com/32x32",
  email: "contact@example.com",
  phone: "+84 123 456 789",
  address: "Hà Nội, Việt Nam",
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
  },
  metaTags: {
    title: "2NADH - Cửa hàng thương mại điện tử",
    description: "Mua sắm trực tuyến với giá tốt nhất",
    keywords: "thương mại điện tử, mua sắm, trực tuyến",
  },
  currencyCode: "GBP",
  currencySymbol: "£",
  currencyPosition: "before",
  thousandSeparator: ",",
  decimalSeparator: ".",
  numberOfDecimals: 2,
};

function stripInternalFields(generalSettings) {
  delete generalSettings._id;
  if (generalSettings.__v !== undefined) delete generalSettings.__v;
  if (generalSettings.createdAt) delete generalSettings.createdAt;
  if (generalSettings.updatedAt) delete generalSettings.updatedAt;
  if (generalSettings.updatedBy) delete generalSettings.updatedBy;
  return generalSettings;
}

function normalizeCurrencyFields(merged) {
  if (
    merged.currencyCode === "GBP" &&
    merged.thousandSeparator === "." &&
    merged.decimalSeparator === ","
  ) {
    merged.thousandSeparator = ",";
    merged.decimalSeparator = ".";
  }
  return merged;
}

/**
 * Gộp cài đặt chung từ DB với mặc định (dùng cho admin GET và public currency).
 */
async function getMergedGeneralSettings() {
  const generalSettingsDoc = await Setting.findOne({ type: "general" }).lean();
  const stored = generalSettingsDoc?.data;
  let generalSettings =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? { ...defaultGeneralSettings, ...stored, type: "general" }
      : { ...defaultGeneralSettings };

  stripInternalFields(generalSettings);
  normalizeCurrencyFields(generalSettings);
  return generalSettings;
}

function getPublicCurrencyPayload(merged) {
  const nd = parseInt(merged.numberOfDecimals, 10);
  return {
    currencyCode: merged.currencyCode,
    currencySymbol: merged.currencySymbol,
    currencyPosition: merged.currencyPosition,
    thousandSeparator: merged.thousandSeparator,
    decimalSeparator: merged.decimalSeparator,
    numberOfDecimals: Number.isFinite(nd)
      ? Math.min(4, Math.max(0, nd))
      : 2,
  };
}

module.exports = {
  defaultGeneralSettings,
  getMergedGeneralSettings,
  getPublicCurrencyPayload,
};

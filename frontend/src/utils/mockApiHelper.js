// Utility for generating mock data and simulating API responses
import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const MOCK_PRODUCTS_KEY = 'mock_products';
const MOCK_DEAL_HOT_KEY = 'mock_deal_hot';

// Helper to get mock products from localStorage
export const getMockProducts = () => {
  try {
    const products = localStorage.getItem(MOCK_PRODUCTS_KEY);
    if (products) {
      return JSON.parse(products);
    }
    
    // Generate some mock products if none exist
    const mockProducts = generateMockProducts();
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(mockProducts));
    return mockProducts;
  } catch (error) {
    console.error('Error getting mock products:', error);
    return [];
  }
};

// Helper to save mock products to localStorage
export const saveMockProducts = (products) => {
  try {
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving mock products:', error);
  }
};

// Helper to get mock deal hot products
export const getMockDealHotProducts = () => {
  try {
    const dealHotProducts = localStorage.getItem(MOCK_DEAL_HOT_KEY);
    if (dealHotProducts) {
      return JSON.parse(dealHotProducts);
    }
    return [];
  } catch (error) {
    console.error('Error getting mock deal hot products:', error);
    return [];
  }
};

// Helper to save mock deal hot products
export const saveMockDealHotProducts = (products) => {
  try {
    localStorage.setItem(MOCK_DEAL_HOT_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving mock deal hot products:', error);
  }
};

// Generate random mock products for testing
export const generateMockProducts = (count = 10) => {
  const categories = ['Điện thoại', 'Laptop', 'Tablet', 'Phụ kiện', 'Thiết bị điện tử'];
  
  return Array.from({ length: count }, (_, i) => ({
    _id: uuidv4(),
    name: `Sản phẩm mẫu ${i + 1}`,
    description: `Mô tả sản phẩm mẫu ${i + 1}`,
    price: Math.floor(Math.random() * 10000000) + 500000,
    image: `https://via.placeholder.com/300x300?text=Product${i+1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    tags: ['sample', 'mock'],
    stock: Math.floor(Math.random() * 100) + 1,
    createdAt: new Date().toISOString(),
  }));
};

// Add a product to deal hot
export const addMockDealHot = (product, salePrice, startDate, endDate) => {
  const dealHotProducts = getMockDealHotProducts();
  
  // Check if product already exists
  const existingIndex = dealHotProducts.findIndex(p => p._id === product._id);
  
  const updatedProduct = {
    ...product,
    salePrice,
    dealStartDate: startDate,
    dealEndDate: endDate,
    category: 'Deal hot',
    tags: [...(product.tags || []), 'deal-hot']
  };
  
  if (existingIndex >= 0) {
    dealHotProducts[existingIndex] = updatedProduct;
  } else {
    dealHotProducts.push(updatedProduct);
  }
  
  saveMockDealHotProducts(dealHotProducts);
  return updatedProduct;
};

// Remove a product from deal hot
export const removeMockDealHot = (productId) => {
  const dealHotProducts = getMockDealHotProducts();
  const updatedDealHot = dealHotProducts.filter(p => p._id !== productId);
  saveMockDealHotProducts(updatedDealHot);
};

export default {
  getMockProducts,
  saveMockProducts,
  getMockDealHotProducts,
  saveMockDealHotProducts,
  generateMockProducts,
  addMockDealHot,
  removeMockDealHot
}; 
import React from 'react';
import { Table, ProgressBar, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';
import './TopProductsTable.css';

const TopProductsTable = ({ products = [], loading = false, error = null }) => {
  const getCategoryLabel = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    return category.name || 'Uncategorized';
  };

  // Get stock status
  const getStockStatus = (stockValue) => {
    if (stockValue === 0 || stockValue === null || stockValue === undefined) {
      return { variant: 'danger', text: 'Out of Stock' };
    } else if (stockValue < 10) {
      return { variant: 'warning', text: 'Low Stock' };
    } else {
      return { variant: 'success', text: 'In Stock' };
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Show loading spinner
  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading product data...</p>
      </div>
    );
  }
  
  // Show error
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-2" size={18} />
          <strong>Error loading product data</strong>
        </div>
        <p className="mb-0 mt-2">{error.message || 'An unknown error occurred'}</p>
      </Alert>
    );
  }
  
  // Show empty state
  if (!products || products.length === 0) {
    return (
      <div className="text-center p-4">
        <FaBoxOpen size={32} className="text-muted mb-3" />
        <p className="mb-0">No product data available.</p>
      </div>
    );
  }
  
  // Calculate the maximum value for progress bar
  const maxSales = Math.max(...products.map(product => product.totalSales || 0));
  
  return (
    <div className="top-products-table">
      <Table responsive hover>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Sold</th>
            <th>Revenue</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stockValue = product.stock !== undefined ? product.stock : (product.countInStock || 0);
            const stockStatus = getStockStatus(stockValue);
            
            return (
              <tr key={product._id}>
                <td>
                  <div className="product-info">
                    <div className="product-image">
                      <img 
                        src={product.image || "https://via.placeholder.com/50"}
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/50";
                        }}
                      />
                    </div>
                    <div className="product-details">
                      <Link to={`/admin/products/${product._id}`} className="product-name">
                        {product.name}
                      </Link>
                      <span className="product-category">{getCategoryLabel(product.category)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {product.salePrice ? (
                    <div className="price-container">
                      <span className="current-price">{formatCurrency(product.salePrice)}</span>
                      <span className="original-price">{formatCurrency(product.price)}</span>
                    </div>
                  ) : (
                    formatCurrency(product.price || 0)
                  )}
                </td>
                <td>
                  <div className="sales-data">
                    <span className="sales-count">{product.totalSales || 0}</span>
                    <ProgressBar 
                      now={(product.totalSales || 0) / (maxSales || 1) * 100} 
                      variant="primary"
                      className="sales-progress"
                    />
                  </div>
                </td>
                <td>{formatCurrency((product.totalSales || 0) * (product.salePrice || product.price || 0))}</td>
                <td>
                  <Badge bg={stockStatus.variant} className="stock-badge">
                    {stockStatus.text}
                  </Badge>
                  <span className="stock-count">{stockValue} units</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default TopProductsTable; 